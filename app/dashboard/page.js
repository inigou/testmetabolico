'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DailyTimeline from './DailyTimeline';
import ConfiguracionMetabolica from './ConfiguracionMetabolica';
import WeeklyPlannerModal from './WeeklyPlannerModal';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

// ── Paleta Tech Luminosa ─────────────────────────────────────────────
const C = {
  bg:       '#F0F8FA',
  panel:    '#EDF9FD',
  dark:     '#111827',
  mid:      '#4B5563',
  slate:    '#1E3A8A',
  accent:   '#14B8A6',
  accentDk: '#0D9488',
  orange:   '#E8621A',
  orangeLt: '#FDF0E8',
  light:    '#D1ECF1',
  white:    '#FFFFFF',
  greenPale:'#E0F7F5',
};
const font = "'Trebuchet MS', Verdana, Geneva, sans-serif";

// ── Helpers BD ───────────────────────────────────────────────────────
async function cargarPlanDB(email, objId) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}&order=updated_at.desc&limit=1&select=plan_json`, { headers: sbH });
    const rows = await res.json();
    return rows?.[0]?.plan_json || null;
  } catch { return null; }
}
async function guardarPlanDB(email, objId, plan) {
  try {
    const check = await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}&select=email`, { headers: sbH });
    const rows = await check.json();
    if (rows?.length > 0) {
      await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}`, { method: 'PATCH', headers: sbH, body: JSON.stringify({ plan_json: plan, updated_at: new Date().toISOString() }) });
    } else {
      await fetch(`${SB_URL}/rest/v1/user_plans`, { method: 'POST', headers: sbH, body: JSON.stringify({ email, objetivo_id: objId, plan_json: plan, updated_at: new Date().toISOString() }) });
    }
  } catch (e) { console.error(e); }
}
async function cargarLogsRecientes(email, dias = 35) {
  try {
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    const res = await fetch(`${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=gte.${desde.toISOString().split('T')[0]}&order=fecha.asc&select=fecha,energia,sueno,estres`, { headers: sbH });
    return await res.json();
  } catch { return []; }
}
async function upsertCheckInBD(email, energia, sueno, estres) {
  const fecha = new Date().toISOString().split('T')[0];
  try {
    const resPatch = await fetch(`${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${fecha}`, { method: 'PATCH', headers: { ...sbH, Prefer: 'return=representation' }, body: JSON.stringify({ energia, sueno, estres }) });
    const patched = await resPatch.json();
    if (!Array.isArray(patched) || patched.length === 0) {
      await fetch(`${SB_URL}/rest/v1/daily_logs`, { method: 'POST', headers: { ...sbH, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ email, fecha, energia, sueno, estres }) });
    }
  } catch (e) { console.error(e); }
}
function calcularRacha(logs) {
  if (!logs?.length) return 0;
  const s = new Set(logs.map(l => l.fecha));
  let r = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (s.has(d.toISOString().split('T')[0])) r++;
    else if (i > 0) break;
  }
  return r;
}
const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const icmColor  = v => v >= 80 ? '#0D9488' : v >= 65 ? '#14B8A6' : v >= 50 ? '#F9A825' : v >= 35 ? '#E8621A' : '#C62828';
const icmLabel  = v => v >= 80 ? 'Metabolismo óptimo' : v >= 65 ? 'Metabolismo activo' : v >= 50 ? 'Metabolismo moderado' : v >= 35 ? 'Metabolismo lento' : 'Metabolismo crítico';
const OBJETIVOS = [
  { id: 'slow_aging',          emoji: '🌿', nombre: 'Slow aging' },
  { id: 'mantener',            emoji: '⚖️', nombre: 'Mantener peso' },
  { id: 'definicion_suave',    emoji: '🔥', nombre: 'Definición suave' },
  { id: 'definicion_agresiva', emoji: '💪', nombre: 'Definición agresiva' },
  { id: 'hipertrofia',         emoji: '🏋️', nombre: 'Hipertrofia moderada' },
  { id: 'hipertrofia_agresiva',emoji: '🚀', nombre: 'Hipertrofia agresiva' },
  { id: 'perdida_rapida',      emoji: '⚡', nombre: 'Pérdida rápida' },
];

// ── Micro Check-in widget con debounce reactivo ──────────────────────
function MicroCheckIn({ email, onCheckinChange, onBananaReactivo }) {
  const hoy = () => new Date().toISOString().split('T')[0];
  const [energia, setEnergia]       = useState(7);
  const [sueno, setSueno]           = useState(7);
  const [estres, setEstres]         = useState(4);
  const [guardado, setGuardado]     = useState(false);
  const [cargando, setCargando]     = useState(false);
  const debounceRef                 = useRef(null);

  // Cargar del localStorage al montar
  useEffect(() => {
    if (!email) return;
    try {
      const cached = JSON.parse(localStorage.getItem(`checkin_${email}_${hoy()}`) || '{}');
      if (cached.energia != null) {
        setEnergia(cached.energia); setSueno(cached.sueno); setEstres(cached.estres);
        setGuardado(true);
        onCheckinChange?.(`Energía ${cached.energia}/10 · Sueño ${cached.sueno}/10 · Estrés ${cached.estres}/10`);
      }
    } catch {}
  }, [email]);

  // Debounce: al cambiar sliders → guardar + disparar Banana
  const handleSliderChange = (setter, campo, valor) => {
    setter(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const vals = { energia, sueno, estres, [campo]: valor };
      const checkinStr = `Energía ${vals.energia}/10 · Sueño ${vals.sueno}/10 · Estrés ${vals.estres}/10`;
      // Guardar en localStorage
      try { localStorage.setItem(`checkin_${email}_${hoy()}`, JSON.stringify({ ...vals, fecha: hoy() })); } catch {}
      // Guardar en BD en background (sin await para no bloquear)
      upsertCheckInBD(email, vals.energia, vals.sueno, vals.estres);
      setGuardado(true);
      onCheckinChange?.(checkinStr);
      // Disparar Banana reactivo
      onBananaReactivo?.(checkinStr);
    }, 1500);
  };

  const colorE = v => v >= 7 ? C.accent : v >= 4 ? '#F9A825' : C.orange;
  const colorS = v => v >= 7 ? C.accent : v >= 4 ? '#F9A825' : C.orange;
  const colorSt = v => v <= 3 ? C.accent : v <= 6 ? '#F9A825' : C.orange;

  return (
    <div style={{ background: C.panel, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.light}`, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ⚡ Check-in de hoy
        </div>
        {guardado && (
          <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            {cargando ? '⏳ Banana analizando...' : '✓ Guardado'}
          </div>
        )}
      </div>
      {[
        { label: 'Energía', val: energia, set: v => handleSliderChange(setEnergia, 'energia', v), color: colorE(energia), emoji: '⚡' },
        { label: 'Sueño',   val: sueno,   set: v => handleSliderChange(setSueno,   'sueno',   v), color: colorS(sueno),   emoji: '😴' },
        { label: 'Estrés',  val: estres,  set: v => handleSliderChange(setEstres,  'estres',  v), color: colorSt(estres), emoji: '🧠' },
      ].map((s, i) => (
        <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.mid }}>{s.emoji} {s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.val}</span>
          </div>
          <input type="range" min="1" max="10" step="1" value={s.val}
            onChange={e => s.set(+e.target.value)}
            style={{ width: '100%', accentColor: s.color, height: 4, cursor: 'pointer' }} />
        </div>
      ))}
    </div>
  );
}

