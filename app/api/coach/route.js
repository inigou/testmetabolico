import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

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
    lines.push(`ESTADO HOY (${hoy.fecha}):`);
    if (hoy.energia != null) lines.push(`- Energía: ${hoy.energia}/10${hoy.energia <= 4 ? ' ⚠️ baja' : hoy.energia >= 8 ? ' ✓ alta' : ''}`);
    if (hoy.sueno   != null) lines.push(`- Sueño: ${hoy.sueno}/10${hoy.sueno <= 4 ? ' ⚠️ malo' : hoy.sueno >= 8 ? ' ✓ muy bueno' : ''}`);
    if (hoy.estres  != null) lines.push(`- Estrés: ${hoy.estres}/10${hoy.estres >= 7 ? ' ⚠️ elevado' : hoy.estres <= 3 ? ' ✓ bajo' : ''}`);
    if (total > 0) lines.push(`- Tareas completadas: ${completados}/${total}`);
  }
  if (ayer) lines.push(`AYER: Energía ${ayer.energia}/10 · Sueño ${ayer.sueno}/10 · Estrés ${ayer.estres}/10`);
  const alertas = [];
  if (hoy?.sueno   <= 4) alertas.push('sueño muy malo — evita entreno intenso');
  if (hoy?.estres  >= 8) alertas.push('estrés muy alto — prioriza recuperación');
  if (hoy?.energia <= 3) alertas.push('energía crítica — adapta a esfuerzo mínimo');
  if (hoy?.energia >= 8 && hoy?.sueno >= 7) alertas.push('pico de forma — día ideal para esfuerzo máximo');
  if (alertas.length > 0) lines.push(`ADAPTACIONES: ${alertas.join('; ')}.`);
  return lines.join('\n');
}

function buildContextoPlan(planSemana) {
  if (!planSemana?.dieta) return '';
  const diaHoy = getDiaHoy();
  const lines = [];
  const diaData = planSemana.dieta[diaHoy];
  const entreno = planSemana.ejercicios?.[diaHoy];
  if (diaData) {
    lines.push(`PLAN HOY — ${DIAS[diaHoy]}:`);
    if (diaData.desayuno) lines.push(`  · Desayuno: ${diaData.desayuno}${diaData.kcal_desayuno ? ` (${diaData.kcal_desayuno} kcal)` : ''}`);
    if (diaData.comida)   lines.push(`  · Comida: ${diaData.comida}${diaData.kcal_comida ? ` (${diaData.kcal_comida} kcal)` : ''}`);
    if (diaData.snack)    lines.push(`  · Snack: ${diaData.snack}`);
    if (diaData.cena)     lines.push(`  · Cena: ${diaData.cena}${diaData.kcal_cena ? ` (${diaData.kcal_cena} kcal)` : ''}`);
    if (entreno)          lines.push(`  · Entreno: ${entreno.tipo}${entreno.kcal_quemadas ? ` (−${entreno.kcal_quemadas} kcal)` : ''}`);
  }
  const restoSemana = planSemana.dieta.map((dia, i) => {
    if (i === diaHoy) return null;
    const platos = [dia.comida, dia.cena].filter(Boolean)
      .map(p => p.split('+')[0].split(',')[0].trim().split(' ').slice(0, 4).join(' '));
    return platos.length ? `  · ${DIAS[i]}: ${platos.join(' / ')}` : null;
  }).filter(Boolean);
  if (restoSemana.length) { lines.push('RESTO SEMANA:'); lines.push(...restoSemana); }
  return lines.join('\n');
}

