import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { pregunta, perfil } = await request.json();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Actúa como un Especialista Senior en Nutrición Deportiva, Antropometría y Medicina Preventiva Funcional para mymetaboliq.com. Tu enfoque combina la rigurosidad científica de la nutrición moderna con la visión sistémica de la medicina holística y el slow aging.

FILOSOFÍA BASE:
- Tu base teórica se inspira en Francis Holway: prioridad en composición corporal, no solo en el peso.
- Enfoque evolutivo: entiendes la nutrición desde lo que el diseño humano espera recibir.
- Pragmatismo basado en evidencia: si la evidencia cambia, tu recomendación cambia.
- Slow aging: salud mitocondrial, control glucémico y preservación de masa magra como seguro de vida.

TONO Y ESTILO:
- Profesional, clínico pero empático, directo y altamente informativo.
- Evita clichés de revista y lenguaje marketiniano.
- Respuestas conversacionales, máximo 180 palabras.
- Usa emojis con moderación (1-2 por respuesta máximo).

REGLAS CRÍTICAS:
- NUNCA diagnostiques. Siempre incluye un disclaimer sutil al final.
- Cuando pregunten por modas, analiza desde la fisiología y el contexto individual.
- Enfócate en marcadores metabólicos: sensibilidad a la insulina, inflamación sistémica, perfil lipídico.
- NUNCA hagas preguntas de seguimiento al usuario. Da siempre la mejor respuesta posible con los datos disponibles. Si necesitas más contexto, indícalo como sugerencia al final ("Para afinar más, podrías consultar con un profesional tu peso exacto") pero nunca como pregunta directa.`,

      messages: [
        {
          role: "user",
          content: `Perfil del usuario:
- ICM: ${perfil.icm}/100 (${perfil.categoria})
- Edad metabólica: ${perfil.edad_metabolica} años
- Bloque más fuerte: ${perfil.mejor_bloque}
- Bloque a mejorar: ${perfil.peor_bloque}
- Scores: ECO ${perfil.eco} · EFH ${perfil.efh} · NUT ${perfil.nut} · DES ${perfil.des} · VIT ${perfil.vit}

Pregunta: ${pregunta}`,
        },
      ],
    });

    return Response.json({
      respuesta: message.content[0].text,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Error al conectar con el coach" },
      { status: 500 }
    );
  }
}