// ── Banana Chat (columna izquierda / drawer móvil) ───────────────────
function BananaChat({ mensajes, input, setInput, cargando, onEnviar, chatEndRef, inline = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? '100%' : 'auto', flex: inline ? 1 : 'none', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: C.accent, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderRadius: inline ? '12px 12px 0 0' : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍌</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Banana</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Tu coach metabólico · Powered by Claude</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#86EFAC', boxShadow: '0 0 6px #86EFAC' }} />
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: C.panel, minHeight: inline ? 0 : 240, maxHeight: inline ? 'none' : 360 }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.mid, fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🍌</div>
            Completa el check-in para que Banana analice tu día
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start' }}>
            {m.rol === 'bot' && <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>🍌</div>}
            <div style={{
              maxWidth: '82%',
              padding: '9px 12px',
              borderRadius: m.rol === 'usuario' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.rol === 'usuario' ? C.orange : C.white,
              color: m.rol === 'usuario' ? C.white : C.dark,
              fontSize: 12, lineHeight: 1.65,
              border: m.rol === 'bot' ? `1px solid ${C.light}` : 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {m.esProactivo && <div style={{ fontSize: 9, color: C.accent, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🍌 Mensaje del día</div>}
              {m.esEvento   && <div style={{ fontSize: 9, color: C.orange, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠️ Plan adaptado</div>}
              {m.cargando
                ? <div style={{ display: 'flex', gap: 3 }}>{[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, opacity: 0.7, animation: `bounce 1.2s ease-in-out ${j*0.2}s infinite` }} />)}</div>
                : <div style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</div>
              }
            </div>
          </div>
        ))}
        {mensajes.some(m => m.esProactivo && !m.cargando && m.chips?.length) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 30 }}>
            {mensajes.find(m => m.esProactivo && m.chips)?.chips?.map((chip, ci) => (
              <button key={ci} onClick={() => onEnviar(chip)} style={{ background: C.white, border: `1.5px solid ${C.accent}`, color: C.accent, padding: '5px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input — sticky en móvil, normal en desktop */}
      <div className="banana-input-sticky" style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !cargando && input.trim() && onEnviar()}
          placeholder="Pregúntale a Banana..."
          style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 13, fontFamily: font, outline: 'none', color: C.dark, background: C.white }} />
        <button onClick={() => !cargando && input.trim() && onEnviar()} disabled={cargando}
          style={{ background: cargando ? C.light : C.accent, color: C.white, border: 'none', padding: '10px 16px', borderRadius: 100, fontSize: 13, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 700, flexShrink: 0 }}>
          {cargando ? '...' : '→'}
        </button>
      </div>
    </div>
  );
}

// ── Súper-Botón de Eventos ───────────────────────────────────────────
function SuperBotonEventos({ onCerrar, onEnviar }) {
  const [seleccion, setSeleccion] = useState('');
  const [detalle, setDetalle]     = useState('');
  const [diaEvento, setDiaEvento] = useState(5);
  const DIAS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const EVENTOS = [
    { id: 'boda',          emoji: '💍', label: 'Boda o celebración',        protocolo: 'ajuste previo + recuperación al día siguiente' },
    { id: 'viaje',         emoji: '✈️', label: 'Viaje o fuera de casa',      protocolo: 'opciones portátiles + descanso activo' },
    { id: 'cena_social',   emoji: '🍽️', label: 'Cena social o restaurante', protocolo: 'estrategia de orden de platos + proteína prioritaria' },
    { id: 'alcohol',       emoji: '🍷', label: 'He bebido alcohol',          protocolo: 'hidratación intensiva + ayuno suave' },
    { id: 'exceso_comida', emoji: '🍕', label: 'Me he pasado comiendo',      protocolo: 'compensación con proteína + caminata 30 min' },
    { id: 'mal_sueno',     emoji: '😴', label: 'He dormido muy poco',        protocolo: 'sin entreno intenso + magnesio + sueño prioritario' },
    { id: 'estres',        emoji: '🔥', label: 'Semana de mucho estrés',     protocolo: 'gestión cortisol + adaptógenos' },
    { id: 'saltado',       emoji: '🤷', label: 'Me he saltado el plan',      protocolo: 'reinicio sin culpa + ajuste de mañana' },
  ];
  const eventoSel = EVENTOS.find(e => e.id === seleccion);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 680, borderRadius: '20px 20px 0 0', background: C.white, overflow: 'hidden', animation: 'slideUp 0.3s ease', maxHeight: '88dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: `linear-gradient(135deg,#E65100,${C.orange})`, padding: '18px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.white, marginBottom: 4 }}>🗓️ Adaptar plan al evento</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Banana reescribirá los días afectados. Tu racha no se interrumpe.</div>
            </div>
            <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>¿Qué día?</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {DIAS_ES.map((d, i) => <button key={i} onClick={() => setDiaEvento(i)} style={{ padding: '5px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font, background: diaEvento === i ? C.orange : C.bg, color: diaEvento === i ? C.white : C.mid, border: `1.5px solid ${diaEvento === i ? C.orange : C.light}`, fontWeight: diaEvento === i ? 700 : 400 }}>{d}</button>)}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>¿Qué ha pasado?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {EVENTOS.map(ev => <button key={ev.id} onClick={() => setSeleccion(ev.id)} style={{ padding: '10px 12px', borderRadius: 11, cursor: 'pointer', fontFamily: font, background: seleccion === ev.id ? C.orangeLt : C.bg, border: `2px solid ${seleccion === ev.id ? C.orange : C.light}`, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ev.emoji}</span>
                <span style={{ fontSize: 11, color: C.dark, fontWeight: seleccion === ev.id ? 700 : 400, lineHeight: 1.3 }}>{ev.label}</span>
              </button>)}
            </div>
          </div>
          {eventoSel && <div style={{ background: C.orangeLt, border: '1px solid #F9CFA8', borderRadius: 9, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#C05010', fontWeight: 600 }}>Estrategia: {eventoSel.protocolo}</div>}
          <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Detalles opcionales..." style={{ width: '100%', height: 60, padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 10, fontSize: 12, fontFamily: font, resize: 'none', outline: 'none', background: C.bg, color: C.dark, boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.light}`, background: C.white, flexShrink: 0 }}>
          <button onClick={() => seleccion && onEnviar(eventoSel, detalle, diaEvento)} disabled={!seleccion}
            style={{ width: '100%', background: seleccion ? `linear-gradient(135deg,#E65100,${C.orange})` : C.light, color: C.white, border: 'none', padding: '14px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: seleccion ? 'pointer' : 'not-allowed', fontFamily: font }}>
            {seleccion ? `Adaptar plan — ${DIAS_ES[diaEvento]} →` : 'Selecciona un evento'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── KcalTracker — Centro de Mando Calórico ──────────────────────────
function KcalTracker({ planSemanal, completedTasks }) {
  const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
  const diaIdx    = getDiaHoy();
  const diaData   = planSemanal?.dieta?.[diaIdx];
  const entreno   = planSemanal?.ejercicios?.[diaIdx];

  if (!diaData) return null;

  // Kcal objetivo: suma de todas las comidas planificadas hoy
  const kcalObj = (diaData.kcal_desayuno || 0) + (diaData.kcal_comida || 0) +
                  (diaData.kcal_cena || 0) + (diaData.kcal_snack || 0);

  // Kcal consumidas: solo comidas marcadas como completadas
  const kcalCons = (completedTasks?.desayuno ? (diaData.kcal_desayuno || 0) : 0) +
                   (completedTasks?.comida   ? (diaData.kcal_comida   || 0) : 0) +
                   (completedTasks?.cena     ? (diaData.kcal_cena     || 0) : 0);

  // Kcal quemadas por entreno si completado
  const kcalQuemadas = (completedTasks?.entreno && entreno?.kcal_quemadas) ? entreno.kcal_quemadas : 0;

  // Balance neto
  const balance    = kcalCons - kcalQuemadas;
  const pct        = kcalObj > 0 ? Math.min(100, Math.round((kcalCons / kcalObj) * 100)) : 0;
  const superavit  = balance > kcalObj * 1.1;
  const deficit    = kcalCons < kcalObj * 0.3 && completedTasks && Object.values(completedTasks).some(Boolean);

  // Color semáforo
  const barColor   = pct >= 90 ? '#0D9488' : pct >= 55 ? '#14B8A6' : pct >= 30 ? '#F9A825' : '#D1ECF1';
  const statusIcon = pct >= 90 ? '✅' : pct >= 55 ? '🔥' : pct >= 30 ? '⚡' : '💤';

  // SVG arco circular
  const R = 28; const circ = 2 * Math.PI * R;
  const dash = circ * (pct / 100);

  return (
    <div style={{
      position: 'sticky', top: 60, zIndex: 10,
      background: 'rgba(237,249,253,0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: `2px solid #14B8A6`,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Arco circular */}
      <div style={{ flexShrink: 0, position: 'relative', width: 66, height: 66 }}>
        <svg width="66" height="66" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="33" cy="33" r={R} fill="none" stroke="#D1ECF1" strokeWidth="5" />
          <circle cx="33" cy="33" r={R} fill="none" stroke={barColor}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: barColor,
          fontFamily: 'Georgia, serif',
        }}>{pct}%</div>
      </div>

      {/* Números */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
            {kcalCons.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: '#6B7280' }}>/ {kcalObj.toLocaleString()} kcal</span>
          <span style={{ fontSize: 16, marginLeft: 2 }}>{statusIcon}</span>
        </div>

        {/* Barra lineal */}
        <div style={{ height: 4, background: '#D1ECF1', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>

        {/* Detalle comidas */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {[
            { label: 'Desayuno', val: diaData.kcal_desayuno, done: completedTasks?.desayuno },
            { label: 'Comida',   val: diaData.kcal_comida,   done: completedTasks?.comida   },
            { label: 'Cena',     val: diaData.kcal_cena,     done: completedTasks?.cena     },
          ].filter(s => s.val > 0).map((s, i) => (
            <span key={i} style={{ fontSize: 10, color: s.done ? '#0D9488' : '#9CA3AF', fontWeight: s.done ? 700 : 400, display: 'flex', alignItems: 'center', gap: 2 }}>
              {s.done ? '✓' : '○'} {s.label} {s.val}
            </span>
          ))}
          {kcalQuemadas > 0 && (
            <span style={{ fontSize: 10, color: '#0D9488', fontWeight: 700 }}>🏋️ −{kcalQuemadas}</span>
          )}
        </div>

        {/* Macros — estructura preparada, se rellena cuando el plan incluya macros */}
        {(() => {
          // Estimación de macros a partir de kcal (ratios estándar por defecto)
          // Cuando el plan incluya macro_proteina, macro_carbs, macro_grasa → usarlos directamente
          const tieneProtObj = diaData.macro_proteina_g != null;
          const pObj = tieneProtObj ? diaData.macro_proteina_g : Math.round((kcalObj * 0.30) / 4);
          const cObj = tieneProtObj ? diaData.macro_carbs_g   : Math.round((kcalObj * 0.40) / 4);
          const gObj = tieneProtObj ? diaData.macro_grasa_g   : Math.round((kcalObj * 0.30) / 9);
          // Consumidas proporcional a % de kcal ingeridas
          const ratio = kcalObj > 0 ? kcalCons / kcalObj : 0;
          const pCons = Math.round(pObj * ratio);
          const cCons = Math.round(cObj * ratio);
          const gCons = Math.round(gObj * ratio);
          return (
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.02em' }}>
              <span style={{ color: pCons > 0 ? '#6B7280' : '#D1D5DB' }}>P: {pCons}/{pObj}g</span>
              <span style={{ margin: '0 5px', color: '#E5E7EB' }}>•</span>
              <span style={{ color: cCons > 0 ? '#6B7280' : '#D1D5DB' }}>C: {cCons}/{cObj}g</span>
              <span style={{ margin: '0 5px', color: '#E5E7EB' }}>•</span>
              <span style={{ color: gCons > 0 ? '#6B7280' : '#D1D5DB' }}>G: {gCons}/{gObj}g</span>
              {!tieneProtObj && <span style={{ marginLeft: 6, fontSize: 9, color: '#D1D5DB' }}>est.</span>}
            </div>
          );
        })()}
      </div>

      {/* Balance neto */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Balance</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: superavit ? '#E8621A' : deficit ? '#F9A825' : '#14B8A6', lineHeight: 1 }}>
          {balance > 0 ? '+' : ''}{balance.toLocaleString()}
        </div>
        <div style={{ fontSize: 9, color: '#9CA3AF' }}>kcal netas</div>
      </div>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [datos, setDatos]               = useState(null);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [objetivoId, setObjetivoId]     = useState('mantener');
  const [planSemanal, setPlanSemanal]   = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const [planDia, setPlanDia]           = useState(null);
  const [mostrarSemana, setMostrarSemana] = useState(false);
  const [streak, setStreak]             = useState(0);
  const [completedTasksHoy, setCompletedTasksHoy] = useState({});
  const [gastoActividadExtra, setGastoActividadExtra] = useState(0);
  const [mostrarSuperBoton, setMostrarSuperBoton]     = useState(false);
  const [presupuestoBase, setPresupuestoBase]         = useState(0);
  const [modoRescateActivo, setModoRescateActivo]     = useState(false);
  const [nombreUsuario, setNombreUsuario]             = useState('');
  const [checkinTexto, setCheckinTexto]               = useState('');
  const [protocolos, setProtocolos]                   = useState(['🔥 Déficit activo', '💧 Hidratación prioritaria']);
  const [reporteBanana, setReporteBanana]             = useState({
    analisis: null,
    adherencia: ['gris','gris','gris','gris','gris','gris','gris'],
  });

  // Banana state
  const [mensajesChat, setMensajesChat]               = useState(() => {
    // No restaurar en servidor
    if (typeof window === 'undefined') return [];
    return []; // se restaura en useEffect tras tener email
  });
  const [inputChat, setInputChat]                     = useState('');
  const [chatCargando, setChatCargando]               = useState(false);
  const [mensajeProactivoGenerado, setMensajeProactivoGenerado] = useState(false);
  const chatEndRef = useRef(null);

  const ultimo = datos?.[datos.length - 1];

  // Autoscroll chat
  useEffect(() => {
    if (!chatEndRef.current || mensajesChat.length === 0) return;
    const m = mensajesChat[mensajesChat.length - 1];
    if (!m?.cargando) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesChat]);

  // Persistir chat del día en localStorage (solo mensajes completos, sin los cargando)
  useEffect(() => {
    if (!email || mensajesChat.length === 0) return;
    const hoy = new Date().toISOString().split('T')[0];
    const completos = mensajesChat.filter(m => !m.cargando && m.texto);
    if (completos.length === 0) return;
    try { localStorage.setItem(`chat_${email}_${hoy}`, JSON.stringify(completos)); } catch {}
  }, [mensajesChat, email]);

  // Carga inicial
  useEffect(() => {
    if (!datos || !email) return;
    const init = async () => {
      let objId = 'mantener';
      try {
        const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
        if (cfg.objetivoId)      { setObjetivoId(cfg.objetivoId); objId = cfg.objetivoId; }
        if (cfg.presupuestoBase) setPresupuestoBase(cfg.presupuestoBase);
        if (cfg.nombre)          setNombreUsuario(cfg.nombre);
        // Cargar check-in del día
        const hoy = new Date().toISOString().split('T')[0];
        const checkin = JSON.parse(localStorage.getItem(`checkin_${email}_${hoy}`) || '{}');
        if (checkin.energia != null) {
          const str = `Energía ${checkin.energia}/10 · Sueño ${checkin.sueno}/10 · Estrés ${checkin.estres}/10`;
          setCheckinTexto(str);
        }
        // Restaurar protocolos del día
        const protGuardados = localStorage.getItem(`protocolos_${email}_${hoy}`);
        if (protGuardados) setProtocolos(JSON.parse(protGuardados));
        // Restaurar reporte del día
        const reporteGuardado = localStorage.getItem(`reporte_${email}_${hoy}`);
        if (reporteGuardado) setReporteBanana(JSON.parse(reporteGuardado));
        // Restaurar chat del día
        const chatGuardado = localStorage.getItem(`chat_${email}_${hoy}`);
        if (chatGuardado) {
          const msgs = JSON.parse(chatGuardado);
          if (msgs.length > 0) setMensajesChat(msgs);
        }
        // Archivar chat de ayer si existe y no está archivado
        const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const chatAyer = localStorage.getItem(`chat_${email}_${ayer}`);
        if (chatAyer) {
          try {
            const msgsAyer = JSON.parse(chatAyer);
            const resumen = msgsAyer
              .filter(m => m.rol === 'bot' && !m.cargando && m.texto)
              .slice(-3)
              .map(m => m.texto.slice(0, 120))
              .join(' | ');
            if (resumen) {
              const archivo = JSON.parse(localStorage.getItem(`chat_archivo_${email}`) || '[]');
              // Añadir solo si no está ya archivado ese día
              if (!archivo.find(a => a.fecha === ayer)) {
                archivo.unshift({ fecha: ayer, resumen });
                // Mantener solo los últimos 14 días
                localStorage.setItem(`chat_archivo_${email}`, JSON.stringify(archivo.slice(0, 14)));
              }
            }
            // Limpiar el chat raw de ayer para no acumular
            localStorage.removeItem(`chat_${email}_${ayer}`);
          } catch {}
        }
      } catch {}

      // Check onboarding
      try {
        const uRes = await fetch(`${SB_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=onboarding_completed,nombre&limit=1`, { headers: sbH });
        const uRows = await uRes.json();
        if (!uRows?.length || !uRows[0].onboarding_completed) { router.push('/onboarding'); return; }
        if (uRows[0].nombre) setNombreUsuario(uRows[0].nombre);
      } catch {}

      // Cargar plan
      try {
        const planDB = await cargarPlanDB(email, objId);
        if (planDB) { setPlanSemanal(planDB); actualizarPlanDia(planDB); }
        else {
          const g = localStorage.getItem(`plan_${email}_${objId}`);
          if (g) { const { plan, fecha } = JSON.parse(g); if ((Date.now() - fecha) / 86400000 < 7) { setPlanSemanal(plan); actualizarPlanDia(plan); } }
        }
      } catch {}
      try { const logs = await cargarLogsRecientes(email, 35); setStreak(calcularRacha(logs)); } catch {}
    };
    init();
  }, [datos, email]);

  const actualizarPlanDia = (plan) => {
    const d = getDiaHoy();
    const dd = plan?.dieta?.[d]; const ej = plan?.ejercicios?.[d];
    if (dd || ej) setPlanDia({
      comidas: dd ? { desayuno: dd.desayuno, comida: dd.comida, cena: dd.cena, snack: dd.snack } : null,
      entrenamiento: ej ? { tipo: ej.tipo, ejercicios: ej.ejercicios } : null,
    });
  };

  // Proactivo: cuando tenemos check-in + plan
  useEffect(() => {
    if (!checkinTexto || !planDia || mensajeProactivoGenerado || !ultimo) return;
    setMensajeProactivoGenerado(true);
    generarMensajeProactivo();
  }, [checkinTexto, planDia]);

  // ── buildCoachPayload ────────────────────────────────────────────
  const buildCoachPayload = useCallback((extras = {}) => {
    const scores = [
      { nombre: 'actividad física', val: ultimo?.efh_score },
      { nombre: 'nutrición',        val: ultimo?.nut_score },
      { nombre: 'descanso',         val: ultimo?.des_score },
    ];
    const peor = scores.reduce((a, b) => (a.val || 0) < (b.val || 0) ? a : b);
    // Leer archivo histórico de conversaciones anteriores
    let historialArchivo = [];
    try {
      historialArchivo = JSON.parse(localStorage.getItem(`chat_archivo_${email}`) || '[]');
    } catch {}

    return {
      email,
      nombre_usuario: nombreUsuario || null,
      plan_semana: planSemanal || null,
      historial_dias_anteriores: historialArchivo.slice(0, 7), // últimos 7 días
      contexto_dia: {
        checkin: checkinTexto || 'Check-in pendiente — no menciones valores numéricos',
        comidas: planDia?.comidas,
        entrenamiento: planDia?.entrenamiento,
      },
      perfil: {
        icm: ultimo?.icm_total,
        categoria: ultimo?.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado',
        edad_metabolica: ultimo?.edad_metabolica,
        mejor_bloque: 'actividad física',
        peor_bloque: peor.nombre,
        eco: ultimo?.eco_score, efh: ultimo?.efh_score,
        nut: ultimo?.nut_score, des: ultimo?.des_score, vit: ultimo?.vit_score,
        objetivo: OBJETIVOS.find(o => o.id === objetivoId)?.nombre,
      },
      ...extras,
    };
  }, [email, nombreUsuario, planSemanal, planDia, checkinTexto, ultimo, objetivoId]);

  // ── Ejecutar comandos del function calling ───────────────────────
  const getDiaHoyIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

  const ejecutarComandos = useCallback((comandos) => {
    if (!Array.isArray(comandos) || comandos.length === 0) return;
    for (const cmd of comandos) {
      if (cmd.accion === 'MOSTRAR_PLAN') setMostrarSemana(true);
      if (cmd.accion === 'ABRIR_CONFIG') setMostrarConfig(true);

      // ── ACTUALIZAR_PROTOCOLOS — persiste en localStorage ────────
      if (cmd.accion === 'ACTUALIZAR_PROTOCOLOS' && Array.isArray(cmd.nuevos_protocolos)) {
        setProtocolos(cmd.nuevos_protocolos);
        try {
          const hoy = new Date().toISOString().split('T')[0];
          localStorage.setItem(`protocolos_${email}_${hoy}`, JSON.stringify(cmd.nuevos_protocolos));
        } catch {}
      }

      // ── GENERAR_REPORTE — persiste en localStorage ───────────────
      if (cmd.accion === 'GENERAR_REPORTE' && cmd.analisis) {
        const reporte = {
          analisis: cmd.analisis,
          adherencia: Array.isArray(cmd.adherencia) ? cmd.adherencia : ['gris','gris','gris','gris','gris','gris','gris'],
        };
        setReporteBanana(reporte);
        try {
          const hoy = new Date().toISOString().split('T')[0];
          localStorage.setItem(`reporte_${email}_${hoy}`, JSON.stringify(reporte));
        } catch {}
      }

      // ── MODIFICAR_PLATO — persiste en BD + localStorage ──────────
      if (cmd.accion === 'MODIFICAR_PLATO') {
        const { tipo, nuevo_texto, nuevas_kcal } = cmd;
        if (!tipo || nuevo_texto == null) continue;

        // Ayuno: normalizar texto y forzar kcal a 0
        const textoFinal = nuevo_texto.toLowerCase().includes('ayuno') ? 'Ayuno' : nuevo_texto;
        const kcalFinal  = nuevo_texto.toLowerCase().includes('ayuno') ? 0 : (nuevas_kcal ?? null);

        setPlanSemanal(prev => {
          if (!prev?.dieta) return prev;
          const diaIdx = getDiaHoyIdx();
          const nuevo  = JSON.parse(JSON.stringify(prev));

          if (tipo === 'entreno') {
            if (nuevo.ejercicios?.[diaIdx]) {
              nuevo.ejercicios[diaIdx].tipo      = textoFinal;
              nuevo.ejercicios[diaIdx].ejercicios = [textoFinal];
              if (kcalFinal != null) nuevo.ejercicios[diaIdx].kcal_quemadas = kcalFinal;
            }
          } else {
            if (nuevo.dieta?.[diaIdx]) {
              nuevo.dieta[diaIdx][tipo] = textoFinal;
              // Siempre actualizar kcal — incluso si es 0 (ayuno)
              nuevo.dieta[diaIdx][`kcal_${tipo}`] = kcalFinal ?? 0;
            }
          }

          // Persistir en BD (background, no bloquea UI)
          guardarPlanDB(email, objetivoId, nuevo).catch(console.error);
          // Persistir en localStorage (instantáneo)
          try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: nuevo, fecha: Date.now() })); } catch {}

          return nuevo;
        });
      }
    }
  }, [email, objetivoId]);

  // ── Llamada a Banana ─────────────────────────────────────────────
  const llamarBanana = useCallback(async (payload, esReactivo = false) => {
    setChatCargando(true);
    if (!esReactivo) {
      setMensajesChat(prev => [...prev, { rol: 'bot', texto: '', cargando: true }]);
    }
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      const texto = data.respuesta || data.error || '...';
      ejecutarComandos(data.comandos);
      if (esReactivo) {
        // Añadir como mensaje nuevo sin input del usuario
        setMensajesChat(prev => [...prev, { rol: 'bot', texto, cargando: false }]);
      } else {
        setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto, cargando: false } : m));
      }
    } catch {
      if (!esReactivo) setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: 'Error al conectar.', cargando: false } : m));
    }
    setChatCargando(false);
  }, [ejecutarComandos]);

  const generarMensajeProactivo = useCallback(async () => {
    if (!ultimo) return;
    const scores = [{ nombre: 'actividad física', val: ultimo.efh_score }, { nombre: 'composición corporal', val: ultimo.eco_score }, { nombre: 'nutrición', val: ultimo.nut_score }, { nombre: 'descanso', val: ultimo.des_score }, { nombre: 'vitalidad', val: ultimo.vit_score }];
    const peor = scores.reduce((a, b) => a.val < b.val ? a : b);
    setChatCargando(true);
    setMensajesChat([{ rol: 'bot', texto: '', cargando: true, esProactivo: true }]);
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCoachPayload({ pregunta: `Genera un mensaje de bienvenida proactivo${nombreUsuario ? ` para ${nombreUsuario}` : ''} (máx 3 frases). Haz referencia directa a los platos de hoy si los tienes. Bloque débil: ${peor.nombre}. Sé específico.` })) });
      const data = await res.json();
      const chips = [];
      if (planDia?.entrenamiento) chips.push('Adapta el entreno de hoy');
      if (planDia?.comidas?.comida) chips.push('Receta rápida para la comida');
      chips.push('Cómo optimizo el descanso');
      ejecutarComandos(data.comandos);
      setMensajesChat([{ rol: 'bot', texto: data.respuesta || '', cargando: false, esProactivo: true, chips: chips.slice(0, 3) }]);
    } catch {
      setMensajesChat([{ rol: 'bot', texto: 'Hola! Estoy aquí para ayudarte hoy. ¿Qué necesitas?', cargando: false, esProactivo: true }]);
    }
    setChatCargando(false);
  }, [buildCoachPayload, nombreUsuario, planDia, ejecutarComandos, ultimo]);

  const enviarMensaje = useCallback(async (texto) => {
    const q = texto || inputChat;
    if (!q?.trim() || chatCargando) return;
    setInputChat('');
    const historialLimpio = mensajesChat.filter(m => !m.cargando && m.texto).map(m => ({ rol: m.rol, texto: m.texto }));
    setMensajesChat(prev => [...prev, { rol: 'usuario', texto: q }, { rol: 'bot', texto: '', cargando: true }]);
    await llamarBanana(buildCoachPayload({ pregunta: q, historial: historialLimpio }));
  }, [inputChat, chatCargando, mensajesChat, buildCoachPayload, llamarBanana]);

  // ── Check-in reactivo: debounce ya está en MicroCheckIn ─────────
  const handleCheckinReactivo = useCallback(async (checkinStr) => {
    setCheckinTexto(checkinStr);
    await llamarBanana(buildCoachPayload({ tipo: 'checkin_reactivo', pregunta: `Check-in actualizado: ${checkinStr}` }), true);
  }, [buildCoachPayload, llamarBanana]);

  const activarEvento = async (evento, detalle, diaEvento) => {
    setMostrarSuperBoton(false);
    setChatCargando(true);
    setMensajesChat(prev => [...prev, { rol: 'bot', texto: '', cargando: true, esEvento: true }]);
    try {
      const res = await fetch('/api/rewrite-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, objetivo_id: objetivoId, plan_actual: planSemanal, evento: `${evento.label}${detalle ? ': ' + detalle : ''}`, dia_evento: diaEvento, perfil: { icm: ultimo?.icm_total, objetivo: OBJETIVOS.find(o => o.id === objetivoId)?.nombre } }) });
      const data = await res.json();
      if (data.plan) {
        setPlanSemanal(data.plan);
        try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: data.plan, fecha: Date.now() })); } catch {}
        actualizarPlanDia(data.plan);
        setModoRescateActivo(true); setTimeout(() => setModoRescateActivo(false), 86400000);
        const diasTexto = data.dias_modificados?.join(' y ') || 'los días afectados';
        setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: `${data.mensaje_coach || '✅ Plan adaptado.'}\n\nHe actualizado ${diasTexto}. Tu racha sigue intacta.`, cargando: false, esEvento: true } : m));
      } else throw new Error();
    } catch {
      setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: `Estrategia: ${evento.protocolo}. Tu racha sigue intacta. 💪`, cargando: false, esEvento: true } : m));
    }
    setChatCargando(false);
  };

  const generarPlan = async () => {
    if (!ultimo) return;
    setCargandoPlan(true);
    const scores = [{ nombre: 'Actividad física', valor: ultimo.efh_score }, { nombre: 'Composición corporal', valor: ultimo.eco_score }, { nombre: 'Nutrición', valor: ultimo.nut_score }, { nombre: 'Descanso', valor: ultimo.des_score }, { nombre: 'Vitalidad', valor: ultimo.vit_score }];
    const mejor = scores.reduce((a, b) => a.valor > b.valor ? a : b);
    const peor  = scores.reduce((a, b) => a.valor < b.valor ? a : b);
    let prefTexto = '';
    try {
      const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
      if (cfg.alergias?.length)            prefTexto += `ALERGIAS: ${cfg.alergias.join(', ')}. `;
      if (cfg.noComidas?.length)           prefTexto += `NO COME: ${cfg.noComidas.join(', ')}. `;
      if (cfg.tipoDieta === 'vegetariano') prefTexto += 'SIN carne. ';
      if (cfg.tipoDieta === 'vegano')      prefTexto += 'SIN productos animales. ';
      if (cfg.tipoDieta === 'cetogenica')  prefTexto += 'Cetogénica. ';
      if (cfg.nivelCocina === 'rapido')    prefTexto += 'Recetas <20min. ';
      if (cfg.horarioEntreno)             prefTexto += `Entreno: ${cfg.horarioEntreno}. `;
    } catch {}
    const obj = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[1];
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'plan', perfil: { objetivo: obj.nombre, icm: ultimo.icm_total, categoria: 'Metabolismo activo', edad_metabolica: ultimo.edad_metabolica, mejor_bloque: mejor.nombre, peor_bloque: peor.nombre, eco: ultimo.eco_score, efh: ultimo.efh_score, nut: ultimo.nut_score, des: ultimo.des_score, vit: ultimo.vit_score, preferencias: prefTexto } }) });
      const data = await res.json();
      if (data.plan) {
        const diaHoyIdx = getDiaHoy();
        const planFinal = planSemanal?.dieta ? {
          ...data.plan,
          dieta:     data.plan.dieta.map((d, i)     => i < diaHoyIdx && planSemanal.dieta     ? planSemanal.dieta[i]     : d),
          ejercicios:data.plan.ejercicios.map((e, i) => i < diaHoyIdx && planSemanal.ejercicios ? planSemanal.ejercicios[i] : e),
        } : data.plan;
        setPlanSemanal(planFinal);
        await guardarPlanDB(email, objetivoId, planFinal);
        try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: planFinal, fecha: Date.now() })); } catch {}
        actualizarPlanDia(planFinal);
      }
    } catch {}
    setCargandoPlan(false);
  };

  const buscarDatos = async () => {
    if (!email?.trim()) return;
    setCargando(true); setError(null);
    try {
      const res = await fetch(`${SB_URL}/rest/v1/tests?email=eq.${encodeURIComponent(email)}&order=fecha.asc`, { headers: sbH });
      const tests = await res.json();
      if (!tests.length) setError('No encontramos ningún test con ese email.');
      else setDatos(tests);
    } catch { setError('Error al conectar.'); }
    finally { setCargando(false); }
  };

  const formatFecha = f => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const chartData = datos?.map((t, i) => ({ x: datos.length === 1 ? 50 : (i / (datos.length - 1)) * 80 + 10, y: 90 - ((t.icm_total / 100) * 70), icm: t.icm_total, fecha: formatFecha(t.fecha) }));
  const pathD = chartData?.length > 1 ? chartData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 6.8} ${p.y * 1.1}`).join(' ') : null;
  const areaD = pathD ? `${pathD} L ${chartData[chartData.length-1].x*6.8} 110 L ${chartData[0].x*6.8} 110 Z` : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>

      {mostrarConfig && (
        <ConfiguracionMetabolica ultimo={ultimo} email={email} gastoActividadExtra={gastoActividadExtra}
          onGuardar={cfg => { setObjetivoId(cfg.objetivoId); if (cfg.presupuestoBase) setPresupuestoBase(cfg.presupuestoBase); setPlanSemanal(null); setMostrarConfig(false); }}
          onCerrar={() => setMostrarConfig(false)} />
      )}
      {mostrarSemana && planSemanal && <WeeklyPlannerModal planSemanal={planSemanal} onCerrar={() => setMostrarSemana(false)} email={email} objetivoId={objetivoId} />}
      {mostrarSuperBoton && <SuperBotonEventos onCerrar={() => setMostrarSuperBoton(false)} onEnviar={activarEvento} />}

      {/* NAV */}
      <nav style={{ background: C.accent, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>🍌 <span style={{ color: 'rgba(255,255,255,0.9)' }}>my</span><span style={{ color: C.white }}>metaboliq</span></span>
        {datos && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {nombreUsuario && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Hola, {nombreUsuario} 👋</span>}
            {planSemanal && <button onClick={() => setMostrarSemana(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>🛒 Semana</button>}
            <button onClick={() => setMostrarConfig(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.white, width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer' }}>⚙️</button>
            <button onClick={() => { setDatos(null); setEmail(''); setMensajesChat([]); setMensajeProactivoGenerado(false); setPlanSemanal(null); setStreak(0); setCheckinTexto(''); }} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>Salir</button>
          </div>
        )}
      </nav>

      {/* LOGIN */}
      {!datos && (
        <div style={{ textAlign: 'center', paddingTop: 60, padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🍌</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.dark, marginBottom: 8 }}>Tu dashboard <span style={{ color: C.accent, fontStyle: 'italic' }}>metabólico</span></h1>
          <p style={{ fontSize: 14, color: C.mid, marginBottom: 8, lineHeight: 1.7 }}>Introduce el email con el que hiciste el test.</p>
          <p style={{ fontSize: 13, color: C.mid, marginBottom: 28 }}>¿Primera vez? <a href="/onboarding" style={{ color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Empieza aquí →</a></p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 360, margin: '0 auto' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarDatos()} placeholder="tu@email.com"
              style={{ flex: 1, padding: '12px 18px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 14, background: C.white, fontFamily: font, outline: 'none', color: C.dark }} />
            <button onClick={buscarDatos} disabled={cargando} style={{ background: C.accent, color: C.white, border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>{cargando ? '...' : 'Ver →'}</button>
          </div>
          {error && <p style={{ color: C.orange, fontSize: 13, marginTop: 14 }}>{error}</p>}
        </div>
      )}

      {/* DASHBOARD — Layout híbrido */}
      {datos && ultimo && (
        <div className="dashboard-grid">

          {/* ── COLUMNA IZQUIERDA: Banana + Check-in + Hero ICM ── */}
          <div className="col-left">

            {/* Hero ICM compacto */}
            <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, borderRadius: 16, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>ICM · Calidad Metabólica</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{icmLabel(ultimo.icm_total)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: C.white, lineHeight: 1 }}>{ultimo.icm_total}<span style={{ fontSize: 13, opacity: 0.6 }}>/100</span></div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Edad metab. <strong style={{ color: C.white }}>{ultimo.edad_metabolica}</strong></div>
                </div>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.25)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ultimo.icm_total}%`, background: C.white, borderRadius: 100 }} />
              </div>
              {/* Scores mini */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, marginTop: 10 }}>
                {[{ icon: '⚡', val: ultimo.efh_score }, { icon: '🏋️', val: ultimo.eco_score }, { icon: '🥗', val: ultimo.nut_score }, { icon: '🧠', val: ultimo.vit_score }, { icon: '😴', val: ultimo.des_score }].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 7, padding: '5px 3px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, color: C.white, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Racha */}
            {streak > 0 && (
              <div style={{ background: streak >= 7 ? C.accent : C.panel, borderRadius: 12, padding: '10px 14px', marginBottom: 12, border: `1px solid ${streak >= 7 ? C.accent : C.light}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{streak >= 7 ? '🔥' : '⚡'}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: streak >= 7 ? C.white : C.accent, fontFamily: 'Georgia, serif' }}>{streak} días de racha</div>
                  <div style={{ fontSize: 10, color: streak >= 7 ? 'rgba(255,255,255,0.75)' : C.mid }}>{streak >= 7 ? '¡Racha semanal activa!' : `${7 - streak} días para la semanal`}</div>
                </div>
              </div>
            )}

            {/* Micro check-in */}
            <MicroCheckIn email={email} onCheckinChange={setCheckinTexto} onBananaReactivo={handleCheckinReactivo} />

            {/* Banana chat — inline en desktop */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.light}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <BananaChat
                mensajes={mensajesChat} input={inputChat} setInput={setInputChat}
                cargando={chatCargando} onEnviar={enviarMensaje}
                chatEndRef={chatEndRef} inline={true}
              />
            </div>

          </div>

          {/* ── COLUMNA DERECHA: Timeline + acciones ── */}
          <div className="col-right">

            {/* Centro de Mando Calórico */}
            {planSemanal && (
              <KcalTracker planSemanal={planSemanal} completedTasks={completedTasksHoy} />
            )}

            <DailyTimeline
              planSemanal={planSemanal} setPlanSemanal={setPlanSemanal}
              email={email} objetivoId={objetivoId}
              onAbrirConfig={() => setMostrarConfig(true)}
              onTodoCompletado={() => { setMensajesChat(prev => [...prev, { rol: 'bot', texto: '¡Día perfecto completado! 🎉 Tu metabolismo te lo agradecerá mañana.', cargando: false }]); }}
              onGenerarPlan={generarPlan} cargandoPlan={cargandoPlan}
              objetivo={OBJETIVOS.find(o => o.id === objetivoId)}
              onChecksChange={checks => setCompletedTasksHoy(checks)}
              onGastoActividadChange={delta => setGastoActividadExtra(prev => prev + delta)}
              presupuestoBase={presupuestoBase}
              onKcalConsumidas={() => {}}
              modoRescate={modoRescateActivo}
              protocolos={protocolos}
            />

            {/* Super-botón */}
            <button onClick={() => setMostrarSuperBoton(true)} style={{ background: `linear-gradient(135deg,#E65100,${C.orange})`, border: 'none', borderRadius: 14, padding: '14px 18px', cursor: 'pointer', fontFamily: font, width: '100%', textAlign: 'left', marginTop: 16, animation: 'borderPulse 2.5s ease infinite' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 2 }}>🗓️ Tengo un evento — adaptar mi plan</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Boda, viaje, cena social o salté el plan</div>
                </div>
                <span style={{ fontSize: 22, color: C.white }}>→</span>
              </div>
            </button>

            {/* CTA suscripción */}
            <div style={{ background: C.slate, borderRadius: 14, padding: '14px 18px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: C.white }}>Seguimiento mensual</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>19,90€/mes · Cancela cuando quieras</div>
              </div>
              <a href="#" style={{ background: C.white, color: C.slate, padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Activar →</a>
            </div>

            {/* Analítica colapsada */}
            <details style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.light}`, marginTop: 12 }}>
              <summary style={{ background: C.white, padding: '13px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: font, fontSize: 13, fontWeight: 600, color: C.dark, userSelect: 'none' }}>
                <span>📊 Reporte analítico</span>
                <span className="chevron" style={{ fontSize: 14, color: C.mid }}>▾</span>
              </summary>
              <div style={{ padding: '14px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Potencial de mejora — siempre visible */}
                <div style={{ background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.light}` }}>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>🚀 Tu potencial de mejora</div>
                  {[
                    { icon: '⚡', label: 'Actividad física',    val: ultimo.efh_score, anos: 3 },
                    { icon: '🏋️', label: 'Composición corporal',val: ultimo.eco_score, anos: 4 },
                    { icon: '🥗', label: 'Nutrición',           val: ultimo.nut_score, anos: 2 },
                    { icon: '😴', label: 'Descanso',            val: ultimo.des_score, anos: 3 },
                    { icon: '🧠', label: 'Vitalidad',           val: ultimo.vit_score, anos: 2 },
                  ].sort((a, b) => a.val - b.val).map((s, i) => {
                    const col = s.val >= 65 ? C.accent : s.val >= 50 ? '#F9A825' : C.orange;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: C.dark }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: col, fontWeight: 700 }}>{s.val}/100</span>
                          </div>
                          <div style={{ height: 5, background: C.light, borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.val}%`, background: col, borderRadius: 100, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 9, color: col, fontWeight: 700, background: `${col}15`, border: `1px solid ${col}44`, padding: '2px 7px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                          -{s.anos} años
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 4, padding: '8px 12px', background: C.panel, borderRadius: 8, fontSize: 11, color: C.mid, lineHeight: 1.5 }}>
                    💡 ICM potencial: <strong style={{ color: C.accent }}>{Math.min(100, Math.round(ultimo.icm_total * 1.18))}/100</strong> mejorando tus 2 bloques más bajos
                  </div>
                </div>

                {/* Evolución — solo si hay más de 1 test */}
                {datos.length > 1 && (
                  <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Evolución del ICM</div>
                    <svg viewBox="0 0 680 110" style={{ width: '100%', height: 100 }}>
                      <defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.white} stopOpacity="0.25" /><stop offset="100%" stopColor={C.white} stopOpacity="0" /></linearGradient></defs>
                      {areaD && <path d={areaD} fill="url(#aG)" />}
                      {pathD && <path d={pathD} fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {chartData?.map((p, i) => (<g key={i}><circle cx={p.x*6.8} cy={p.y*1.1} r="5" fill={i===chartData.length-1 ? C.orange : C.white} stroke={C.accent} strokeWidth="2" /><text x={p.x*6.8} y={p.y*1.1-10} textAnchor="middle" fontSize="10" fill={C.white} fontWeight="600">{p.icm}</text></g>))}
                    </svg>
                  </div>
                )}

                {/* Historial — solo si hay más de 1 test */}
                {datos.length > 1 && (
                  <div style={{ background: C.white, borderRadius: 12, padding: 14, border: `1px solid ${C.light}` }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: C.dark, marginBottom: 12 }}>Historial de tests</div>
                    {[...datos].reverse().map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < datos.length - 1 ? `1px solid ${C.light}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: 12, color: C.dark }}>{formatFecha(t.fecha)}{i===0 && <span style={{ fontSize: 9, background: C.greenPale, color: C.accent, padding: '1px 7px', borderRadius: 100, marginLeft: 6 }}>Último</span>}</div>
                          <div style={{ fontSize: 10, color: C.mid }}>Edad metabólica: {t.edad_metabolica} años</div>
                        </div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: icmColor(t.icm_total) }}>{t.icm_total}<span style={{ fontSize: 9, color: C.mid }}>/100</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Veredicto Semanal de Banana */}
                <div style={{ background: C.panel, border: `1px solid ${C.light}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🍌</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Veredicto semanal de Banana</span>
                  </div>

                  <div style={{ padding: '14px' }}>
                    {/* Mapa de adherencia — 7 días Lun→Dom */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Adherencia esta semana</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {['L','M','X','J','V','S','D'].map((dia, i) => {
                          const estado = reporteBanana.adherencia[i] || 'gris';
                          const colores = {
                            verde:   { bg: '#D1FAE5', border: '#34D399', text: '#065F46' },
                            naranja: { bg: '#FEF3C7', border: '#FBBF24', text: '#92400E' },
                            rojo:    { bg: '#FEE2E2', border: '#F87171', text: '#991B1B' },
                            gris:    { bg: '#F3F4F6', border: '#D1D5DB', text: '#9CA3AF' },
                          };
                          const col = colores[estado] || colores.gris;
                          return (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: col.bg, border: `1.5px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                                {estado === 'verde'   && <span style={{ fontSize: 10 }}>✓</span>}
                                {estado === 'naranja' && <span style={{ fontSize: 10 }}>~</span>}
                                {estado === 'rojo'    && <span style={{ fontSize: 10 }}>✕</span>}
                                {estado === 'gris'    && <span style={{ fontSize: 8, color: col.text }}>·</span>}
                              </div>
                              <div style={{ fontSize: 8, color: col.text, fontWeight: 600 }}>{dia}</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Leyenda */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                        {[
                          { color: '#34D399', label: 'En objetivo' },
                          { color: '#FBBF24', label: 'Exceso' },
                          { color: '#F87171', label: 'Fallo' },
                          { color: '#D1D5DB', label: 'Pendiente' },
                        ].map((l, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
                            <span style={{ fontSize: 9, color: '#9CA3AF' }}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Análisis de Banana */}
                    {reporteBanana.analisis ? (
                      <div style={{ background: C.white, borderRadius: 9, padding: '10px 12px', border: `1px solid ${C.light}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>🍌</span>
                        <p style={{ margin: 0, fontSize: 12, color: C.dark, lineHeight: 1.65, fontStyle: 'italic' }}>
                          {reporteBanana.analisis}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => enviarMensaje('¿Cómo voy esta semana? Dame tu veredicto.')}
                        style={{ width: '100%', background: 'none', border: `1.5px dashed ${C.light}`, borderRadius: 9, padding: '10px 12px', cursor: 'pointer', fontFamily: font, display: 'flex', gap: 8, alignItems: 'center', color: '#9CA3AF', fontSize: 12 }}
                      >
                        <span style={{ fontSize: 16 }}>🍌</span>
                        <span>Pregúntame cómo vas esta semana →</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </details>

          </div>
        </div>
      )}
    </div>
  );
}