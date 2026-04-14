import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { comida_actual, peticion, tipo, objetivo } = await request.json();

    if (!comida_actual || !peticion) {
      return Response.json({ error: "Faltan datos" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `Eres un nutricionista que hace sustituciones de ingredientes en comidas. 
Reglas:
- Mantén el mismo aporte calórico y proteico aproximado
- Usa solo ingredientes comunes y fáciles de encontrar  
- Mantén el formato original: "Ingrediente Xg + ingrediente Yg + preparación"
- Responde SOLO con el texto de la comida sustituida, sin explicaciones ni comillas
- Máximo 2 frases
- Adapta siempre al objetivo del usuario: ${objetivo}`,
      messages: [{
        role: "user",
        content: `Comida actual (${tipo}): ${comida_actual}
        
Petición del usuario: ${peticion}

Reescribe la comida aplicando la sustitución solicitada. Solo devuelve el texto de la comida, sin más.`
      }]
    });

    const sustitucion = message.content[0].text.trim()
      .replace(/^["']|["']$/g, '') // quitar comillas si las hay
      .trim();

    return Response.json({ sustitucion });

  } catch (error) {
    console.error('Substitute API error:', error);
    return Response.json({ error: "Error al sustituir" }, { status: 500 });
  }
}