// ── Parser robusto del JSON de function calling ──────────────────────
// Devuelve { mensaje_usuario, comandos } o null si falla
function parsearRespuestaCoach(texto) {
  try {
    const inicio = texto.indexOf('{');
    const fin = texto.lastIndexOf('}');
    if (inicio === -1 || fin === -1) return null;
    const parsed = JSON.parse(texto.substring(inicio, fin + 1));
    if (parsed.mensaje_usuario) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, perfil, tipo, historial, contexto_dia, email, plan_semana, nombre_usuario } = body;

    if (!perfil) return Response.json({ error: "Datos de perfil no proporcionados" }, { status: 400 });

    const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── PLAN SEMANAL (sin cambios) ────────────────────────────────────
    if (tipo === 'plan') {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10000,
        system: `Eres un especialista en nutricion deportiva. Genera planes semanales en JSON estricto con calorías por comida.
OBJETIVO DEL USUARIO: ${perfil.objetivo}
${perfil.preferencias ? `PREFERENCIAS Y RESTRICCIONES (OBLIGATORIO RESPETAR): ${perfil.preferencias}` : ''}

REGLAS ABSOLUTAS:
- Responde SOLO con JSON valido, sin texto antes ni despues, sin backticks ni markdown
- USA SOLO comillas dobles para strings
- NUNCA dejes comas finales
- Incluye OBLIGATORIAMENTE las kcal de cada comida

Estructura JSON exacta:
{"directrices":["texto x6"],"dieta":[{"dia":"Lunes","desayuno":"texto con gramos","kcal_desayuno":000,"comida":"texto con gramos","kcal_comida":000,"cena":"texto con gramos","kcal_cena":000,"snack":"texto con gramos","kcal_snack":000} x7 dias],"ejercicios":[{"dia":"Lunes descripcion","tipo":"texto","ejercicios":["texto"],"kcal_quemadas":000} x7 dias],"compra":{"Proteinas":["item"],"Verduras":["item"],"Hidratos":["item"],"Grasas":["item"]},"suplementos":[{"nombre":"texto","dosis":"texto","prioridad":"Esencial","motivo":"texto"}]}`,
        messages: [{ role: "user", content: `Genera plan para objetivo: ${perfil.objetivo}. ICM ${perfil.icm}/100, edad metabolica ${perfil.edad_metabolica} años, mejor ${perfil.mejor_bloque}, peor ${perfil.peor_bloque}.\n${perfil.preferencias ? `RESPETA ESTRICTAMENTE: ${perfil.preferencias}` : ''}\nUsa gramos exactos. Kcal obligatorias. Responde SOLO JSON.` }],
      });
      let texto = message.content[0].text;
      const inicio = texto.indexOf('{'); const fin = texto.lastIndexOf('}');
      if (inicio !== -1 && fin !== -1) texto = texto.substring(inicio, fin + 1);
      else throw new Error("No se encontró JSON válido");
      try { return Response.json({ plan: JSON.parse(texto) }); }
      catch (e) { return Response.json({ error: 'Error generando el plan. Inténtalo de nuevo.' }, { status: 500 }); }
    }

    // ── COACH BANANA — conversacional ────────────────────────────────
    const logsBio = await obtenerLogsBiologicos(email);
    const contextoBiologico = buildContextoBiologico(logsBio);
    const contextoPlan = buildContextoPlan(plan_semana);
    const checkinTexto = contexto_dia?.checkin || null;

    // Determinar si es actualización de slider (checkin reactivo)
    const esCheckinReactivo = tipo === 'checkin_reactivo';

    const historialMensajes = (historial || [])
      .filter(m => m.texto && !m.cargando)
      .slice(-8)
      .map(m => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto }));

    const systemPrompt = `Eres Banana 🍌, el coach metabólico personal de mymetaboliq.com — estratega nutricional proactivo y directo.
${nombre_usuario ? `El usuario se llama ${nombre_usuario}.` : ''}
OBJETIVO: ${perfil.objetivo || 'No especificado'}

${contextoPlan ? `━━━ PLAN SEMANAL ━━━
${contextoPlan}
REGLA: referencias directas a platos reales del plan. NUNCA inventes alimentos.
━━━━━━━━━━━━━━━━━━
` : '⚠️ Sin plan generado — anima a crearlo.\n'}
━━━ ESTADO HOY ━━━
${checkinTexto || contextoBiologico || 'Check-in pendiente — no menciones valores numéricos de energía.'}
━━━━━━━━━━━━━━━━━

PERSONALIDAD: proactivo, directo, tutea, cálido, max 150 palabras.
Sin diagnósticos médicos.

FORMATO DE RESPUESTA (OBLIGATORIO):
Responde SIEMPRE con este JSON exacto, sin texto fuera de él:
{
  "mensaje_usuario": "Tu respuesta en texto natural aquí",
  "comandos": []
}

COMANDOS DISPONIBLES (incluir en el array cuando aplique):

1. Modificar una comida o entreno del día de hoy:
{ "accion": "MODIFICAR_PLATO", "tipo": "desayuno|comida|cena|snack|entreno", "nuevo_texto": "Descripción completa con gramos", "nuevas_kcal": 000 }
OBLIGATORIO cuando el usuario pida cambiar, sustituir o adaptar un plato o entreno.
El campo "nuevo_texto" debe ser una descripción completa y realista con gramos (ej: "Pechuga de pollo 180g con arroz basmati 80g y verduras salteadas").
El campo "nuevas_kcal" debe ser un número entero estimado realista.

2. Mostrar el plan semanal completo:
{ "accion": "MOSTRAR_PLAN" }

3. Abrir configuración:
{ "accion": "ABRIR_CONFIG" }

4. Actualizar los protocolos activos del día (chips visibles en el Timeline):
{ "accion": "ACTUALIZAR_PROTOCOLOS", "nuevos_protocolos": ["🔥 Emoji + texto corto", "💧 Otro protocolo"] }
CUÁNDO usarlo: cuando la estrategia del día cambie. Ejemplos que DEBEN dispararlo:
- El usuario pasa de déficit a mantenimiento → actualiza los chips
- Recomiendas ayuno, hidratación extra, descanso activo, o cualquier pauta del día
- El usuario tiene un evento especial que cambia las reglas del día
- Se modifica el objetivo calórico o de macros
Los protocolos son máximo 4, texto muy corto (2-4 palabras), siempre con emoji al inicio.

REGLA CRÍTICA 1: Si el usuario pide cambiar cualquier comida o entreno, el comando MODIFICAR_PLATO es OBLIGATORIO.
REGLA CRÍTICA 2: Si detectas un cambio de estrategia o recomiendas una pauta especial, ACTUALIZAR_PROTOCOLOS es OBLIGATORIO.
Si no hay comandos, deja el array vacío. NUNCA escribas texto fuera del JSON.`;

    const userContent = esCheckinReactivo
      ? `El usuario acaba de actualizar su check-in: ${checkinTexto}. Responde con un mensaje corto (max 2 frases) reconociendo el estado y dando un consejo inmediato adaptado a ese nivel.`
      : pregunta;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        { role: "user", content: `Perfil: ICM ${perfil.icm}/100 (${perfil.categoria}), edad metabólica ${perfil.edad_metabolica} años. Peor: ${perfil.peor_bloque}. ECO:${perfil.eco} EFH:${perfil.efh} NUT:${perfil.nut} DES:${perfil.des} VIT:${perfil.vit}. Hoy: ${fechaHoy}.` },
        { role: "assistant", content: '{"mensaje_usuario":"Perfecto, tengo tu plan y estado. Dime qué necesitas.","comandos":[]}' },
        ...historialMensajes,
        { role: "user", content: userContent },
      ],
    });

    const textoRespuesta = message.content[0].text;

    // ── Parse con fallback robusto ───────────────────────────────────
    const parsed = parsearRespuestaCoach(textoRespuesta);

    if (parsed) {
      // Éxito — devolver estructura completa
      return Response.json({
        respuesta: parsed.mensaje_usuario,
        comandos: parsed.comandos || [],
      });
    } else {
      // Fallback: la IA respondió en texto plano — lo usamos tal cual
      console.warn('Banana: respuesta no parseada como JSON, usando texto plano');
      return Response.json({
        respuesta: textoRespuesta,
        comandos: [],
      });
    }

  } catch (error) {
    console.error('Banana API error:', error);
    return Response.json({ error: "Error al conectar con Banana" }, { status: 500 });
  }
}