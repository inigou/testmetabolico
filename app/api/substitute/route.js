import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const METS = {
  pesas: 6.0, hiit: 8.5, cardio: 5.5, running: 7.0, natacion: 7.0,
  yoga: 3.0, surf: 5.5, caminar: 3.5, senderismo: 5.5, padel: 4.5,
  bici: 5.0, crossfit: 8.0, pilates: 3.5, baile: 4.5,
};

function detectarMET(texto) {
  const t = texto.toLowerCase();
  for (const [key, val] of Object.entries(METS)) { if (t.includes(key)) return val; }
  return 5.5;
}
function extraerDuracion(texto) {
  const match = texto.match(/(\d+)\s*(min|minuto|hora|h)/i);
  if (!match) return 45;
  const n = parseInt(match[1]);
  return match[2].startsWith('h') ? n * 60 : n;
}

export async function POST(request) {
  try {
    const { comida_actual, peticion, tipo, objetivo, peso_usuario = 75, kcal_actual } = await request.json();
    if (!comida_actual) return Response.json({ error: 'Faltan datos' }, { status: 400 });

    const esEjercicio  = tipo === 'entreno';
    const esQuickAdd   = tipo === 'quick_add';

    // ── MODO QUICK ADD: traducir texto libre a kcal ──────────────────
    if (esQuickAdd) {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Analiza este texto y devuelve SOLO JSON sin markdown:
{"kcal": número, "tipo": "ingesta" o "gasto", "descripcion": "descripción concisa", "delta_kcal": número positivo si ingesta, negativo si gasto}

Texto: "${comida_actual}"

Reglas:
- ingesta = comida/bebida que el usuario ha consumido (kcal positivas, impacta consumido)
- gasto = actividad física extra (kcal negativas, impacta presupuesto)
- Estima calorías con precisión razonable
- descripcion: máximo 8 palabras`,
        }],
      });
      let texto = message.content[0].text.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const r = JSON.parse(texto);
      return Response.json({
        sustitucion: r.descripcion,
        delta_kcal: r.delta_kcal || (r.tipo === 'ingesta' ? r.kcal : -r.kcal),
        kcal_nuevas: r.kcal,
        tipo_quick_add: r.tipo,
        mensaje_coach: '',
      });
    }

    // ── MODO EJERCICIO ───────────────────────────────────────────────
    if (esEjercicio) {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Eres especialista en fisiología del ejercicio. El usuario cambia su actividad.
Devuelve SOLO JSON sin markdown:
{"sustitucion":"descripción actividad nueva con duración","kcal_nuevas":número,"delta_kcal":número,"mensaje_coach":"frase 1 línea max 15 palabras"}

Actividad actual: ${comida_actual} (${kcal_actual || 0} kcal)
Nueva petición: ${peticion}
Peso usuario: ${peso_usuario}kg
Objetivo: ${objetivo}

kcal_nuevas = kcal que quemará con la nueva actividad
delta_kcal = kcal_nuevas - kcal_actuales (positivo si quema más, negativo si quema menos)`,
        }],
      });
      let texto = message.content[0].text.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      let result = JSON.parse(texto);

      // Fallback cálculo manual
      if (result.delta_kcal === undefined || result.kcal_nuevas === undefined) {
        const metOrig  = detectarMET(comida_actual);
        const metNuevo = detectarMET(result.sustitucion || peticion);
        const durOrig  = extraerDuracion(comida_actual);
        const durNueva = extraerDuracion(result.sustitucion || peticion);
        const kcalOrig  = kcal_actual || Math.round(metOrig  * peso_usuario * (durOrig  / 60));
        const kcalNueva = Math.round(metNuevo * peso_usuario * (durNueva / 60));
        result.kcal_nuevas = kcalNueva;
        result.delta_kcal  = kcalNueva - kcalOrig;
      }
      return Response.json(result);
    }

    // ── MODO COMIDA ──────────────────────────────────────────────────
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Eres nutricionista. El usuario adapta una comida.
Devuelve SOLO JSON sin markdown:
{"sustitucion":"descripción nueva comida con gramos","kcal_nuevas":número,"delta_kcal":número,"mensaje_coach":""}

Comida actual (${tipo}): ${comida_actual} (${kcal_actual || 0} kcal aprox)
Petición: ${peticion}
Objetivo: ${objetivo}

kcal_nuevas = calorías de la nueva comida
delta_kcal  = kcal_nuevas - kcal_actuales`,
      }],
    });
    let texto = message.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return Response.json(JSON.parse(texto));

  } catch (error) {
    console.error('Substitute API error:', error);
    return Response.json({ error: 'Error al sustituir' }, { status: 500 });
  }
}