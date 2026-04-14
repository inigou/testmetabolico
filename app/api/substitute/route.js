import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// MET aproximados por actividad (kcal/kg/h)
const METS = {
  pesas: 6.0, hiit: 8.5, cardio: 5.5, running: 7.0, natacion: 7.0,
  yoga: 3.0, surf: 5.5, caminar: 3.5, senderismo: 5.5, padel: 4.5,
  bici: 5.0, crossfit: 8.0, pilates: 3.5, baile: 4.5,
};

function detectarMET(texto) {
  const t = texto.toLowerCase();
  for (const [key, val] of Object.entries(METS)) { if (t.includes(key)) return val; }
  return 5.5; // fallback moderado
}

function extraerDuracion(texto) {
  const match = texto.match(/(\d+)\s*(min|minuto|hora|h)/i);
  if (!match) return 45;
  const n = parseInt(match[1]);
  return match[2].startsWith('h') ? n * 60 : n;
}

export async function POST(request) {
  try {
    const { comida_actual, peticion, tipo, objetivo, peso_usuario = 75 } = await request.json();
    if (!comida_actual || !peticion) return Response.json({ error: 'Faltan datos' }, { status: 400 });

    const esEjercicio = tipo === 'entreno';

    const systemPrompt = esEjercicio
      ? `Eres un especialista en fisiología del ejercicio. El usuario quiere cambiar su actividad física de hoy.
Reglas:
- Devuelve SOLO un JSON válido sin markdown: {"sustitucion":"texto de la nueva actividad","delta_kcal":número,"mensaje_coach":"frase de 1 línea sugerida al coach"}
- sustitucion: describe la nueva actividad con duración (ej: "Surf libre 90 min — intensidad moderada")
- delta_kcal: diferencia calórica respecto a la actividad original. Positivo si quema más, negativo si quema menos. Puede ser 0.
- mensaje_coach: sugerencia táctica breve (ej: "He añadido snack post-surf de 30g proteína"). Máx 15 palabras.
- Objetivo del usuario: ${objetivo}`
      : `Eres un nutricionista que hace sustituciones de ingredientes.
Reglas:
- Devuelve SOLO un JSON válido sin markdown: {"sustitucion":"texto de la comida adaptada","delta_kcal":0,"mensaje_coach":""}
- Mantén el mismo aporte calórico aproximado
- Usa ingredientes comunes con gramos exactos
- Objetivo del usuario: ${objetivo}`;

    const userPrompt = esEjercicio
      ? `Actividad actual: ${comida_actual}\nPetición del usuario: ${peticion}\n\nDevuelve SOLO el JSON.`
      : `Comida actual (${tipo}): ${comida_actual}\nPetición: ${peticion}\n\nDevuelve SOLO el JSON.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let texto = message.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let result = JSON.parse(texto);

    // Fallback: calcular delta calórico si la IA no lo incluyó correctamente
    if (esEjercicio && (result.delta_kcal === undefined || result.delta_kcal === null)) {
      const metOriginal = detectarMET(comida_actual);
      const metNuevo    = detectarMET(result.sustitucion || peticion);
      const durOriginal = extraerDuracion(comida_actual);
      const durNueva    = extraerDuracion(result.sustitucion || peticion);
      const kcalOriginal = Math.round(metOriginal * peso_usuario * (durOriginal / 60));
      const kcalNueva    = Math.round(metNuevo    * peso_usuario * (durNueva    / 60));
      result.delta_kcal = kcalNueva - kcalOriginal;
    }

    return Response.json(result);

  } catch (error) {
    console.error('Substitute API error:', error);
    return Response.json({ error: 'Error al sustituir' }, { status: 500 });
  }
}