// lib/supabase.js — cliente centralizado Supabase para mymetaboliq
// Usar en todos los componentes en lugar de fetch directo

const SUPABASE_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// ── PLANS ────────────────────────────────────────────────────────

/** Carga el plan desde Supabase. Devuelve el objeto plan o null. */
export async function cargarPlanDB(email, objetivoId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objetivoId)}&select=plan_json,updated_at`,
      { headers }
    );
    const rows = await res.json();
    if (rows?.length > 0) return { plan: rows[0].plan_json, updatedAt: rows[0].updated_at };
    return null;
  } catch (e) {
    console.error('cargarPlanDB error:', e);
    return null;
  }
}

/** Guarda o actualiza el plan en Supabase (upsert). */
export async function guardarPlanDB(email, objetivoId, plan) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_plans`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        email,
        objetivo_id: objetivoId,
        plan_json: plan,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('guardarPlanDB error:', e);
  }
}

// ── DAILY LOGS ───────────────────────────────────────────────────

/** Guarda o actualiza el check-in diario (upsert por email+fecha). */
export async function guardarCheckInDB(email, fecha, energia, sueno, estres, completedTasks = {}) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/daily_logs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ email, fecha, energia, sueno, estres, completed_tasks: completedTasks }),
    });
  } catch (e) {
    console.error('guardarCheckInDB error:', e);
  }
}

/** Actualiza solo las tareas completadas de un día ya existente. */
export async function actualizarCompletedTasks(email, fecha, completedTasks) {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${fecha}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ completed_tasks: completedTasks }),
      }
    );
  } catch (e) {
    console.error('actualizarCompletedTasks error:', e);
  }
}

/** Carga los logs de los últimos N días para un email. */
export async function cargarLogsUltimos(email, dias = 35) {
  try {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    const desdeStr = desde.toISOString().split('T')[0];

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=gte.${desdeStr}&order=fecha.asc&select=fecha,energia,sueno,estres,completed_tasks`,
      { headers }
    );
    return await res.json();
  } catch (e) {
    console.error('cargarLogsUltimos error:', e);
    return [];
  }
}

/** Carga el log de un día específico. */
export async function cargarLogDia(email, fecha) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${fecha}&select=energia,sueno,estres,completed_tasks`,
      { headers }
    );
    const rows = await res.json();
    return rows?.[0] || null;
  } catch (e) {
    console.error('cargarLogDia error:', e);
    return null;
  }
}

// ── STREAK ───────────────────────────────────────────────────────

/** Calcula la racha de días consecutivos con check-in. */
export function calcularRacha(logs) {
  if (!logs || logs.length === 0) return 0;
  const fechasSet = new Set(logs.map(l => l.fecha));
  let racha = 0;
  const hoy = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (fechasSet.has(key)) racha++;
    else if (i > 0) break; // toleramos que hoy no esté aún
  }
  return racha;
}

/** Calcula el % de adherencia de la semana actual. */
export function calcularAdherenciaSemana(logs) {
  if (!logs || logs.length === 0) return 0;
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
  lunes.setHours(0, 0, 0, 0);

  let diasConCheckin = 0;
  const diasTranscurridos = Math.min(7, Math.floor((hoy - lunes) / 86400000) + 1);

  for (let i = 0; i < diasTranscurridos; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (logs.some(l => l.fecha === key)) diasConCheckin++;
  }

  return diasTranscurridos > 0 ? Math.round((diasConCheckin / diasTranscurridos) * 100) : 0;
}