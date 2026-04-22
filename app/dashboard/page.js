'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DailyTimeline from './DailyTimeline';
import ConfiguracionMetabolica from './ConfiguracionMetabolica';
import WeeklyPlannerModal from './WeeklyPlannerModal';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const C = {
  bg:        '#1E293B',
  panel:     '#263447',
  card:      '#2D3E50',
  dark:      '#F1F5F9',
  mid:       '#94A3B8',
  accent:    '#18778f',
  accentDk:  '#0D5F73',
  accentLt:  'rgba(24,119,143,0.25)',
  orange:    '#E8621A',
  orangeLt:  'rgba(232,98,26,0.15)',
  light:     'rgba(255,255,255,0.08)',
  white:     '#FFFFFF',
  greenPale: 'rgba(24,119,143,0.12)',
  orangePale:'rgba(232,98,26,0.12)',
  leftBg:    '#1E293B',
  leftPanel: '#263447',
  slate:     '#1E293B',
  boxBg:     '#18778f',
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
async function cargarDailyState(email) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${SB_URL}/rest/v1/daily_state?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy}&limit=1`,
      { headers: sbH }
    );
    const rows = await res.json();
    return rows?.[0] || null;
  } catch { return null; }
}
async function guardarDailyState(email, campos) {
  const hoy = new Date().toISOString().split('T')[0];
  try {
    const check = await fetch(
      `${SB_URL}/rest/v1/daily_state?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy}`,
      { headers: sbH }
    );
    const rows = await check.json();
    if (rows?.length > 0) {
      await fetch(
        `${SB_URL}/rest/v1/daily_state?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy}`,
        { method: 'PATCH', headers: sbH, body: JSON.stringify({ ...campos, updated_at: new Date().toISOString() }) }
      );
    } else {
      await fetch(`${SB_URL}/rest/v1/daily_state`, {
        method: 'POST',
        headers: { ...sbH, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ email, fecha: hoy, ...campos, updated_at: new Date().toISOString() }),
      });
    }
  } catch (e) { console.error('guardarDailyState error:', e); }
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

// ── Micro Check-in widget — confirmación manual ─────────────────────
function MicroCheckIn({ email, onCheckinChange, onBananaReactivo }) {
  const hoy = () => new Date().toISOString().split('T')[0];
  const [energia, setEnergia]   = useState(7);
  const [sueno, setSueno]       = useState(7);
  const [estres, setEstres]     = useState(4);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  // Carga inicial: Supabase primero, localStorage como fallback instantáneo
  useEffect(() => {
    if (!email) return;

    // 1. Fallback visual inmediato desde localStorage
    try {
      const cached = JSON.parse(localStorage.getItem(`checkin_${email}_${hoy()}`) || '{}');
      if (cached.energia != null) {
        setEnergia(cached.energia); setSueno(cached.sueno); setEstres(cached.estres);
        setGuardado(true);
        onCheckinChange?.(`Energía ${cached.energia}/10 · Sueño ${cached.sueno}/10 · Estrés ${cached.estres}/10`);
      }
    } catch {}

    // 2. Supabase sobreescribe — fuente de verdad cross-device
    const fetchBD = async () => {
      try {
        const res = await fetch(
          `${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy()}&select=energia,sueno,estres&limit=1`,
          { headers: sbH }
        );
        const rows = await res.json();
        if (rows?.[0]?.energia != null) {
          const r = rows[0];
          setEnergia(r.energia); setSueno(r.sueno); setEstres(r.estres);
          setGuardado(true);
          const str = `Energía ${r.energia}/10 · Sueño ${r.sueno}/10 · Estrés ${r.estres}/10`;
          onCheckinChange?.(str);
          try { localStorage.setItem(`checkin_${email}_${hoy()}`, JSON.stringify({ energia: r.energia, sueno: r.sueno, estres: r.estres, fecha: hoy() })); } catch {}
        }
      } catch {}
    };
    fetchBD();
  }, [email]);

  const confirmarCheckin = async () => {
    setMostrarConfirm(false);
    setGuardando(true);
    const checkinStr = `Energía ${energia}/10 · Sueño ${sueno}/10 · Estrés ${estres}/10`;
    // Guardar en localStorage
    try { localStorage.setItem(`checkin_${email}_${hoy()}`, JSON.stringify({ energia, sueno, estres, fecha: hoy() })); } catch {}
    // Guardar en Supabase
    await upsertCheckInBD(email, energia, sueno, estres);
    setGuardado(true);
    setGuardando(false);
    onCheckinChange?.(checkinStr);
    onBananaReactivo?.(checkinStr);
  };

  const colorE  = v => v >= 7 ? C.accent : v >= 4 ? '#F9A825' : C.orange;
  const colorS  = v => v >= 7 ? C.accent : v >= 4 ? '#F9A825' : C.orange;
  const colorSt = v => v <= 3 ? C.accent : v <= 6 ? '#F9A825' : C.orange;

  return (
    <>
      {/* Popup de confirmación */}
      {mostrarConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 24px' }}>
          <div onClick={() => setMostrarConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.white, borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 400, boxShadow: '0 -4px 40px rgba(0,0,0,0.18)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.dark, marginBottom: 6 }}>Confirmar check-in</div>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 20, lineHeight: 1.6 }}>
              Energía <strong style={{ color: colorE(energia) }}>{energia}/10</strong> · Sueño <strong style={{ color: colorS(sueno) }}>{sueno}/10</strong> · Estrés <strong style={{ color: colorSt(estres) }}>{estres}/10</strong>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 20 }}>
              Una vez guardado, Banana analizará tu estado y no podrás modificarlo hoy.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMostrarConfirm(false)} style={{ flex: 1, background: C.panel, border: `1px solid ${C.light}`, color: C.mid, padding: '12px', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontFamily: font }}>
                Ajustar
              </button>
              <button onClick={confirmarCheckin} style={{ flex: 2, background: C.accent, color: C.white, border: 'none', padding: '12px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                Confirmar y enviar a Banana →
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: C.panel, borderRadius: 14, padding: '14px 16px', border: `1px solid rgba(255,255,255,0.08)`, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ⚡ Check-in de hoy
          </div>
          {guardado && (
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              ✓ Guardado
            </div>
          )}
        </div>

        {guardado ? (
          // Vista compacta si ya está guardado
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {[
              { emoji: '⚡', label: 'Energía', val: energia, color: colorE(energia) },
              { emoji: '😴', label: 'Sueño',   val: sueno,   color: colorS(sueno)   },
              { emoji: '🧠', label: 'Estrés',  val: estres,  color: colorSt(estres) },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C.white, borderRadius: 10, padding: '8px 6px', textAlign: 'center', border: `1px solid ${C.light}` }}>
                <div style={{ fontSize: 13 }}>{s.emoji}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: C.mid, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          // Vista editable con sliders
          <>
            {[
              { label: 'Energía', val: energia, set: setEnergia, color: colorE(energia),  emoji: '⚡' },
              { label: 'Sueño',   val: sueno,   set: setSueno,   color: colorS(sueno),    emoji: '😴' },
              { label: 'Estrés',  val: estres,  set: setEstres,  color: colorSt(estres),  emoji: '🧠' },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 10 : 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.mid }}>{s.emoji} {s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.val}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={s.val}
                  onChange={e => s.set(+e.target.value)}
                  style={{ width: '100%', accentColor: s.color, height: 4, cursor: 'pointer', touchAction: 'pan-x', fontSize: 16 }} />
              </div>
            ))}
            <button
              onClick={() => setMostrarConfirm(true)}
              disabled={guardando}
              style={{ width: '100%', background: guardando ? C.accentLt : C.accent, color: C.white, border: 'none', borderRadius: 100, padding: '11px', fontSize: 13, fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: font, transition: 'background 0.2s' }}
            >
              {guardando ? '⏳ Guardando...' : 'Guardar check-in →'}
            </button>
          </>
        )}
      </div>
    </>
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
      <div className="banana-messages" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: C.panel, minHeight: inline ? 0 : 240, maxHeight: inline ? 'none' : 360 }}>
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
              background: m.rol === 'usuario' ? C.orange : '#263447',
              color: '#F1F5F9',
              fontSize: 12, lineHeight: 1.65,
              border: m.rol === 'bot' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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
          style={{ flex: 1, padding: '10px 14px', border: `1.5px solid rgba(255,255,255,0.15)`, borderRadius: 100, fontSize: 16, fontFamily: font, outline: 'none', color: '#1E293B', background: '#ffffff' }} />
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
          <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Detalles opcionales..." style={{ width: '100%', height: 60, padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 10, fontSize: 16, fontFamily: font, resize: 'none', outline: 'none', background: C.bg, color: C.dark, boxSizing: 'border-box' }} />
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
function KcalTracker({ planSemanal, completedTasks, planDiario = [], objetivoId, gastoExtra = 0, ingestaExtra = 0 }) {
  const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
  const diaIdx    = getDiaHoy();
  const diaData   = planSemanal?.dieta?.[diaIdx];
  const entreno   = planSemanal?.ejercicios?.[diaIdx];

  const usarPlanDiario = planDiario && planDiario.length > 0;
  if (!diaData && !usarPlanDiario) return null;

  // Kcal objetivo: desde planDiario si activo, si no desde plan semanal
  const kcalObjSemanal = diaData
    ? (diaData.kcal_desayuno || 0) + (diaData.kcal_comida || 0) +
      (diaData.kcal_cena || 0) + (diaData.kcal_snack || 0)
    : 0;

  // Kcal consumidas — plan semanal (completedTasks)
  const kcalConsBase =
    (completedTasks?.desayuno ? (diaData?.kcal_desayuno || 0) : 0) +
    (completedTasks?.comida   ? (diaData?.kcal_comida   || 0) : 0) +
    (completedTasks?.cena     ? (diaData?.kcal_cena     || 0) : 0);

  // Kcal consumidas — tarjetas Banana
  const kcalConsBanana = usarPlanDiario
    ? planDiario.filter(t => t.estado === 'completado' && t.tipo !== 'entreno').reduce((sum, t) => sum + (t.kcal || 0), 0)
    : 0;

  const kcalCons = usarPlanDiario ? kcalConsBanana : kcalConsBase;

  // Kcal quemadas
  const kcalQuemadas = usarPlanDiario
    ? planDiario.filter(t => t.estado === 'completado' && t.tipo === 'entreno').reduce((sum, t) => sum + (t.kcal_quemadas || 0), 0)
    : (completedTasks?.entreno && entreno?.kcal_quemadas) ? entreno.kcal_quemadas : 0;

  // kcalObj: si hay planDiario, sumar kcal totales de las tarjetas
  const kcalObjDiario = usarPlanDiario
    ? planDiario.filter(t => t.tipo !== 'entreno').reduce((sum, t) => sum + (t.kcal || 0), 0)
    : 0;

  const kcalObj = (planDiario && planDiario.length > 0 && kcalObjDiario > 0) ? kcalObjDiario : kcalObjSemanal;

  // Balance neto — incluye extras de Quick Add
  const kcalConsTotal = kcalCons + ingestaExtra;
  const kcalQuemadasTotal = kcalQuemadas + gastoExtra;
  const balance    = kcalConsTotal - kcalQuemadasTotal;
  const pct        = kcalObj > 0 ? Math.min(100, Math.round((kcalConsTotal / kcalObj) * 100)) : 0;
  const superavit  = balance > kcalObj * 1.1;
  const deficit    = kcalCons < kcalObj * 0.3 && completedTasks && Object.values(completedTasks).some(Boolean);

  // Color semáforo
  const barColor   = pct >= 90 ? '#0D9488' : pct >= 55 ? '#14B8A6' : pct >= 30 ? '#F9A825' : '#D1ECF1';
  const statusIcon = pct >= 90 ? '✅' : pct >= 55 ? '🔥' : pct >= 30 ? '⚡' : '💤';

  // SVG arco circular
  const R = 34; const circ = 2 * Math.PI * R;
  const dash = circ * (pct / 100);

  return (
    <div className="kcal-tracker-sticky" style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(38,52,71,0.98)',
      backdropFilter: 'blur(8px)',
      borderBottom: `2px solid ${barColor}`,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Arco circular — más grande */}
      <div style={{ flexShrink: 0, position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={R} fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <circle cx="40" cy="40" r={R} fill="none" stroke={barColor}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: barColor,
          fontFamily: 'Georgia, serif',
        }}>{pct}%</div>
      </div>

      {/* Números — más grandes */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#F1F5F9', lineHeight: 1 }}>
            {kcalConsTotal.toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>/ {kcalObj.toLocaleString()} kcal</span>
          <span style={{ fontSize: 18, marginLeft: 2 }}>{statusIcon}</span>
        </div>

        {/* Barra lineal */}
        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>

        {/* Detalle comidas */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {usarPlanDiario
            ? planDiario.filter(t => t.tipo !== 'entreno' && t.kcal > 0).map((t, i) => (
                <span key={i} style={{ fontSize: 10, color: t.estado === 'completado' ? '#0D9488' : '#9CA3AF', fontWeight: t.estado === 'completado' ? 700 : 400, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {t.estado === 'completado' ? '✓' : '○'} {t.titulo?.split(':')[0] || t.tipo} {t.kcal}
                </span>
              ))
            : [
                { label: 'Desayuno', val: diaData?.kcal_desayuno, done: completedTasks?.desayuno },
                { label: 'Comida',   val: diaData?.kcal_comida,   done: completedTasks?.comida   },
                { label: 'Cena',     val: diaData?.kcal_cena,     done: completedTasks?.cena     },
              ].filter(s => s.val > 0).map((s, i) => (
                <span key={i} style={{ fontSize: 10, color: s.done ? '#0D9488' : '#9CA3AF', fontWeight: s.done ? 700 : 400, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {s.done ? '✓' : '○'} {s.label} {s.val}
                </span>
              ))
          }
          {kcalQuemadas > 0 && (
            <span style={{ fontSize: 10, color: '#0D9488', fontWeight: 700 }}>🏋️ −{kcalQuemadas}</span>
          )}
        </div>

        {/* Macros — estructura preparada, se rellena cuando el plan incluya macros */}
        {(() => {
          // Estimación de macros a partir de kcal (ratios estándar por defecto)
          // Cuando el plan incluya macro_proteina, macro_carbs, macro_grasa → usarlos directamente
          const macroRatios = {
            'definicion_agresiva': { p: 0.45, c: 0.25, g: 0.30 },
            'definicion_suave':    { p: 0.40, c: 0.30, g: 0.30 },
            'recomposicion':       { p: 0.40, c: 0.30, g: 0.30 },
            'volumen':             { p: 0.30, c: 0.50, g: 0.20 },
            'rendimiento':         { p: 0.25, c: 0.55, g: 0.20 },
            'mantener':            { p: 0.30, c: 0.40, g: 0.30 },
            'salud':               { p: 0.30, c: 0.40, g: 0.30 },
          };
          const mr = macroRatios[objetivoId] || macroRatios['mantener'];
          const tieneProtObj = diaData?.macro_proteina_g != null;
          const pObj = tieneProtObj ? diaData.macro_proteina_g : Math.round((kcalObj * mr.p) / 4);
          const cObj = tieneProtObj ? diaData.macro_carbs_g   : Math.round((kcalObj * mr.c) / 4);
          const gObj = tieneProtObj ? diaData.macro_grasa_g   : Math.round((kcalObj * mr.g) / 9);
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
  const [ingestaExtraDia, setIngestaExtraDia]         = useState(0);
  const [mostrarSuperBoton, setMostrarSuperBoton]     = useState(false);
  const [presupuestoBase, setPresupuestoBase]         = useState(0);
  const [modoRescateActivo, setModoRescateActivo]     = useState(false);
  const [nombreUsuario, setNombreUsuario]             = useState('');
  const [checkinTexto, setCheckinTexto]               = useState('');
  const [planDiario, setPlanDiario]                   = useState([]);  // Táctica del día — construido por Banana
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
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false); // legacy, ya no se usa
  const [activeTab, setActiveTab]                 = useState('hoy'); // 'chat' | 'hoy' | 'perfil'
  const [mensajesNoLeidos, setMensajesNoLeidos]   = useState(0);

  const ultimo = datos?.[datos.length - 1];

  // Autoscroll chat
  useEffect(() => {
    if (!chatEndRef.current || mensajesChat.length === 0) return;
    const m = mensajesChat[mensajesChat.length - 1];
    if (!m?.cargando) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesChat]);

  // Persistir chat del día en localStorage + Supabase (debounce 2s)
  const chatSaveTimer = useRef(null);
  useEffect(() => {
    if (!email || mensajesChat.length === 0) return;
    const completos = mensajesChat.filter(m => !m.cargando && m.texto);
    if (completos.length === 0) return;
    const hoy = new Date().toISOString().split('T')[0];
    try { localStorage.setItem(`chat_${email}_${hoy}`, JSON.stringify(completos)); } catch {}
    if (chatSaveTimer.current) clearTimeout(chatSaveTimer.current);
    chatSaveTimer.current = setTimeout(() => {
      guardarDailyState(email, { chat_mensajes: completos }).catch(console.error);
    }, 2000);
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
        // Restaurar planDiario del día
        const planDiarioGuardado = localStorage.getItem(`planDiario_${email}_${hoy}`);
        if (planDiarioGuardado) {
          try { setPlanDiario(JSON.parse(planDiarioGuardado)); } catch {}
        }

        // Inicializar completedTasksHoy desde localStorage para que KcalTracker arranque correcto
        try {
          const checksGuardados = localStorage.getItem(`checks_${email}_${hoy}`);
          if (checksGuardados) setCompletedTasksHoy(JSON.parse(checksGuardados));
        } catch {}
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

      // ── FUENTE DE VERDAD: Supabase siempre sobreescribe localStorage ──
      // Plan semanal
      try {
        const planDB = await cargarPlanDB(email, objId);
        if (planDB) {
          setPlanSemanal(planDB);
          actualizarPlanDia(planDB);
          try { localStorage.setItem(`plan_${email}_${objId}`, JSON.stringify({ plan: planDB, fecha: Date.now() })); } catch {}
        } else {
          // Fallback localStorage solo si Supabase no tiene plan
          const g = localStorage.getItem(`plan_${email}_${objId}`);
          if (g) { const { plan, fecha } = JSON.parse(g); if ((Date.now() - fecha) / 86400000 < 7) { setPlanSemanal(plan); actualizarPlanDia(plan); } }
        }
      } catch {}

      // daily_state: Supabase sobreescribe localStorage incondicionalmente
      try {
        const ds = await cargarDailyState(email);
        if (ds) {
          const hoy = new Date().toISOString().split('T')[0];
          if (ds.protocolos?.length) {
            setProtocolos(ds.protocolos);
            try { localStorage.setItem(`protocolos_${email}_${hoy}`, JSON.stringify(ds.protocolos)); } catch {}
          }
          if (ds.reporte?.analisis) {
            setReporteBanana(ds.reporte);
            try { localStorage.setItem(`reporte_${email}_${hoy}`, JSON.stringify(ds.reporte)); } catch {}
          }
          if (ds.chat_mensajes?.length) {
            setMensajesChat(ds.chat_mensajes);
            try { localStorage.setItem(`chat_${email}_${hoy}`, JSON.stringify(ds.chat_mensajes)); } catch {}
          }
          if (ds.proactivo_ok) setMensajeProactivoGenerado(true);
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

  // ── Fix 2: Flush inmediato al cerrar/minimizar ──────────────────
  const pendingChatRef = useRef(null);
  useEffect(() => {
    if (!email) return;
    const flush = () => {
      if (pendingChatRef.current) {
        const { emailRef, msgs } = pendingChatRef.current;
        // navigator.sendBeacon para garantizar envío aunque se cierre la pestaña
        const body = JSON.stringify({ email: emailRef, campos: { chat_mensajes: msgs } });
        navigator.sendBeacon
          ? navigator.sendBeacon('/api/flush-daily-state', body)
          : guardarDailyState(emailRef, { chat_mensajes: msgs }).catch(() => {});
        pendingChatRef.current = null;
      }
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [email]);

  // Actualizar pendingChatRef cuando cambie el chat
  useEffect(() => {
    if (!email || mensajesChat.length === 0) return;
    const completos = mensajesChat.filter(m => !m.cargando && m.texto);
    if (completos.length > 0) pendingChatRef.current = { emailRef: email, msgs: completos };
  }, [mensajesChat, email]);

  // ── Fix 3: Refetch silencioso al volver a la pestaña ─────────────
  useEffect(() => {
    if (!email || !datos) return;
    const refetch = async () => {
      try {
        const [ds, planDB] = await Promise.all([
          cargarDailyState(email),
          cargarPlanDB(email, objetivoId),
        ]);
        if (planDB) { setPlanSemanal(planDB); actualizarPlanDia(planDB); }
        if (ds) {
          if (ds.protocolos?.length) setProtocolos(ds.protocolos);
          if (ds.reporte?.analisis)  setReporteBanana(ds.reporte);
          if (ds.chat_mensajes?.length) setMensajesChat(ds.chat_mensajes);
        }
      } catch {}
    };
    const onFocus = () => refetch();
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [email, datos, objetivoId]);

  // Proactivo: cuando tenemos check-in + plan
  useEffect(() => {
    if (!checkinTexto || !planDia || mensajeProactivoGenerado || !ultimo) return;
    setMensajeProactivoGenerado(true);
    guardarDailyState(email, { proactivo_ok: true }).catch(console.error);
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

      // ── INYECTAR_TARJETAS — Banana construye el timeline ─────────
      if (cmd.accion === 'INYECTAR_TARJETAS' && Array.isArray(cmd.tarjetas) && cmd.tarjetas.length > 0) {
        const tarjetasNuevas = cmd.tarjetas.map((t, i) => ({
          ...t,
          id: `banana_${Date.now()}_${i}`,
          estado: t.estado || 'pendiente',
          animating: true,  // flag para CSS de entrada
        }));
        setPlanDiario(prev => {
          // Merge: mantener completadas, añadir/reemplazar pendientes
          const completadas = prev.filter(t => t.estado === 'completado');
          const merged = [...completadas, ...tarjetasNuevas];
          // Persistir en localStorage
          try {
            const hoy = new Date().toISOString().split('T')[0];
            localStorage.setItem(`planDiario_${email}_${hoy}`, JSON.stringify(merged));
          } catch {}
          return merged;
        });
        // Quitar flag animating tras la animación
        setTimeout(() => {
          setPlanDiario(prev => prev.map(t => ({ ...t, animating: false })));
        }, 600);
      }

      // ── RESET_ESTRATEGIA — regenerar plan semanal ────────────────
      if (cmd.accion === 'RESET_ESTRATEGIA') {
        setPlanSemanal(null);
        setMostrarConfig(true);
      }

      // ── MODIFICAR_SEMANA — adaptar ejercicios días restantes ──────
      if (cmd.accion === 'MODIFICAR_SEMANA' && Array.isArray(cmd.cambios_ejercicios)) {
        const diaHoyIdx = getDiaHoyIdx();
        setPlanSemanal(prev => {
          if (!prev?.ejercicios) return prev;
          const nuevo = JSON.parse(JSON.stringify(prev));
          for (const cambio of cmd.cambios_ejercicios) {
            // Solo días desde hoy en adelante
            if (cambio.dia_idx >= diaHoyIdx && nuevo.ejercicios[cambio.dia_idx]) {
              nuevo.ejercicios[cambio.dia_idx] = {
                ...nuevo.ejercicios[cambio.dia_idx],
                tipo: cambio.tipo,
                ejercicios: cambio.ejercicios || [cambio.tipo],
                kcal_quemadas: cambio.kcal_quemadas ?? nuevo.ejercicios[cambio.dia_idx].kcal_quemadas,
                _modificado_banana: cmd.motivo || true,
              };
            }
          }
          // Persistir en BD y localStorage
          guardarPlanDB(email, objetivoId, nuevo).catch(console.error);
          try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: nuevo, fecha: Date.now() })); } catch {}
          return nuevo;
        });
        // Actualizar planDia si el día actual fue modificado
        setPlanSemanal(prev => { if (prev) actualizarPlanDia(prev); return prev; });
      }

      // ── ACTUALIZAR_PROTOCOLOS — localStorage + Supabase ──────────
      if (cmd.accion === 'ACTUALIZAR_PROTOCOLOS' && Array.isArray(cmd.nuevos_protocolos)) {
        setProtocolos(cmd.nuevos_protocolos);
        const hoyP = new Date().toISOString().split('T')[0];
        try { localStorage.setItem(`protocolos_${email}_${hoyP}`, JSON.stringify(cmd.nuevos_protocolos)); } catch {}
        guardarDailyState(email, { protocolos: cmd.nuevos_protocolos }).catch(console.error);
      }

      // ── GENERAR_REPORTE — localStorage + Supabase ────────────────
      if (cmd.accion === 'GENERAR_REPORTE' && cmd.analisis) {
        const reporte = {
          analisis: cmd.analisis,
          adherencia: Array.isArray(cmd.adherencia) ? cmd.adherencia : ['gris','gris','gris','gris','gris','gris','gris'],
        };
        setReporteBanana(reporte);
        const hoyR = new Date().toISOString().split('T')[0];
        try { localStorage.setItem(`reporte_${email}_${hoyR}`, JSON.stringify(reporte)); } catch {}
        guardarDailyState(email, { reporte }).catch(console.error);
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
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setMensajesNoLeidos(prev => prev + 1);
        }
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

  // ── Helpers de render compartidos ────────────────────────────────
  const renderSidebar = () => (
    <>
      {/* ICM compacto */}
      <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>ICM · Calidad Metabólica</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{icmLabel(ultimo.icm_total)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: C.white, lineHeight: 1 }}>{ultimo.icm_total}<span style={{ fontSize: 11, opacity: 0.5 }}>/100</span></div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Edad metab. <strong style={{ color: C.white }}>{ultimo.edad_metabolica}</strong></div>
          </div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${ultimo.icm_total}%`, background: C.white, borderRadius: 100 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3 }}>
          {[{ icon: '⚡', val: ultimo.efh_score }, { icon: '🏋️', val: ultimo.eco_score }, { icon: '🥗', val: ultimo.nut_score }, { icon: '🧠', val: ultimo.vit_score }, { icon: '😴', val: ultimo.des_score }].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 2px', textAlign: 'center' }}>
              <div style={{ fontSize: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: C.white, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-in */}
      <MicroCheckIn email={email} onCheckinChange={setCheckinTexto} onBananaReactivo={handleCheckinReactivo} />

      {/* Protocolos */}
      {protocolos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {protocolos.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(24,119,143,0.2)', border: '1px solid rgba(24,119,143,0.35)', color: '#7DD3E0', borderRadius: 100, padding: '4px 10px', fontSize: 10, fontWeight: 600 }}>{p}</span>
          ))}
        </div>
      )}

      {/* Racha */}
      {streak > 0 && (
        <div style={{ background: streak >= 7 ? C.accent : '#2D3E50', borderRadius: 12, padding: '9px 12px', border: `1px solid rgba(255,255,255,0.08)`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{streak >= 7 ? '🔥' : '⚡'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif' }}>{streak} días de racha</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>{streak >= 7 ? '¡Racha semanal activa!' : `${7 - streak} para la semanal`}</div>
          </div>
        </div>
      )}

      {/* ── Bloques metabólicos detalle ── */}
      <div style={{ background: '#263447', borderRadius: 14, padding: '12px 14px', border: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>📊 Tus 5 bloques</div>
        {[
          { icon: '⚡', label: 'Actividad física',     val: ultimo.efh_score, peso: '20%' },
          { icon: '🏋️', label: 'Composición corporal', val: ultimo.eco_score, peso: '35%' },
          { icon: '🥗', label: 'Nutrición',            val: ultimo.nut_score, peso: '25%' },
          { icon: '😴', label: 'Descanso',             val: ultimo.des_score, peso: '15%' },
          { icon: '🧠', label: 'Vitalidad',            val: ultimo.vit_score, peso: '5%'  },
        ].map((s, i) => {
          const col = s.val >= 80 ? '#22C55E' : s.val >= 65 ? C.accent : s.val >= 50 ? '#F9A825' : C.orange;
          return (
            <div key={i} style={{ marginBottom: i < 4 ? 10 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, color: '#CBD5E1' }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#64748B' }}>{s.peso}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: 'Georgia, serif' }}>{s.val}</span>
                </div>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.val}%`, background: col, borderRadius: 100, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: '8px 10px', background: '#1E293B', borderRadius: 9, fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
          💡 ICM potencial: <strong style={{ color: C.accent }}>{Math.min(100, Math.round(ultimo.icm_total * 1.18))}/100</strong> mejorando tus 2 bloques más bajos
        </div>
      </div>

      {/* ── Edad metabólica vs real ── */}
      <div style={{ background: '#263447', borderRadius: 14, padding: '12px 14px', border: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>⏱️ Edad metabólica</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 8px' }}>
            <div style={{ fontSize: 9, color: '#64748B', marginBottom: 3 }}>Edad real</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
              {ultimo.edad_metabolica + Math.abs(ultimo.delta_anos || 0)}
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>→</div>
          <div style={{ flex: 1, textAlign: 'center', background: C.accent, borderRadius: 10, padding: '10px 8px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>Metabólica</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.white, lineHeight: 1 }}>{ultimo.edad_metabolica}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
              {ultimo.delta_anos <= 0 ? `${Math.abs(ultimo.delta_anos)} años mejor ↑` : `${ultimo.delta_anos} años peor ↓`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Próximo objetivo ── */}
      <div style={{ background: `linear-gradient(135deg,${C.orange}22,${C.orange}08)`, borderRadius: 14, padding: '12px 14px', border: `1px solid ${C.orange}33` }}>
        <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🎯 Objetivo activo</div>
        <div style={{ fontSize: 14, color: C.white, fontWeight: 700, marginBottom: 4 }}>
          {OBJETIVOS.find(o => o.id === objetivoId)?.emoji} {OBJETIVOS.find(o => o.id === objetivoId)?.nombre}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.6 }}>
          Bloque a mejorar: <strong style={{ color: C.orange }}>
            {[{ n: 'actividad', v: ultimo.efh_score }, { n: 'nutrición', v: ultimo.nut_score }, { n: 'descanso', v: ultimo.des_score }, { n: 'vitalidad', v: ultimo.vit_score }, { n: 'composición', v: ultimo.eco_score }].reduce((a, b) => a.v < b.v ? a : b).n}
          </strong>
        </div>
        <button onClick={() => setMostrarConfig(true)} style={{ marginTop: 10, background: 'none', border: `1px solid ${C.orange}55`, color: C.orange, padding: '5px 12px', borderRadius: 100, fontSize: 10, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
          Cambiar objetivo →
        </button>
      </div>
    </>
  );

  const renderChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <BananaChat
        mensajes={mensajesChat} input={inputChat} setInput={setInputChat}
        cargando={chatCargando} onEnviar={enviarMensaje}
        chatEndRef={chatEndRef} inline={true}
      />
      {/* Chips sugerencias */}
      <div style={{ padding: '6px 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1A2A3A', flexShrink: 0 }}>
        {[
          { emoji: '🍽️', texto: 'Muéstrame el plan de hoy completo' },
          { emoji: '🏋️', texto: 'Detalla el entreno de hoy' },
          { emoji: '🥦', texto: 'Construye mi día con lo que tengo en casa' },
          { emoji: '🦵', texto: 'Tengo una lesión, adapta la semana' },
          { emoji: '📊', texto: '¿Cómo voy esta semana?' },
          { emoji: '🍕', texto: 'Me he empachado con un delivery, ¿qué hago?' },
          { emoji: '🍷', texto: 'Bebí bastante anoche, adapta hoy' },
          { emoji: '😴', texto: 'Dormí muy poco, ajusta el plan' },
          { emoji: '✈️', texto: 'Estoy viajando, sin gimnasio ni cocina' },
        ].map((chip, i) => (
          <button key={i} onClick={() => enviarMensaje(chip.texto)} style={{ background: '#263447', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '5px 10px', borderRadius: 100, fontSize: 10, cursor: 'pointer', fontFamily: font }}>
            {chip.emoji} {chip.texto.split(' ').slice(0, 4).join(' ')}...
          </button>
        ))}
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {planSemanal && <KcalTracker planSemanal={planSemanal} completedTasks={completedTasksHoy} planDiario={planDiario} objetivoId={objetivoId} gastoExtra={gastoActividadExtra} ingestaExtra={ingestaExtraDia} />}
      <div style={{ padding: '12px' }}>
        <DailyTimeline
          planSemanal={planSemanal} setPlanSemanal={setPlanSemanal}
          planDiario={planDiario} setPlanDiario={setPlanDiario}
          email={email} objetivoId={objetivoId}
          onAbrirConfig={() => setMostrarConfig(true)}
          onTodoCompletado={() => setMensajesChat(prev => [...prev, { rol: 'bot', texto: '¡Día perfecto completado! 🎉', cargando: false }])}
          onGenerarPlan={generarPlan} cargandoPlan={cargandoPlan}
          objetivo={OBJETIVOS.find(o => o.id === objetivoId)}
          onChecksChange={checks => setCompletedTasksHoy(checks)}
          onGastoActividadChange={delta => setGastoActividadExtra(prev => prev + delta)}
          onIngestaExtra={delta => setIngestaExtraDia(prev => prev + delta)}
          presupuestoBase={presupuestoBase} onKcalConsumidas={() => {}}
          modoRescate={modoRescateActivo} protocolos={protocolos}
        />
        <button onClick={() => setMostrarSuperBoton(true)} style={{ background: `linear-gradient(135deg,#E65100,${C.orange})`, border: 'none', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', fontFamily: font, width: '100%', textAlign: 'left', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.white, marginBottom: 1 }}>🗓️ Tengo un evento — adaptar mi plan</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Boda, viaje, cena social o salté el plan</div>
            </div>
            <span style={{ fontSize: 18, color: C.white }}>→</span>
          </div>
        </button>
        <div style={{ background: '#1A2535', borderRadius: 14, padding: '12px 16px', marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: C.white }}>Seguimiento mensual</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>19,90€/mes · Cancela cuando quieras</div>
          </div>
          <a href="#" style={{ background: C.white, color: '#1A2535', padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Activar →</a>
        </div>
        <details style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.08)`, marginTop: 10 }}>
          <summary style={{ background: '#2D3E50', padding: '11px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: font, fontSize: 12, fontWeight: 600, color: '#F1F5F9', userSelect: 'none' }}>
            <span>📊 Reporte analítico</span>
            <span className="chevron" style={{ fontSize: 12, color: C.mid }}>▾</span>
          </summary>
          <div style={{ padding: '12px', background: '#1E293B', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#263447', borderRadius: 12, padding: 14, border: `1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🚀 Tu potencial de mejora</div>
              {[{ icon: '⚡', label: 'Actividad física', val: ultimo.efh_score, anos: 3 }, { icon: '🏋️', label: 'Composición corporal', val: ultimo.eco_score, anos: 4 }, { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score, anos: 2 }, { icon: '😴', label: 'Descanso', val: ultimo.des_score, anos: 3 }, { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score, anos: 2 }].sort((a, b) => a.val - b.val).map((s, i) => {
                const col = s.val >= 65 ? C.accent : s.val >= 50 ? '#F9A825' : C.orange;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{s.label}</span>
                        <span style={{ fontSize: 10, color: col, fontWeight: 700 }}>{s.val}/100</span>
                      </div>
                      <div style={{ height: 4, background: C.light, borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.val}%`, background: col, borderRadius: 100 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: col, fontWeight: 700, background: `${col}20`, border: `1px solid ${col}44`, padding: '2px 6px', borderRadius: 100, whiteSpace: 'nowrap' }}>-{s.anos}a</div>
                  </div>
                );
              })}
            </div>
            {datos.length > 1 && (
              <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Evolución del ICM</div>
                <svg viewBox="0 0 680 110" style={{ width: '100%', height: 90 }}>
                  <defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.white} stopOpacity="0.25" /><stop offset="100%" stopColor={C.white} stopOpacity="0" /></linearGradient></defs>
                  {areaD && <path d={areaD} fill="url(#aG)" />}
                  {pathD && <path d={pathD} fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                  {chartData?.map((p, i) => (<g key={i}><circle cx={p.x*6.8} cy={p.y*1.1} r="5" fill={i===chartData.length-1 ? C.orange : C.white} stroke={C.accent} strokeWidth="2" /><text x={p.x*6.8} y={p.y*1.1-10} textAnchor="middle" fontSize="10" fill={C.white} fontWeight="600">{p.icm}</text></g>))}
                </svg>
              </div>
            )}
            {/* Veredicto Banana */}
            <div style={{ background: '#263447', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentDk})`, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>🍌</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Veredicto semanal</span>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {['L','M','X','J','V','S','D'].map((dia, i) => {
                    const estado = reporteBanana.adherencia[i] || 'gris';
                    const cols = { verde: { bg: '#D1FAE5', border: '#34D399', text: '#065F46' }, naranja: { bg: '#FEF3C7', border: '#FBBF24', text: '#92400E' }, rojo: { bg: '#FEE2E2', border: '#F87171', text: '#991B1B' }, gris: { bg: '#F3F4F6', border: '#D1D5DB', text: '#9CA3AF' } };
                    const col = cols[estado] || cols.gris;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 5, background: col.bg, border: `1.5px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                          {estado === 'verde' && <span style={{ fontSize: 9 }}>✓</span>}
                          {estado === 'naranja' && <span style={{ fontSize: 9 }}>~</span>}
                          {estado === 'rojo' && <span style={{ fontSize: 9 }}>✕</span>}
                          {estado === 'gris' && <span style={{ fontSize: 7, color: col.text }}>·</span>}
                        </div>
                        <div style={{ fontSize: 7, color: col.text, fontWeight: 600 }}>{dia}</div>
                      </div>
                    );
                  })}
                </div>
                {reporteBanana.analisis ? (
                  <div style={{ background: '#1E293B', borderRadius: 8, padding: '9px 10px', display: 'flex', gap: 7 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>🍌</span>
                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', lineHeight: 1.6, fontStyle: 'italic' }}>{reporteBanana.analisis}</p>
                  </div>
                ) : (
                  <button onClick={() => enviarMensaje('¿Cómo voy esta semana? Dame tu veredicto.')} style={{ width: '100%', background: 'none', border: `1.5px dashed rgba(255,255,255,0.12)`, borderRadius: 8, padding: '9px', cursor: 'pointer', fontFamily: font, display: 'flex', gap: 7, alignItems: 'center', color: '#64748B', fontSize: 11 }}>
                    <span style={{ fontSize: 14 }}>🍌</span>
                    <span>Pedir veredicto semanal →</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: font }}>

      {mostrarConfig && (
        <ConfiguracionMetabolica ultimo={ultimo} email={email} gastoActividadExtra={gastoActividadExtra}
          onGuardar={cfg => { setObjetivoId(cfg.objetivoId); if (cfg.presupuestoBase) setPresupuestoBase(cfg.presupuestoBase); setPlanSemanal(null); setMostrarConfig(false); }}
          onCerrar={() => setMostrarConfig(false)} />
      )}
      {mostrarSemana && planSemanal && <WeeklyPlannerModal planSemanal={planSemanal} onCerrar={() => setMostrarSemana(false)} email={email} objetivoId={objetivoId} />}
      {mostrarSuperBoton && <SuperBotonEventos onCerrar={() => setMostrarSuperBoton(false)} onEnviar={activarEvento} />}

      {/* NAV */}
      <nav style={{ background: C.accent, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 900, fontSize: 17, color: C.white, flexShrink: 0 }}>🍌 <span style={{ color: 'rgba(255,255,255,0.9)' }}>my</span><span style={{ color: C.white }}>metaboliq</span></span>
        {datos && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="hide-mobile" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{nombreUsuario && `Hola, ${nombreUsuario} 👋`}</span>
            {planSemanal && (
              <button onClick={() => setMostrarSemana(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, padding: '6px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                <span className="hide-mobile">🛒 Semana</span>
                <span className="show-mobile">🛒</span>
              </button>
            )}
            <button onClick={() => setMostrarConfig(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.white, width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer' }}>⚙️</button>
            <button onClick={() => { setDatos(null); setEmail(''); setMensajesChat([]); setMensajeProactivoGenerado(false); setPlanSemanal(null); setStreak(0); setCheckinTexto(''); }} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>Salir</button>
          </div>
        )}
      </nav>

      {/* LOGIN */}
      {!datos && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🍌</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#F1F5F9', marginBottom: 8 }}>Tu dashboard <span style={{ color: C.accent, fontStyle: 'italic' }}>metabólico</span></h1>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8, lineHeight: 1.7 }}>Introduce el email con el que hiciste el test.</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>¿Primera vez? <a href="/onboarding" style={{ color: '#5BC4D8', fontWeight: 700, textDecoration: 'none' }}>Empieza aquí →</a></p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 360, margin: '0 auto' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarDatos()} placeholder="tu@email.com"
              style={{ flex: 1, padding: '12px 18px', border: `1.5px solid rgba(255,255,255,0.15)`, borderRadius: 100, fontSize: 16, background: '#263447', fontFamily: font, outline: 'none', color: '#F1F5F9' }} />
            <button onClick={buscarDatos} disabled={cargando} style={{ background: C.accent, color: C.white, border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>{cargando ? '...' : 'Ver →'}</button>
          </div>
          {error && <p style={{ color: C.orange, fontSize: 13, marginTop: 14 }}>{error}</p>}
        </div>
      )}

      {/* ── DESKTOP: 3 columnas ── */}
      {datos && ultimo && (
        <div className="dashboard-grid hide-mobile">
          {/* SIDEBAR: perfil + check-in */}
          <div className="col-sidebar hide-mobile">{renderSidebar()}</div>
          {/* CHAT: Banana protagonista */}
          <div className="col-chat hide-mobile">{renderChat()}</div>
          {/* TIMELINE: plan del día */}
          <div className="col-timeline hide-mobile">{renderTimeline()}</div>
        </div>
      )}

      {/* ── MÓVIL: tab bar ── */}
      {datos && ultimo && (
        <div className="mobile-layout">
          <div className="tab-content">
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 56px - 58px)', overflow: 'hidden' }}>
                {/* Header con botón volver */}
                <div style={{ background: C.accent, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setActiveTab('hoy')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
                  <span style={{ fontSize: 16 }}>🍌</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.white }}>Banana</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>Tu coach metabólico</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#86EFAC' }} />
                </div>
                {renderChat()}
              </div>
            )}
            {activeTab === 'hoy' && (
              <div style={{ padding: '12px 12px 0' }}>
                {planSemanal && <KcalTracker planSemanal={planSemanal} completedTasks={completedTasksHoy} planDiario={planDiario} objetivoId={objetivoId} gastoExtra={gastoActividadExtra} ingestaExtra={ingestaExtraDia} />}
                <DailyTimeline
                  planSemanal={planSemanal} setPlanSemanal={setPlanSemanal}
                  planDiario={planDiario} setPlanDiario={setPlanDiario}
                  email={email} objetivoId={objetivoId}
                  onAbrirConfig={() => setMostrarConfig(true)}
                  onTodoCompletado={() => setMensajesChat(prev => [...prev, { rol: 'bot', texto: '¡Día perfecto! 🎉', cargando: false }])}
                  onGenerarPlan={generarPlan} cargandoPlan={cargandoPlan}
                  objetivo={OBJETIVOS.find(o => o.id === objetivoId)}
                  onChecksChange={checks => setCompletedTasksHoy(checks)}
                  onGastoActividadChange={delta => setGastoActividadExtra(prev => prev + delta)}
                  onIngestaExtra={delta => setIngestaExtraDia(prev => prev + delta)}
                  presupuestoBase={presupuestoBase} onKcalConsumidas={() => {}}
                  modoRescate={modoRescateActivo} protocolos={protocolos}
                />
                <button onClick={() => setMostrarSuperBoton(true)} style={{ background: `linear-gradient(135deg,#E65100,${C.orange})`, border: 'none', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', fontFamily: font, width: '100%', textAlign: 'left', marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.white }}>🗓️ Adaptar plan al evento</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Boda, viaje, lesión...</div>
                    </div>
                    <span style={{ color: C.white, fontSize: 18 }}>→</span>
                  </div>
                </button>
              </div>
            )}
            {activeTab === 'perfil' && (
              <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {renderSidebar()}
                {/* Analítica en perfil móvil */}
                <div style={{ background: '#263447', borderRadius: 12, padding: 14, border: `1px solid rgba(255,255,255,0.08)`, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📊 Tu potencial</div>
                  {[{ icon: '⚡', label: 'Actividad física', val: ultimo.efh_score }, { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score }, { icon: '😴', label: 'Descanso', val: ultimo.des_score }].map((s, i) => {
                    const col = s.val >= 65 ? C.accent : s.val >= 50 ? '#F9A825' : C.orange;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: col, fontWeight: 700 }}>{s.val}/100</span>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.val}%`, background: col, borderRadius: 100 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: '#1A2535', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: C.white }}>Seguimiento mensual</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>19,90€/mes</div>
                  </div>
                  <a href="#" style={{ background: C.white, color: '#1A2535', padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Activar →</a>
                </div>
              </div>
            )}
          </div>

          {/* TAB BAR — 2 tabs + FAB Banana */}
          <nav className="tab-bar">
            {[
              { id: 'hoy',    icon: '📋', label: 'Hoy' },
              { id: 'perfil', icon: '👤', label: 'Perfil' },
            ].map(tab => (
              <button key={tab.id} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <span className="tab-icon" style={{ filter: activeTab === tab.id ? 'none' : 'grayscale(1) opacity(0.5)' }}>{tab.icon}</span>
                <span className="tab-label" style={{ color: activeTab === tab.id ? '#18778f' : '#64748B' }}>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* FAB Banana flotante con badge de notificación */}
          {activeTab !== 'chat' && (
            <button
              onClick={() => { setActiveTab('chat'); setMensajesNoLeidos(0); }}
              style={{
                position: 'fixed', bottom: 72, right: 18, zIndex: 200,
                width: 56, height: 56, borderRadius: '50%',
                background: mensajesNoLeidos > 0 ? C.orange : C.accent,
                border: 'none', boxShadow: `0 4px 20px ${mensajesNoLeidos > 0 ? 'rgba(232,98,26,0.5)' : 'rgba(24,119,143,0.5)'}`,
                cursor: 'pointer', fontSize: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                animation: mensajesNoLeidos > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            >
              🍌
              {mensajesNoLeidos > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#EF4444', color: '#fff',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #0F1A25',
                }}>
                  {mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos}
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}