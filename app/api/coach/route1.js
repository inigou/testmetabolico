import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

async function obtenerLogsBiologicos(email) {
  if (!email) return { hoy: null, ayer: null };
  try {
    const hoy  = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res = await fetch(
      `${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=in.(${hoy},${ayer})&order=fecha.desc&select=fecha,energia,sueno,estres,completed_tasks`,
      { headers: sbH }
    );
    const rows = await res.json();
    return { hoy: rows.find(r => r.fecha === hoy) || null, ayer: rows.find(r => r.fecha === ayer) || null };
  } catch (e) { return { hoy: null, ayer: null }; }
}

function buildContextoBiologico(logs) {
  const { hoy, ayer } = logs;
  if (!hoy && !ayer) return '';
  const lines = [];
  if (hoy) {
    const completados = hoy.completed_tasks ? Object.values(hoy.completed_tasks).filter(Boolean).length : 0;
    const total = hoy.completed_tasks ? Object.keys(hoy.completed_tasks).length : 0;
    lines.push(`ESTADO BIOLÓGICO HOY (${hoy.fecha}):`);
    lines.push(`- Energía: ${hoy.energia}/10${hoy.energia <= 4 ? ' ⚠️ baja' : hoy.energia >= 8 ? ' ✓ alta' : ''}`);
    lines.push(`- Sueño: ${hoy.sueno}/10${hoy.sueno <= 4 ? ' ⚠️ malo' : hoy.sueno >= 8 ? ' ✓ muy bueno' : ''}`);
    lines.push(`- Estrés: ${hoy.estres}/10${hoy.estres >= 7 ? ' ⚠️ elevado' : hoy.estres <= 3 ? ' ✓ bajo' : ''}`);
    if (total > 0) lines.push(`- Tareas completadas: ${completados}/${total}`);
  }
  if (ayer) lines.push(`\nAYER: Energía ${ayer.energia}/10 · Sueño ${ayer.sueno}/10 · Estrés ${ayer.estres}/10`);
  const alertas = [];
  if (hoy?.sueno <= 4)   alertas.push('sueño muy malo — evita entreno intenso');
  if (hoy?.estres >= 8)  alertas.push('estrés muy alto — prioriza recuperación');
  if (hoy?.energia <= 3) alertas.push('energía crítica — adapta a esfuerzo mínimo');
  if (hoy?.energia >= 8 && hoy?.sueno >= 7) alertas.push('pico de forma — día ideal para esfuerzo máximo');
  if (alertas.length > 0) lines.push(`\nADAPTACIONES: ${alertas.join('; ')}.`);
  return lines.join('\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, perfil, tipo, historial, contexto_dia, email } = body;

    if (!perfil) return Response.json({ error: "Datos de perfil no proporcionados" }, { status: 400 });

    const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── PLAN SEMANAL ─────────────────────────────────────────────────
    if (tipo === 'plan') {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: `Eres un especialista en nutricion deportiva. Genera planes semanales en JSON estricto con calorías por comida.
OBJETIVO DEL USUARIO: ${perfil.objetivo}
${perfil.preferencias ? `PREFERENCIAS Y RESTRICCIONES (OBLIGATORIO RESPETAR): ${perfil.preferencias}` : ''}

REGLAS ABSOLUTAS:
- Responde SOLO con JSON valido, sin texto antes ni despues, sin backticks ni markdown
- USA SOLO comillas dobles para strings
- NUNCA dejes comas finales
- Incluye OBLIGATORIAMENTE las kcal de cada comida (son críticas para el sistema calórico)

Estructura JSON exacta (kcal_* son OBLIGATORIOS en cada día):
{"directrices":["texto x6"],"dieta":[{"dia":"Lunes","desayuno":"texto con gramos","kcal_desayuno":000,"comida":"texto con gramos","kcal_comida":000,"cena":"texto con gramos","kcal_cena":000,"snack":"texto con gramos","kcal_snack":000} x7 dias],"ejercicios":[{"dia":"Lunes descripcion","tipo":"texto","ejercicios":["texto"],"kcal_quemadas":000} x7 dias],"compra":{"Proteinas":["item"],"Verduras":["item"],"Hidratos":["item"],"Grasas":["item"]},"suplementos":[{"nombre":"texto","dosis":"texto","prioridad":"Esencial","motivo":"texto"}]}`,
        messages: [{
          role: "user",
          content: `Genera plan para objetivo: ${perfil.objetivo}. ICM ${perfil.icm}/100, edad metabolica ${perfil.edad_metabolica} años, mejor ${perfil.mejor_bloque}, peor ${perfil.peor_bloque}.
${perfil.preferencias ? `\nRESPETA ESTRICTAMENTE: ${perfil.preferencias}` : ''}

IMPORTANTE — KCAL OBLIGATORIAS:
- Cada comida DEBE tener su campo kcal_* con un número realista
- Cada entreno DEBE tener kcal_quemadas estimadas
- Usa gramos exactos en las descripciones: "Pechuga de pollo 200g + arroz integral 80g"
- El total diario debe cuadrar con el objetivo calórico del usuario

Responde SOLO JSON valido sin markdown.`,
        }],
      });

      let texto = message.content[0].text.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      try {
        const plan = JSON.parse(texto);
        return Response.json({ plan });
      } catch (e) {
        console.error('JSON parse error:', e.message);
        return Response.json({ error: 'Error generando el plan. Inténtalo de nuevo.' }, { status: 500 });
      }
    }

    // ── COACH CONVERSACIONAL ─────────────────────────────────────────
    const logsBio = await obtenerLogsBiologicos(email);
    const contextoBiologico = buildContextoBiologico(logsBio);

    const historialMensajes = (historial || [])
      .filter(m => m.texto && !m.cargando)
      .slice(-10)
      .map(m => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto }));

    const contextoHoyTexto = contexto_dia ? `
PLAN DE HOY:
- Estado metabólico: ${contexto_dia.weather || 'N/A'}
- Comidas: ${contexto_dia.comidas ? `Desayuno: ${contexto_dia.comidas.desayuno} | Comida: ${contexto_dia.comidas.comida} | Cena: ${contexto_dia.comidas.cena}` : 'Sin plan'}
- Entreno: ${contexto_dia.entrenamiento ? `${contexto_dia.entrenamiento.tipo}: ${(contexto_dia.entrenamiento.ejercicios || []).join(', ')}` : 'Descanso'}
` : '';

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Actua como Especialista Senior en Nutricion Deportiva, Antropometria y Medicina Preventiva Funcional para mymetaboliq.com.

