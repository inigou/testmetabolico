import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// ── Obtiene los logs de hoy y ayer directamente desde el servidor ──
async function obtenerLogsBiologicos(email) {
  if (!email) return { hoy: null, ayer: null };
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const res = await fetch(
      `${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=in.(${hoy},${ayer})&order=fecha.desc&select=fecha,energia,sueno,estres,completed_tasks`,
      { headers: sbH }
    );
    const rows = await res.json();

    const logHoy  = rows.find(r => r.fecha === hoy)  || null;
    const logAyer = rows.find(r => r.fecha === ayer) || null;

    return { hoy: logHoy, ayer: logAyer };
  } catch (e) {
    console.error('obtenerLogsBiologicos error:', e);
    return { hoy: null, ayer: null };
  }
}

// ── Construye el contexto biológico en lenguaje natural ────────────
function buildContextoBiologico(logs) {
  const { hoy, ayer } = logs;
  if (!hoy && !ayer) return '';

  const lines = [];

  if (hoy) {
    const completados = hoy.completed_tasks ? Object.values(hoy.completed_tasks).filter(Boolean).length : 0;
    const total = hoy.completed_tasks ? Object.keys(hoy.completed_tasks).length : 0;

    lines.push(`ESTADO BIOLÓGICO HOY (${hoy.fecha}):`);
    lines.push(`- Energía: ${hoy.energia}/10${hoy.energia <= 4 ? ' ⚠️ baja' : hoy.energia >= 8 ? ' ✓ alta' : ''}`);
    lines.push(`- Calidad de sueño: ${hoy.sueno}/10${hoy.sueno <= 4 ? ' ⚠️ malo' : hoy.sueno >= 8 ? ' ✓ muy bueno' : ''}`);
    lines.push(`- Estrés: ${hoy.estres}/10${hoy.estres >= 7 ? ' ⚠️ elevado' : hoy.estres <= 3 ? ' ✓ bajo' : ''}`);
    if (total > 0) lines.push(`- Tareas completadas hoy: ${completados}/${total}`);
  }

  if (ayer) {
    lines.push(`\nESTADO DE AYER (${ayer.fecha}):`);
    lines.push(`- Energía: ${ayer.energia}/10 · Sueño: ${ayer.sueno}/10 · Estrés: ${ayer.estres}/10`);
  }

  // Alertas específicas que el coach debe tener en cuenta
  const alertas = [];
  if (hoy?.sueno <= 4)   alertas.push('el usuario durmió muy mal — evita recomendar entreno intenso hoy');
  if (hoy?.estres >= 8)  alertas.push('el usuario tiene estrés muy alto — prioriza recuperación sobre rendimiento');
  if (hoy?.energia <= 3) alertas.push('energía crítica — adapta cualquier recomendación a mínimo esfuerzo');
  if (hoy?.energia >= 8 && hoy?.sueno >= 7) alertas.push('el usuario está en su pico — es buen día para esfuerzo máximo');

  if (alertas.length > 0) {
    lines.push(`\nADAPTACIONES OBLIGATORIAS: ${alertas.join('; ')}.`);
  }

  return lines.join('\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, perfil, tipo, historial, contexto_dia, email } = body;

    if (!perfil) {
      return Response.json({ error: "Datos de perfil no proporcionados" }, { status: 400 });
    }

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    // ── RAMA PLAN SEMANAL ───────────────────────────────────────────
    if (tipo === 'plan') {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: `Eres un especialista en nutricion deportiva. Genera planes semanales en JSON estricto.
OBJETIVO DEL USUARIO: ${perfil.objetivo}
${perfil.preferencias ? `PREFERENCIAS Y RESTRICCIONES ALIMENTARIAS (OBLIGATORIO RESPETAR): ${perfil.preferencias}` : ''}

REGLAS ABSOLUTAS:
- Responde SOLO con JSON valido, sin texto antes ni despues
- NUNCA uses backticks ni markdown
- USA SOLO comillas dobles para strings
- NUNCA uses comillas simples
- NUNCA dejes comas finales
- El JSON debe tener exactamente esta estructura sin variaciones:
{"directrices":["texto","texto","texto","texto","texto","texto"],"dieta":[{"dia":"Lunes","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Martes","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Miercoles","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Jueves","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Viernes","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Sabado","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"},{"dia":"Domingo","desayuno":"texto","comida":"texto","cena":"texto","snack":"texto"}],"ejercicios":[{"dia":"Lunes descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Martes descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Miercoles descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Jueves descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Viernes descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Sabado descripcion","tipo":"texto","ejercicios":["texto","texto"]},{"dia":"Domingo descripcion","tipo":"texto","ejercicios":["texto","texto"]}],"compra":{"Proteinas":["item1","item2"],"Verduras":["item1","item2"],"Hidratos":["item1","item2"],"Grasas":["item1","item2"]},"suplementos":[{"nombre":"texto","dosis":"texto","prioridad":"Esencial","motivo":"texto"}]}`,
        messages: [{
          role: "user",
          content: `Genera plan semanal para objetivo: ${perfil.objetivo}. ICM ${perfil.icm}/100, edad metabolica ${perfil.edad_metabolica} anos, mejor bloque ${perfil.mejor_bloque}, peor bloque ${perfil.peor_bloque}.
${perfil.preferencias ? `\nRESPETA ESTRICTAMENTE: ${perfil.preferencias}` : ''}

IMPORTANTE para las comidas:
- Incluye siempre gramos exactos: "Pollo a la plancha 200g + arroz integral 80g + brocoli al vapor"
- Tecnicas de coccion reales: plancha, horno, vapor, crudo. Nunca frito
- En desayuno incluye cantidades: "Avena 60g + leche 200ml + platano"
- Snacks con gramos: "Almendras 30g + manzana 150g"
- Indica los macros aproximados al final de cada dia: "(~P:45g C:120g G:30g)"

Para el campo directrices incluye 6 pautas generales: cocinar a la plancha u horno, evitar postres procesados, si bebes alcohol elegir vino tinto con moderacion, beber agua antes de cada comida, comer despacio, ultima comida 2h antes de dormir.

Responde SOLO JSON valido sin markdown ni backticks.`
        }]
      });

      let texto = message.content[0].text.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      try {
        const plan = JSON.parse(texto);
        return Response.json({ plan });
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        return Response.json({ error: 'Error generando el plan. Intentalo de nuevo.' }, { status: 500 });
      }
    }

    // ── RAMA CHAT / COACH ───────────────────────────────────────────

    // Obtener logs biológicos del servidor (fuente de verdad)
    const logsBio = await obtenerLogsBiologicos(email);
    const contextoBiologico = buildContextoBiologico(logsBio);

    // Historial limpio — máximo 10 mensajes
    const historialMensajes = (historial || [])
      .filter(m => m.texto && !m.cargando)
      .slice(-10)
      .map(m => ({
        role: m.rol === 'usuario' ? 'user' : 'assistant',
        content: m.texto,
      }));

    // Contexto del día en lenguaje natural
    const contextoHoyTexto = contexto_dia ? `
CONTEXTO DEL PLAN DE HOY:
- Estado metabólico (Weather): ${contexto_dia.weather || 'N/A'}
- Comidas planificadas: ${contexto_dia.comidas
  ? `Desayuno: ${contexto_dia.comidas.desayuno || '-'} | Comida: ${contexto_dia.comidas.comida || '-'} | Cena: ${contexto_dia.comidas.cena || '-'}`
  : 'Sin plan de comidas'}
- Entrenamiento: ${contexto_dia.entrenamiento
  ? `${contexto_dia.entrenamiento.tipo || 'Sin tipo'}: ${(contexto_dia.entrenamiento.ejercicios || []).join(', ')}`
  : 'Día de descanso'}
` : '';

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Actua como un Especialista Senior en Nutricion Deportiva, Antropometria y Medicina Preventiva Funcional para mymetaboliq.com. Tu enfoque combina la rigurosidad cientifica con la vision del slow aging y la medicina funcional.

