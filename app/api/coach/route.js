import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, perfil, tipo } = body;

    if (tipo === 'plan') {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: `Eres un especialista en nutricion deportiva. Genera planes semanales en JSON estricto.
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

IMPORTANTE para las comidas:
- Incluye siempre gramos exactos: "Pollo a la plancha 200g + arroz integral 80g + brocoli al vapor"
- Tecnicas de coccion reales: plancha, horno, vapor, crudo. Nunca frito
- En desayuno incluye cantidades: "Avena 60g + leche 200ml + platano"
- Snacks con gramos: "Almendras 30g + manzana 150g"

Para el campo directrices incluye 6 pautas generales como: cocinar a la plancha u horno, evitar postres procesados, si bebes alcohol elegir vino tinto con moderacion, beber agua antes de cada comida, comer despacio, ultima comida 2h antes de dormir.

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

    // Construir historial de conversación
    const historialMensajes = (body.historial || [])
      .filter(m => m.texto && !m.cargando)
      .map(m => ({
        role: m.rol === 'usuario' ? 'user' : 'assistant',
        content: m.texto,
      }));

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Actua como un Especialista Senior en Nutricion Deportiva, Antropometria y Medicina Preventiva Funcional para mymetaboliq.com. Tu enfoque combina la rigurosidad cientifica de la nutricion moderna con la vision sistemica de la medicina holistica y el slow aging.

FILOSOFIA BASE:
- Tu base teorica se inspira en Francis Holway: prioridad en composicion corporal, no solo en el peso.
- Enfoque evolutivo: entiendes la nutricion desde lo que el diseno humano espera recibir.
- Pragmatismo basado en evidencia: si la evidencia cambia, tu recomendacion cambia.
- Slow aging: salud mitocondrial, control glucemico y preservacion de masa magra como seguro de vida.

TONO Y ESTILO:
- Profesional, clinico pero empatico, directo y altamente informativo.
- Evita cliches de revista y lenguaje marketiniano.
- Respuestas conversacionales, maximo 180 palabras.
- Usa emojis con moderacion (1-2 por respuesta maximo).

REGLAS CRITICAS:
- NUNCA diagnostiques. Siempre incluye un disclaimer sutil al final.
- Cuando pregunten por modas, analiza desde la fisiologia y el contexto individual.
- Enfocate en marcadores metabolicos: sensibilidad a la insulina, inflamacion sistemica, perfil lipidico.
- NUNCA hagas preguntas de seguimiento al usuario. Da siempre la mejor respuesta posible con los datos disponibles.`,
      messages: [
        {
          role: "user",
          content: `Perfil del usuario:
- ICM: ${perfil.icm}/100 (${perfil.categoria})
- Edad metabolica: ${perfil.edad_metabolica} anos
- Bloque mas fuerte: ${perfil.mejor_bloque}
- Bloque a mejorar: ${perfil.peor_bloque}
- Scores: ECO ${perfil.eco} EFH ${perfil.efh} NUT ${perfil.nut} DES ${perfil.des} VIT ${perfil.vit}

Ten en cuenta este perfil en toda la conversacion.`,
        },
        {
          role: "assistant",
          content: "Entendido, tengo tu perfil metabolico. Puedes preguntarme lo que necesites.",
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
    console.error(error);
    return Response.json({ error: "Error al conectar con el coach" }, { status: 500 });
  }
}