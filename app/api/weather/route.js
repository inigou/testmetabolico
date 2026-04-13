import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { perfil, objetivo, checkin } = await request.json();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `Eres un especialista en medicina metabólica. Analiza el estado diario de un usuario y devuelve SOLO un JSON válido sin markdown ni backticks con esta estructura exacta:
{"estado":"NombreEstado Emoji","consejo":"Frase táctica corta de máximo 20 palabras"}

Estados posibles según la combinación energía/sueño/estrés:
- Energía alta + sueño ok + estrés bajo: "Día Óptimo ⚡"
- Energía alta + estrés alto: "Alerta Activa 🔥"  
- Sueño bajo + energía baja: "Modo Recuperación 😴"
- Estrés alto + sueño bajo: "Tormenta Metabólica ⛈️"
- Todo medio: "Día Estable 🌤️"
- Energía baja + todo bajo: "Recarga Necesaria 🔋"
- Sueño alto + energía alta: "Pico Metabólico 🚀"

El consejo debe ser específico, accionable y adaptado al objetivo del usuario. Sin frases genéricas.`,
      messages: [{
        role: "user",
        content: `Check-in de hoy:
- Energía: ${checkin.energia}/10
- Sueño: ${checkin.sueno}/10
- Estrés: ${checkin.estres}/10

Perfil metabólico:
- ICM: ${perfil.icm}/100
- Bloque más débil: ${perfil.peor_bloque}
- Objetivo: ${objetivo}

Devuelve SOLO el JSON.`
      }]
    });

    let texto = message.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const result = JSON.parse(texto);
    return Response.json(result);

  } catch (error) {
    console.error(error);
    return Response.json({ estado: "Día Estable 🌤️", consejo: "Mantén tu rutina de hoy." });
  }
}