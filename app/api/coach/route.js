import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, perfil, tipo, historial, contexto_dia } = body;

    if (!perfil) {
      return Response.json({ error: "Datos de perfil no proporcionados" }, { status: 400 });
    }

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    // ─── RAMA PLAN SEMANAL ────────────────────────────────────────────
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
- Indica los macros aproximados al final de cada dia entre parentesis: "(~P:45g C:120g G:30g)"

Para el campo directrices incluye 6 pautas generales: cocinar a la plancha u horno, evitar postres procesados, si bebes alcohol elegir vino tinto con moderacion, beber agua antes de cada comida, comer despacio, ultima comida 2h antes de dormir.

Responde SOLO JSON valido sin markdown ni backticks.`
        }]
      });

      let texto = message.content[0].text.trim();
      texto = texto
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      try {
        const plan = JSON.parse(texto);
        return Response.json({ plan });
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.error('Primeros 300 chars:', texto.substring(0, 300));
        return Response.json({ error: 'Error generando el plan. Intentalo de nuevo.' }, { status: 500 });
      }
    }

    // ─── RAMA CHAT / COACH ────────────────────────────────────────────
    const historialMensajes = (historial || [])
      .filter(m => m.texto && !m.cargando)
      .slice(-10)
      .map(m => ({
        role: m.rol === 'usuario' ? 'user' : 'assistant',
        content: m.texto,
      }));

    // Contexto de hoy en lenguaje natural
    const contextoHoyTexto = contexto_dia ? `
CONTEXTO DE HOY (usa esto para personalizar tu respuesta):
- Estado metabolico del usuario hoy: ${contexto_dia.weather || 'N/A'}
- Comidas planificadas hoy: ${contexto_dia.comidas
    ? `Desayuno: ${contexto_dia.comidas.desayuno || '-'} | Comida: ${contexto_dia.comidas.comida || '-'} | Cena: ${contexto_dia.comidas.cena || '-'} | Snack: ${contexto_dia.comidas.snack || '-'}`
    : 'Sin plan de comidas'}
- Entrenamiento de hoy: ${contexto_dia.entrenamiento
    ? `${contexto_dia.entrenamiento.tipo || 'Sin tipo'}: ${(contexto_dia.entrenamiento.ejercicios || []).join(', ')}`
    : 'Dia de descanso'}
` : '';

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Actua como un Especialista Senior en Nutricion Deportiva, Antropometria y Medicina Preventiva Funcional para mymetaboliq.com. Tu enfoque combina la rigurosidad cientifica con la vision del slow aging y la medicina funcional.

OBJETIVO DEL USUARIO: ${perfil.objetivo || 'No especificado'}

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
- Pragmatismo basado en evidencia: si los datos cambian, las recomendaciones cambian
- Los 4 pilares: sensibilidad a la insulina, inflamacion sistemica, perfil lipidico, masa muscular

CUANDO TIENES CONTEXTO DEL DIA:
- Conecta tu respuesta con el estado metabolico actual del usuario
- Si el entreno de hoy es de fuerza, refuerza la ingesta proteica post-entreno
- Si el estado es de baja energia, prioriza recuperacion sobre rendimiento
- Menciona las comidas del dia si son relevantes para la pregunta
- Se especifico: "Para tu comida de hoy con pollo..." en vez de "en general..."

ESTILO DE RESPUESTA:
- Maximo 180 palabras (si hay contexto del dia, puedes ir hasta 220)
- Lenguaje cercano y directo, como un coach de confianza
- Profesional pero sin jerga innecesaria
- 1 emoji opcional y con proposito, no decorativo
- Estructura: respuesta directa → explicacion breve → accion concreta

REGLAS NO NEGOCIABLES:
- NUNCA diagnostiques ni prescribas medicacion
- NUNCA hagas preguntas al usuario (el perfil ya tiene los datos)
- Si faltan datos, asume el contexto mas razonable y explicalo brevemente
- Analiza tendencias y modas siempre desde fisiologia, no desde opinion
- Disclaimer medico SOLO si la pregunta toca patologias, medicamentos o condiciones clinicas`,

      messages: [
        {
          role: "user",
          content: `Perfil del usuario:
- ICM: ${perfil.icm}/100 (${perfil.categoria})
- Edad metabolica: ${perfil.edad_metabolica} anos
- Bloque mas fuerte: ${perfil.mejor_bloque}
- Bloque a mejorar: ${perfil.peor_bloque}
- Scores detallados → ECO: ${perfil.eco} | EFH: ${perfil.efh} | NUT: ${perfil.nut} | DES: ${perfil.des} | VIT: ${perfil.vit}
- Hoy es: ${fechaHoy}
${contextoHoyTexto}
Ten en cuenta este perfil completo en toda la conversacion.`,
        },
        {
          role: "assistant",
          content: "Perfecto, tengo tu perfil completo y el contexto de hoy. Dime que necesitas.",
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