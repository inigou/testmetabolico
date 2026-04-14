import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export async function POST(request) {
  try {
    const { email, objetivo_id, plan_actual, evento, dia_evento, perfil } = await request.json();

    if (!plan_actual || !evento || !email) {
      return Response.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Determinar qué días se ven afectados por el evento
    // El día del evento + el día siguiente (recuperación)
    const idxEvento = dia_evento ?? 5; // default sábado
    const idxRecuperacion = (idxEvento + 1) % 7;
    const diaEventoNombre = DIAS[idxEvento];
    const diaRecuperacionNombre = DIAS[idxRecuperacion];

    // Extraer solo los nodos afectados para minimizar tokens
    const nodoEventoActual = {
      dieta: plan_actual.dieta?.[idxEvento],
      ejercicios: plan_actual.ejercicios?.[idxEvento],
    };
    const nodoRecuperacionActual = {
      dieta: plan_actual.dieta?.[idxRecuperacion],
      ejercicios: plan_actual.ejercicios?.[idxRecuperacion],
    };

    const prompt = `Eres un especialista en nutrición deportiva y metabolismo.

El usuario tiene el siguiente evento: "${evento}"
Día del evento: ${diaEventoNombre} (índice ${idxEvento})
Día de recuperación: ${diaRecuperacionNombre} (índice ${idxRecuperacion})

Perfil del usuario: ICM ${perfil?.icm}/100, objetivo: ${perfil?.objetivo || 'mantener peso'}

Plan actual del día del evento (${diaEventoNombre}):
${JSON.stringify(nodoEventoActual, null, 2)}

Plan actual del día de recuperación (${diaRecuperacionNombre}):
${JSON.stringify(nodoRecuperacionActual, null, 2)}

INSTRUCCIONES:
- Adapta SOLO estos 2 días al evento registrado
- Para el día del evento: ajusta comidas a lo que sea más realista dado el evento (si es boda, incluye estrategia de control de daños)
- Para el día de recuperación: protocolo de recuperación metabólica (ayuno suave, hidratación, antioxidantes, sin entreno intenso)
- Mantén el formato exacto incluyendo kcal por comida
- Devuelve SOLO JSON válido sin markdown con esta estructura exacta:

{
  "dia_evento": {
    "dieta": {"dia":"${diaEventoNombre}","desayuno":"texto","kcal_desayuno":000,"comida":"texto","kcal_comida":000,"cena":"texto","kcal_cena":000,"snack":"texto","kcal_snack":000},
    "ejercicios": {"dia":"${diaEventoNombre} descripcion","tipo":"texto","ejercicios":["texto"]}
  },
  "dia_recuperacion": {
    "dieta": {"dia":"${diaRecuperacionNombre}","desayuno":"texto","kcal_desayuno":000,"comida":"texto","kcal_comida":000,"cena":"texto","kcal_cena":000,"snack":"texto","kcal_snack":000},
    "ejercicios": {"dia":"${diaRecuperacionNombre} descripcion","tipo":"texto","ejercicios":["texto"]}
  },
  "mensaje_coach": "Mensaje explicativo de los cambios realizados (máximo 2 frases, empático y directo)"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    let texto = message.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const cambios = JSON.parse(texto);

    // Aplicar cambios al plan completo
    const planModificado = JSON.parse(JSON.stringify(plan_actual));
    if (cambios.dia_evento?.dieta)      planModificado.dieta[idxEvento]      = cambios.dia_evento.dieta;
    if (cambios.dia_evento?.ejercicios) planModificado.ejercicios[idxEvento] = cambios.dia_evento.ejercicios;
    if (cambios.dia_recuperacion?.dieta)      planModificado.dieta[idxRecuperacion]      = cambios.dia_recuperacion.dieta;
    if (cambios.dia_recuperacion?.ejercicios) planModificado.ejercicios[idxRecuperacion] = cambios.dia_recuperacion.ejercicios;

    // Persistir en Supabase
    await fetch(`${SB_URL}/rest/v1/user_plans`, {
      method: 'POST',
      headers: sbH,
      body: JSON.stringify({
        email,
        objetivo_id: objetivo_id || 'mantener',
        plan_json: planModificado,
        updated_at: new Date().toISOString(),
      }),
    });

    return Response.json({
      plan: planModificado,
      mensaje_coach: cambios.mensaje_coach || '',
      dias_modificados: [diaEventoNombre, diaRecuperacionNombre],
    });

  } catch (error) {
    console.error('rewrite-plan error:', error);
    return Response.json({ error: 'Error al reescribir el plan' }, { status: 500 });
  }
}