OBJETIVO DEL USUARIO: ${perfil.objetivo || 'No especificado'}

${contextoBiologico ? `━━━ DATOS BIOLÓGICOS REALES (BD) ━━━
${contextoBiologico}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Personaliza ACTIVAMENTE tu respuesta según estos datos reales.
` : ''}

ESTILO: Máximo 200 palabras. Directo y cercano. 1 emoji opcional. Sin diagnósticos ni medicación.
NUNCA hagas preguntas al usuario — el perfil ya tiene los datos.`,

      messages: [
        { role: "user", content: `Perfil: ICM ${perfil.icm}/100 (${perfil.categoria}), edad metabolica ${perfil.edad_metabolica} años, mejor ${perfil.mejor_bloque}, peor ${perfil.peor_bloque}. ECO:${perfil.eco} EFH:${perfil.efh} NUT:${perfil.nut} DES:${perfil.des} VIT:${perfil.vit}. Hoy: ${fechaHoy}.${contextoHoyTexto}` },
        { role: "assistant", content: "Perfecto, tengo tu perfil y estado de hoy. Dime qué necesitas." },
        ...historialMensajes,
        { role: "user", content: pregunta },
      ],
    });

    return Response.json({ respuesta: message.content[0].text });

  } catch (error) {
    console.error('Coach API error:', error);
    return Response.json({ error: "Error al conectar con el coach" }, { status: 500 });
  }
}