OBJETIVO DEL USUARIO: ${perfil.objetivo || 'No especificado'}

${contextoBiologico ? `━━━ DATOS BIOLÓGICOS REALES (obtenidos de BD) ━━━
${contextoBiologico}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usa estos datos para personalizar ACTIVAMENTE tu respuesta. Si el usuario tiene sueño bajo o estrés alto, ajusta tus recomendaciones. No menciones estos datos explícitamente a menos que sea relevante para la pregunta.
` : ''}

ADAPTACION POR OBJETIVO:
- Slow aging → longevidad, inflamacion baja, masa magra, salud mitocondrial
- Hipertrofia moderada → equilibrio ganancia muscular y salud metabolica
- Hipertrofia agresiva → maxima ganancia muscular, acepta algo de grasa
- Mantener peso → estabilidad y adherencia a largo plazo
- Definicion suave → perdida de grasa sostenible preservando musculo
- Definicion agresiva → perdida de grasa eficiente, acepta trade-offs
- Perdida rapida → deficit agresivo con proteccion muscular maxima

FILOSOFIA BASE (Francis Holway + nutricion evolutiva):
- Prioridad absoluta: composicion corporal sobre peso total
- Nutricion alineada con fisiologia humana ancestral
- Pragmatismo basado en evidencia
- Los 4 pilares: sensibilidad a la insulina, inflamacion sistemica, perfil lipidico, masa muscular

CUANDO TIENES DATOS BIOLOGICOS:
- Si el sueño fue malo (<5), NO recomiendes entreno intenso ese dia
- Si el estres es alto (>7), prioriza recuperacion y anti-inflamatorios
- Si la energia es baja (<4), simplifica el entreno o sugiere movilidad
- Si energia y sueño son altos, es buen momento para maxima intensidad
- Conecta tu respuesta con el estado real del usuario, no con un estado genérico

ESTILO DE RESPUESTA:
- Maximo 200 palabras
- Lenguaje cercano y directo, como un coach de confianza
- Profesional pero sin jerga innecesaria
- 1 emoji opcional con proposito
- Estructura: respuesta directa → explicacion breve → accion concreta

REGLAS:
- NUNCA diagnostiques ni prescribas medicacion
- NUNCA hagas preguntas al usuario (el perfil ya tiene los datos)
- Si faltan datos, asume el contexto mas razonable
- Disclaimer medico SOLO si la pregunta toca patologias o medicamentos`,

      messages: [
        {
          role: "user",
          content: `Perfil del usuario:
- ICM: ${perfil.icm}/100 (${perfil.categoria})
- Edad metabolica: ${perfil.edad_metabolica} anos
- Bloque mas fuerte: ${perfil.mejor_bloque}
- Bloque a mejorar: ${perfil.peor_bloque}
- Scores → ECO: ${perfil.eco} | EFH: ${perfil.efh} | NUT: ${perfil.nut} | DES: ${perfil.des} | VIT: ${perfil.vit}
- Hoy es: ${fechaHoy}
${contextoHoyTexto}
Ten en cuenta este perfil y el estado biologico real en toda la conversacion.`,
        },
        {
          role: "assistant",
          content: "Perfecto, tengo tu perfil completo y tu estado de hoy. Dime que necesitas.",
        },
        ...historialMensajes,
        {
          role: "user",
          content: pregunta,
        },
      ],
    });

    return Response.json({ respuesta: message.content[0].text });

  } catch (error) {
    console.error('Coach API error:', error);
    return Response.json({ error: "Error al conectar con el coach" }, { status: 500 });
  }
}