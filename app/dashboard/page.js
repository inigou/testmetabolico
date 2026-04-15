'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DailyTimeline from './DailyTimeline';
import ConfiguracionMetabolica from './ConfiguracionMetabolica';
import DailyCheckIn from './DailyCheckIn';
import WeeklyPlannerModal from './WeeklyPlannerModal';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function cargarPlanDB(email, objId) {
  try {
    // Le pedimos que lo ordene por fecha para asegurarnos de coger siempre la versión más reciente
    const res = await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}&order=updated_at.desc&limit=1&select=plan_json`, { headers: sbH });
    const rows = await res.json();
    return rows?.[0]?.plan_json || null;
  } catch (e) { return null; }
}

async function guardarPlanDB(email, objId, plan) {
  try {
    // 1. Preguntamos si ya hay un plan guardado para ti
    const checkRes = await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}&select=email`, { headers: sbH });
    const rows = await checkRes.json();

    if (rows && rows.length > 0) {
      // 2A. Si existe, machacamos el antiguo con el nuevo (PATCH)
      await fetch(`${SB_URL}/rest/v1/user_plans?email=eq.${encodeURIComponent(email)}&objetivo_id=eq.${encodeURIComponent(objId)}`, {
        method: 'PATCH', headers: sbH,
        body: JSON.stringify({ plan_json: plan, updated_at: new Date().toISOString() }),
      });
    } else {
      // 2B. Si no existe, lo creamos (POST)
      await fetch(`${SB_URL}/rest/v1/user_plans`, {
        method: 'POST', headers: sbH,
        body: JSON.stringify({ email, objetivo_id: objId, plan_json: plan, updated_at: new Date().toISOString() }),
      });
    }
  } catch (e) { console.error('Error guardando plan en BD:', e); }
}

async function cargarLogsRecientes(email, dias = 35) {
  try {
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    const res = await fetch(`${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=gte.${desde.toISOString().split('T')[0]}&order=fecha.asc&select=fecha,energia,sueno,estres`, { headers: sbH });
    return await res.json();
  } catch (e) { return []; }
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

// ── ChatPanel ────────────────────────────────────────────────────────
function ChatPanel({ mensajesChat, inputChat, setInputChat, chatCargando, enviarMensaje, onCerrar, chatEndRef }) {
  const font = 'Trebuchet MS, Verdana, sans-serif';
  const Cc = { green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF', dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', bg: '#F7F4EE' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: Cc.green, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: Cc.white }}>Coach metabólico</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Powered by Claude AI</div>
          </div>
        </div>
        <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: Cc.white, width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FAFAF8' }}>
        {mensajesChat.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: Cc.mid, fontSize: 13 }}>Completa el check-in para activar tu coach</div>}
        {mensajesChat.map((m, i) => (
          <div key={i}>
            {m.rol === 'usuario' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: Cc.orange, color: Cc.white, fontSize: 13, lineHeight: 1.6 }}>{m.texto}</div>
              </div>
            )}
            {m.rol === 'bot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ maxWidth: '90%', background: m.esEvento ? '#FFF8EC' : Cc.white, border: `1px solid ${m.esEvento ? '#F9CFA8' : Cc.light}`, borderRadius: 14, padding: '12px 14px' }}>
                  {m.esProactivo && <div style={{ fontSize: 9, color: Cc.green, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🤖 Mensaje de hoy</div>}
                  {m.esEvento && <div style={{ fontSize: 9, color: '#E8A020', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠️ Plan adaptado</div>}
                  {m.cargando
                    ? <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>{[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: Cc.green, opacity: 0.6, animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}</div>
                    : <div style={{ fontSize: 13, color: Cc.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  }
                </div>
                {m.esProactivo && m.chips?.length > 0 && !m.cargando && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 2 }}>
                    {m.chips.map((chip, ci) => (
                      <button key={ci} onClick={() => enviarMensaje(chip)} style={{ background: Cc.white, border: `1.5px solid ${Cc.green}`, color: Cc.green, padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>{chip}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ padding: '10px 12px', background: Cc.white, borderTop: `1px solid ${Cc.light}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={inputChat} onChange={e => setInputChat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !chatCargando && inputChat.trim() && enviarMensaje()}
          placeholder="Pregunta lo que quieras..."
          style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${Cc.light}`, borderRadius: 100, fontSize: 13, fontFamily: font, outline: 'none', color: Cc.dark, background: Cc.bg }} />
        <button onClick={() => !chatCargando && inputChat.trim() && enviarMensaje()} disabled={chatCargando}
          style={{ background: chatCargando ? Cc.light : Cc.orange, color: Cc.white, border: 'none', padding: '10px 16px', borderRadius: 100, fontSize: 13, cursor: chatCargando ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, flexShrink: 0 }}>
          {chatCargando ? '...' : '→'}
        </button>
      </div>
    </div>
  );
}

// ── Súper-Botón de Eventos ───────────────────────────────────────────
function SuperBotonEventos({ onCerrar, onEnviar }) {
  const font = 'Trebuchet MS, Verdana, sans-serif';
  const C = { bg: '#F7F4EE', orange: '#E8621A', white: '#FFFFFF', dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', orangePale: '#FDF0E8', green: '#5B9B3C' };
  const [seleccion, setSeleccion] = useState('');
  const [detalle, setDetalle]     = useState('');
  const [diaEvento, setDiaEvento] = useState(5);
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
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
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 680, borderRadius: '20px 20px 0 0', background: C.white, overflow: 'hidden', animation: 'slideUp 0.3s ease', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg,#E65100,#E8621A,#F57C00)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.white, marginBottom: 4 }}>🗓️ Adaptar plan al evento</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>¿Tienes un evento o te has saltado el plan?<br /><strong style={{ color: C.white }}>Lo adaptamos juntos y actualizamos tu semana.</strong></div>
            </div>
            <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, width: 34, height: 34, borderRadius: '50%', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
            ✅ Tu racha no se interrumpe · La IA reescribirá los días afectados en tu plan
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>¿Qué día es el evento?</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIAS.map((dia, i) => (
                <button key={i} onClick={() => setDiaEvento(i)} style={{ padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: diaEvento === i ? 700 : 400, cursor: 'pointer', fontFamily: font, background: diaEvento === i ? C.orange : C.bg, color: diaEvento === i ? C.white : C.mid, border: `1.5px solid ${diaEvento === i ? C.orange : C.light}` }}>{dia}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>¿Qué ha pasado o va a pasar?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EVENTOS.map(ev => (
                <button key={ev.id} onClick={() => setSeleccion(ev.id)} style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: font, background: seleccion === ev.id ? C.orangePale : C.bg, border: `2px solid ${seleccion === ev.id ? C.orange : C.light}`, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ev.emoji}</span>
                  <span style={{ fontSize: 11, color: C.dark, fontWeight: seleccion === ev.id ? 700 : 400, lineHeight: 1.4 }}>{ev.label}</span>
                </button>
              ))}
            </div>
          </div>
          {eventoSel && (
            <div style={{ background: C.orangePale, border: '1px solid #F9CFA8', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Estrategia de la IA</div>
              <div style={{ fontSize: 12, color: '#C05010', fontWeight: 600 }}>{eventoSel.protocolo}</div>
            </div>
          )}
          <textarea value={detalle} onChange={e => setDetalle(e.target.value)}
            placeholder="Cuéntanos más (opcional)..."
            style={{ width: '100%', height: 72, padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 12, fontSize: 12, fontFamily: font, resize: 'none', outline: 'none', background: C.bg, color: C.dark, boxSizing: 'border-box', marginBottom: 6 }} />
        </div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.light}`, background: C.white, flexShrink: 0 }}>
          <button onClick={() => seleccion && onEnviar(eventoSel, detalle, diaEvento)} disabled={!seleccion}
            style={{ width: '100%', background: seleccion ? 'linear-gradient(135deg,#E65100,#E8621A)' : C.light, color: C.white, border: 'none', padding: '15px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: seleccion ? 'pointer' : 'not-allowed', fontFamily: font, boxShadow: seleccion ? '0 4px 20px rgba(230,81,0,0.35)' : 'none' }}>
            {seleccion ? `Adaptar mi plan — ${DIAS[diaEvento]} →` : 'Selecciona un evento para continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Constantes ───────────────────────────────────────────────────────
const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';
const OBJETIVOS = [
  { id: 'slow_aging', emoji: '🌿', nombre: 'Slow aging' },
  { id: 'mantener', emoji: '⚖️', nombre: 'Mantener peso' },
  { id: 'definicion_suave', emoji: '🔥', nombre: 'Definición suave' },
  { id: 'definicion_agresiva', emoji: '💪', nombre: 'Definición agresiva' },
  { id: 'hipertrofia', emoji: '🏋️', nombre: 'Hipertrofia moderada' },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva' },
  { id: 'perdida_rapida', emoji: '⚡', nombre: 'Pérdida rápida' },
];
const getDiaHoy    = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const icmColor     = (v) => { if (v >= 80) return '#2E7D32'; if (v >= 65) return '#5B9B3C'; if (v >= 50) return '#F9A825'; if (v >= 35) return '#E8621A'; return '#C62828'; };
const icmLabel     = (v) => { if (v >= 80) return 'Metabolismo óptimo'; if (v >= 65) return 'Metabolismo activo'; if (v >= 50) return 'Metabolismo moderado'; if (v >= 35) return 'Metabolismo lento'; return 'Metabolismo crítico'; };
const scoreColor   = (v) => { if (v >= 80) return '#2E7D32'; if (v >= 65) return '#5B9B3C'; if (v >= 50) return '#F9A825'; if (v >= 35) return '#E8621A'; return '#C62828'; };
const scoreBg      = (v) => { if (v >= 80) return '#E8F5E9'; if (v >= 65) return '#EBF5E4'; if (v >= 50) return '#FFFDE7'; if (v >= 35) return '#FDF0E8'; return '#FFEBEE'; };
const icmBarColor  = (v) => { if (v >= 80) return 'linear-gradient(90deg,#2E7D32,#5B9B3C)'; if (v >= 65) return 'linear-gradient(90deg,#5B9B3C,#7AB648)'; if (v >= 50) return 'linear-gradient(90deg,#F9A825,#FBC02D)'; if (v >= 35) return 'linear-gradient(90deg,#E8621A,#F57C00)'; return 'linear-gradient(90deg,#C62828,#E53935)'; };

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [datos, setDatos]               = useState(null);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState(null);
  const [mostrarConfig, setMostrarConfig]   = useState(false);
  const [objetivoId, setObjetivoId]     = useState('mantener');
  const [weather, setWeather]           = useState(null);
  const [planSemanal, setPlanSemanal]   = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const [planDia, setPlanDia]           = useState(null);
  const [mostrarSemana, setMostrarSemana] = useState(false);
  const [streak, setStreak]             = useState(0);
  const [completedTasksHoy, setCompletedTasksHoy] = useState({});
  const [gastoActividadExtra, setGastoActividadExtra] = useState(0);
  const [mostrarSuperBoton, setMostrarSuperBoton]     = useState(false);
  const [kcalConsumidas, setKcalConsumidas]           = useState(0);
  const [modoRescateActivo, setModoRescateActivo]     = useState(false);
  const [presupuestoBase, setPresupuestoBase]         = useState(0);
  const [nombreUsuario, setNombreUsuario]             = useState('');

  const [mensajesChat, setMensajesChat]               = useState([]);
  const [inputChat, setInputChat]                     = useState('');
  const [chatCargando, setChatCargando]               = useState(false);
  const [chatAbierto, setChatAbierto]                 = useState(false);
  const [mensajeProactivoGenerado, setMensajeProactivoGenerado] = useState(false);
  const chatEndRef = useRef(null);

  const ultimo = datos?.[datos.length - 1];

  useEffect(() => {
    if (!chatEndRef.current || mensajesChat.length === 0) return;
    const m = mensajesChat[mensajesChat.length - 1];
    if (!m?.cargando) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesChat]);

  // ── Carga inicial tras datos ─────────────────────────────────────
  useEffect(() => {
    if (!datos || !email) return;
    const init = async () => {
      let objId = 'mantener';
      try {
        const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
        if (cfg.objetivoId)      { setObjetivoId(cfg.objetivoId); objId = cfg.objetivoId; }
        if (cfg.presupuestoBase) setPresupuestoBase(cfg.presupuestoBase);
        if (cfg.nombre)          setNombreUsuario(cfg.nombre);
        const hoy = new Date().toISOString().split('T')[0];
        const checkin = JSON.parse(localStorage.getItem(`checkin_${email}_${hoy}`) || '{}');
        if (checkin.weather) setWeather(checkin.weather);
      } catch (e) { console.error(e); }

      // ── Check onboarding ────────────────────────────────────────
      try {
        const uRes = await fetch(
          `${SB_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=onboarding_completed,nombre&limit=1`,
          { headers: sbH }
        );
        const uRows = await uRes.json();
        if (uRows?.[0]) {
          if (!uRows[0].onboarding_completed) {
            router.push('/onboarding');
            return;
          }
          if (uRows[0].nombre) setNombreUsuario(uRows[0].nombre);
        }
        // Si el usuario no existe en tabla usuarios → mandarlo a onboarding
        if (!uRows?.length) {
          router.push('/onboarding');
          return;
        }
      } catch (e) { console.error('check onboarding error:', e); }

      try {
        const planDB = await cargarPlanDB(email, objId);
        if (planDB) {
          setPlanSemanal(planDB); actualizarPlanDia(planDB);
          try { localStorage.setItem(`plan_${email}_${objId}`, JSON.stringify({ plan: planDB, fecha: Date.now() })); } catch (e) {}
        } else {
          const g = localStorage.getItem(`plan_${email}_${objId}`);
          if (g) {
            const { plan, fecha } = JSON.parse(g);
            if (Math.floor((Date.now() - fecha) / 86400000) < 7) { setPlanSemanal(plan); actualizarPlanDia(plan); }
          }
        }
      } catch (e) { console.error(e); }
      try { const logs = await cargarLogsRecientes(email, 35); setStreak(calcularRacha(logs)); } catch (e) {}
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

  useEffect(() => {
    if (!weather || !planDia || mensajeProactivoGenerado || !ultimo) return;
    setMensajeProactivoGenerado(true);
    generarMensajeProactivo();
  }, [weather, planDia]);

  const generarMensajeProactivo = async () => {
    if (!ultimo) return;
    setChatCargando(true);
    setMensajesChat([{ rol: 'bot', texto: '', cargando: true, esProactivo: true }]);
    const scores = [{ nombre: 'actividad física', val: ultimo.efh_score }, { nombre: 'composición corporal', val: ultimo.eco_score }, { nombre: 'nutrición', val: ultimo.nut_score }, { nombre: 'descanso', val: ultimo.des_score }, { nombre: 'vitalidad', val: ultimo.vit_score }];
    const peor  = scores.reduce((a, b) => a.val < b.val ? a : b);
    const comidaHoy  = planDia?.comidas ? `Comida: ${planDia.comidas.comida}. Cena: ${planDia.comidas.cena}.` : '';
    const entrenoHoy = planDia?.entrenamiento ? `${planDia.entrenamiento.tipo}: ${planDia.entrenamiento.ejercicios?.join(', ')}` : 'Día de descanso';
    try {
      const res = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          pregunta: `Genera un mensaje de bienvenida${nombreUsuario ? ` para ${nombreUsuario}` : ''} (máximo 3 frases + 1 pregunta táctica). Estado: "${weather?.estado}". Plan: ${comidaHoy} Entreno: ${entrenoHoy}. Bloque débil: ${peor.nombre}.`,
          perfil: { icm: ultimo.icm_total, categoria: ultimo.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado', edad_metabolica: ultimo.edad_metabolica, mejor_bloque: scores.reduce((a, b) => a.val > b.val ? a : b).nombre, peor_bloque: peor.nombre, eco: ultimo.eco_score, efh: ultimo.efh_score, nut: ultimo.nut_score, des: ultimo.des_score, vit: ultimo.vit_score },
          contexto_dia: { weather: weather?.estado, comidas: planDia?.comidas, entrenamiento: planDia?.entrenamiento },
        }),
      });
      const data = await res.json();
      const chips = [];
      if (planDia?.entrenamiento) chips.push('Adapta el entreno de hoy');
      if (planDia?.comidas?.comida) chips.push('Receta rápida para la comida');
      chips.push('Cómo optimizo el descanso');
      setMensajesChat([{ rol: 'bot', texto: data.respuesta || '', cargando: false, esProactivo: true, chips: chips.slice(0, 3) }]);
    } catch (e) {
      setMensajesChat([{ rol: 'bot', texto: `${weather?.estado} — ${weather?.consejo}`, cargando: false, esProactivo: true, chips: [] }]);
    }
    setChatCargando(false);
  };

  const activarEvento = async (evento, detalle, diaEvento) => {
    setMostrarSuperBoton(false);
    setChatAbierto(true);
    setChatCargando(true);
    setMensajesChat(prev => [...prev, { rol: 'bot', texto: '', cargando: true, esEvento: true }]);
    try {
      const res = await fetch('/api/rewrite-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, objetivo_id: objetivoId, plan_actual: planSemanal, evento: `${evento.label}${detalle ? ': ' + detalle : ''}`, dia_evento: diaEvento, perfil: { icm: ultimo?.icm_total, objetivo: OBJETIVOS.find(o => o.id === objetivoId)?.nombre } }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlanSemanal(data.plan);
        try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: data.plan, fecha: Date.now() })); } catch (e) {}
        actualizarPlanDia(data.plan);
        setModoRescateActivo(true);
        setTimeout(() => setModoRescateActivo(false), 24 * 60 * 60 * 1000);
        const diasTexto = data.dias_modificados?.join(' y ') || 'los días afectados';
        const msgCoach = data.mensaje_coach ? `${data.mensaje_coach}\n\n✅ He actualizado tu plan para ${diasTexto}.` : `✅ Plan adaptado. He reescrito ${diasTexto}. Tu racha sigue intacta.`;
        setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: msgCoach, cargando: false, esEvento: true } : m));
      } else throw new Error('Sin plan');
    } catch (e) {
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
      if (cfg.excluidos?.length)        prefTexto += `ALIMENTOS PROHIBIDOS: ${cfg.excluidos.join(', ')}. `;
      if (cfg.tipoDieta === 'vegetariano') prefTexto += 'SIN carne. ';
      if (cfg.tipoDieta === 'vegano')    prefTexto += 'SIN productos animales. ';
      if (cfg.nivelCocina === 'rapido')  prefTexto += 'Recetas menos de 20min. ';
      if (cfg.horarioEntreno)            prefTexto += `Horario entreno: ${cfg.horarioEntreno}. `;
    } catch (e) { console.error(e); }
    const obj = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[1];
    
    try {
      const res = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'plan', perfil: { objetivo: obj.nombre, icm: ultimo.icm_total, categoria: ultimo.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado', edad_metabolica: ultimo.edad_metabolica, mejor_bloque: mejor.nombre, peor_bloque: peor.nombre, eco: ultimo.eco_score, efh: ultimo.efh_score, nut: ultimo.nut_score, des: ultimo.des_score, vit: ultimo.vit_score, preferencias: prefTexto } }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        const txt = await res.text();
        console.error('generarPlan error:', res.status, txt.slice(0, 200));
        setCargandoPlan(false); return;
      }
      const data = await res.json();
      
      if (data.plan) {
        // 🛡️ CIRUGÍA DEL HISTORIAL: Fusión de pasado (antiguo) y futuro (nuevo)
        const diaHoyIndex = getDiaHoy(); // Lunes: 0, Martes: 1, Miércoles: 2...
        let planFinal = data.plan;

        if (planSemanal && planSemanal.dieta) {
          planFinal = {
            ...data.plan, // Conservamos directrices y lista de compra nueva
            dieta: data.plan.dieta.map((diaNuevo, i) => 
              i < diaHoyIndex ? planSemanal.dieta[i] : diaNuevo
            ),
            ejercicios: data.plan.ejercicios.map((ejNuevo, i) => 
              (i < diaHoyIndex && planSemanal.ejercicios) ? planSemanal.ejercicios[i] : ejNuevo
            )
          };
        }

        setPlanSemanal(planFinal);
        await guardarPlanDB(email, objetivoId, planFinal);
        try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: planFinal, fecha: Date.now() })); } catch (e) {}
        actualizarPlanDia(planFinal);
      }
    } catch (e) { console.error(e); }
    setCargandoPlan(false);
  };
  
  const enviarMensaje = async (texto) => {
    const q = texto || inputChat;
    if (!q.trim() || chatCargando) return;
    setInputChat(''); setChatCargando(true);
    const historialLimpio = mensajesChat.filter(m => !m.cargando && m.texto).map(m => ({ rol: m.rol, texto: m.texto }));
    setMensajesChat(prev => [...prev, { rol: 'usuario', texto: q }, { rol: 'bot', texto: '', cargando: true }]);
    const scores = [{ nombre: 'actividad física', val: ultimo?.efh_score }, { nombre: 'nutrición', val: ultimo?.nut_score }, { nombre: 'descanso', val: ultimo?.des_score }];
    const peor = scores.reduce((a, b) => (a.val || 0) < (b.val || 0) ? a : b);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pregunta: q, historial: historialLimpio, contexto_dia: { weather: weather?.estado, comidas: planDia?.comidas, entrenamiento: planDia?.entrenamiento }, perfil: { icm: ultimo?.icm_total, categoria: ultimo?.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado', edad_metabolica: ultimo?.edad_metabolica, mejor_bloque: 'actividad física', peor_bloque: peor.nombre, eco: ultimo?.eco_score, efh: ultimo?.efh_score, nut: ultimo?.nut_score, des: ultimo?.des_score, vit: ultimo?.vit_score } }),
      });
      const data = await res.json();
      setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: data.respuesta || '', cargando: false } : m));
    } catch { setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: 'Error al conectar.', cargando: false } : m)); }
    setChatCargando(false);
  };

  const handleTodoCompletado = () => {
    setMensajesChat(prev => [...prev, { rol: 'bot', texto: '¡Día perfecto completado! 🎉 Tu metabolismo te lo agradecerá mañana.', cargando: false }]);
    setChatAbierto(true);
  };

  const formatFecha = (f) => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const chartData = datos?.map((t, i) => ({ x: datos.length === 1 ? 50 : (i / (datos.length - 1)) * 80 + 10, y: 90 - ((t.icm_total / 100) * 70), icm: t.icm_total, fecha: formatFecha(t.fecha) }));
  const pathD = chartData?.length > 1 ? chartData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 6.8} ${p.y * 1.1}`).join(' ') : null;
  const areaD = pathD ? `${pathD} L ${chartData[chartData.length - 1].x * 6.8} 110 L ${chartData[0].x * 6.8} 110 Z` : null;

  const buscarDatos = async (emailParam) => {
    const em = emailParam || email;
    if (!em?.trim()) return;
    setCargando(true); setError(null);
    try {
      const res = await fetch(`${SB_URL}/rest/v1/tests?email=eq.${encodeURIComponent(em)}&order=fecha.asc`, { headers: sbH });
      const tests = await res.json();
      if (tests.length === 0) setError('No encontramos ningún test con ese email.');
      else { setDatos(tests); }
    } catch { setError('Error al conectar.'); }
    finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes pop{0%{transform:scale(0.8)}50%{transform:scale(1.15)}100%{transform:scale(1)}} @keyframes borderPulse{0%,100%{box-shadow:0 0 0 0 rgba(230,81,0,0.4)}50%{box-shadow:0 0 0 8px rgba(230,81,0,0)}} details>summary{list-style:none} details>summary::-webkit-details-marker{display:none} .chevron{transition:transform 0.3s ease;display:inline-block} details[open] .chevron{transform:rotate(180deg)}`}</style>

      {mostrarConfig && (
        <ConfiguracionMetabolica
          ultimo={ultimo} email={email}
          gastoActividadExtra={gastoActividadExtra}
          onGuardar={(cfg) => { setObjetivoId(cfg.objetivoId); if (cfg.presupuestoBase) setPresupuestoBase(cfg.presupuestoBase); setPlanSemanal(null); setMostrarConfig(false); }}
          onCerrar={() => setMostrarConfig(false)}
        />
      )}
      {mostrarSemana && planSemanal && <WeeklyPlannerModal planSemanal={planSemanal} onCerrar={() => setMostrarSemana(false)} email={email} objetivoId={objetivoId} />}
      {mostrarSuperBoton && <SuperBotonEventos onCerrar={() => setMostrarSuperBoton(false)} onEnviar={activarEvento} />}

      {/* FAB Coach */}
      {datos && ultimo && !chatAbierto && (
        <button onClick={() => setChatAbierto(true)} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 300, width: 58, height: 58, borderRadius: '50%', background: C.green, border: 'none', boxShadow: '0 4px 20px rgba(91,155,60,0.45)', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🤖
          {mensajesChat.length > 0 && <div style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: C.orange, border: `2px solid ${C.white}` }} />}
        </button>
      )}

      {chatAbierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setChatAbierto(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', animation: 'fadeIn 0.2s ease' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '85dvh', borderRadius: '20px 20px 0 0', background: C.white, overflow: 'hidden', animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', maxWidth: 720, width: '100%', margin: '0 auto' }}>
            <ChatPanel mensajesChat={mensajesChat} inputChat={inputChat} setInputChat={setInputChat} chatCargando={chatCargando} enviarMensaje={enviarMensaje} onCerrar={() => setChatAbierto(false)} chatEndRef={chatEndRef} />
          </div>
        </div>
      )}

      <nav style={{ background: C.green, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {nombreUsuario && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Hola, {nombreUsuario} 👋</span>}
          <a href="/evolucion" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>📈 Mi evolución</a>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, textDecoration: 'none' }}>Nuevo test</a>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 100px' }}>

        {!datos && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.dark, marginBottom: 8 }}>Tu evolución <span style={{ color: C.orange, fontStyle: 'italic' }}>metabólica</span></h1>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 16, lineHeight: 1.7 }}>Introduce el email con el que hiciste el test.</p>
            <p style={{ fontSize: 13, color: C.mid, marginBottom: 28 }}>
              ¿Primera vez? <a href="/onboarding" style={{ color: C.green, fontWeight: 700, textDecoration: 'none' }}>Empieza aquí →</a>
            </p>
            <div style={{ display: 'flex', gap: 8, maxWidth: 380, margin: '0 auto' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarDatos()} placeholder="tu@email.com" style={{ flex: 1, padding: '12px 18px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 14, background: C.white, fontFamily: font, outline: 'none', color: C.dark }} />
              <button onClick={() => buscarDatos()} disabled={cargando} style={{ background: C.orange, color: C.white, border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>{cargando ? '...' : 'Ver'}</button>
            </div>
            {error && <p style={{ color: C.orange, fontSize: 13, marginTop: 16 }}>{error}</p>}
          </div>
        )}

        {datos && ultimo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.dark }}>Mi dashboard</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {planSemanal && (
                  <button onClick={() => setMostrarSemana(true)} style={{ background: C.white, border: `1.5px solid ${C.green}`, color: C.green, padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🛒 Ver semana
                  </button>
                )}
                <button onClick={() => setMostrarConfig(true)} style={{ background: C.white, border: `1.5px solid ${C.light}`, color: C.mid, padding: '8px 12px', borderRadius: 100, fontSize: 12, cursor: 'pointer', fontFamily: font }}>⚙️</button>
                <button onClick={() => { setDatos(null); setEmail(''); setMensajesChat([]); setMensajeProactivoGenerado(false); setPlanSemanal(null); setStreak(0); }}
                  style={{ fontSize: 11, color: '#9A9790', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Salir
                </button>
              </div>
            </div>

            {/* HERO ICM */}
            <div style={{ background: C.green, borderRadius: 20, padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 12, padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Edad real</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 48, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>{Math.round(ultimo.edad_metabolica - (ultimo.delta_anos || 0))}</div>
                </div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>→</div>
                <div style={{ background: C.white, borderRadius: 12, padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 9, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Edad metabólica</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 60, color: C.orange, lineHeight: 1 }}>{ultimo.edad_metabolica}</div>
                  <div style={{ display: 'inline-block', background: ultimo.delta_anos <= 0 ? C.greenPale : C.orangePale, border: `1px solid ${ultimo.delta_anos <= 0 ? '#C8E8B0' : '#F9CFA8'}`, color: ultimo.delta_anos <= 0 ? '#3B6D11' : C.orange, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, marginTop: 6 }}>
                    {ultimo.delta_anos <= 0 ? `${Math.abs(ultimo.delta_anos)} años menos` : `+${ultimo.delta_anos} años`}
                  </div>
                </div>
              </div>
              <div style={{ background: C.white, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>ICM · Índice de Calidad Metabólica</div>
                    <div style={{ fontSize: 11, color: icmColor(ultimo.icm_total), fontWeight: 700 }}>{icmLabel(ultimo.icm_total)}</div>
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: icmColor(ultimo.icm_total), lineHeight: 1 }}>{ultimo.icm_total}<span style={{ fontSize: 13, color: '#9A9790' }}>/100</span></div>
                </div>
                <div style={{ height: 7, background: '#F0EBE3', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ultimo.icm_total}%`, background: icmBarColor(ultimo.icm_total), borderRadius: 100 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
                {[{ icon: '⚡', label: 'Actividad', val: ultimo.efh_score }, { icon: '🏋️', label: 'Composición', val: ultimo.eco_score }, { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score }, { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score }, { icon: '😴', label: 'Descanso', val: ultimo.des_score }].map((s, i) => {
                  const vals = [ultimo.efh_score, ultimo.eco_score, ultimo.nut_score, ultimo.vit_score, ultimo.des_score];
                  const isBest = s.val === Math.max(...vals); const isWorst = s.val === Math.min(...vals);
                  return (
                    <div key={i} style={{ background: isBest ? scoreColor(s.val) : isWorst ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.15)', borderRadius: 9, padding: '9px 5px', textAlign: 'center' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginBottom: 2 }}>{isBest ? '★ TOP' : isWorst ? '↑ MEJORAR' : '\u00a0'}</div>
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.white, fontWeight: 700 }}>{s.val}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STREAK + POTENCIAL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: streak >= 7 ? C.green : streak >= 3 ? C.orangePale : C.white, borderRadius: 16, padding: '16px', border: `1px solid ${streak >= 7 ? C.green : C.light}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }}>{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💤'}</div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: streak >= 7 ? C.white : streak >= 3 ? C.orange : C.mid, lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: 10, color: streak >= 7 ? 'rgba(255,255,255,0.8)' : C.mid, fontWeight: 600, marginTop: 2 }}>días de racha</div>
                  <div style={{ fontSize: 9, color: streak >= 7 ? 'rgba(255,255,255,0.65)' : '#C0B8B0', marginTop: 1 }}>{streak === 0 ? 'Empieza hoy' : streak >= 7 ? '¡Racha semanal!' : `${7 - streak} para racha semanal`}</div>
                </div>
              </div>
              <div style={{ background: C.greenPale, borderRadius: 16, padding: '16px', border: '1px solid #C8E8B0' }}>
                <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🚀 Tu potencial</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: icmColor(ultimo.icm_total) }}>{ultimo.icm_total}</span>
                  <span style={{ fontSize: 11, color: C.mid }}>→</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2E7D32' }}>{Math.min(100, Math.round(ultimo.icm_total * 1.18))}</span>
                </div>
                <div style={{ height: 6, background: '#D4EDBE', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ultimo.icm_total}%`, background: icmColor(ultimo.icm_total), borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 9, color: '#3B6D11', marginTop: 5 }}>mejorando 2 bloques</div>
              </div>
            </div>

            <DailyCheckIn email={email} perfil={ultimo} objetivoId={objetivoId} onWeatherUpdate={(w) => setWeather(w)} completedTasksHoy={completedTasksHoy} />

            <DailyTimeline
              planSemanal={planSemanal} setPlanSemanal={setPlanSemanal}
              email={email} objetivoId={objetivoId}
              onAbrirConfig={() => setMostrarConfig(true)}
              onTodoCompletado={handleTodoCompletado}
              onGenerarPlan={generarPlan} cargandoPlan={cargandoPlan}
              objetivo={OBJETIVOS.find(o => o.id === objetivoId)}
              onChecksChange={(checks) => setCompletedTasksHoy(checks)}
              onGastoActividadChange={(delta) => setGastoActividadExtra(prev => prev + delta)}
              presupuestoBase={presupuestoBase}
              onKcalConsumidas={(kcal) => setKcalConsumidas(kcal)}
              modoRescate={modoRescateActivo}
            />

            {/* SÚPER-BOTÓN */}
            <button onClick={() => setMostrarSuperBoton(true)} style={{ background: 'linear-gradient(135deg,#E65100,#E8621A)', border: 'none', borderRadius: 16, padding: '18px 20px', cursor: 'pointer', fontFamily: font, width: '100%', textAlign: 'left', boxShadow: '0 4px 20px rgba(230,81,0,0.25)', animation: 'borderPulse 2.5s ease infinite', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.white, marginBottom: 4 }}>🗓️ Tengo un evento — adaptar mi plan</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>¿Boda, viaje, cena de trabajo o te has saltado el plan?<br />Pulsa aquí para que lo adaptemos juntos</div>
                </div>
                <div style={{ fontSize: 28, flexShrink: 0, marginLeft: 12 }}>→</div>
              </div>
            </button>

            {/* CTA SUSCRIPCIÓN */}
            <div style={{ background: C.orange, borderRadius: 16, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: C.white, marginBottom: 3 }}>Seguimiento mensual</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>19,90€/mes · Cancela cuando quieras</div>
              </div>
              <a href="#" style={{ background: C.white, color: C.orange, padding: '9px 20px', borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Activar →</a>
            </div>

            {/* ANALÍTICA COLAPSADA */}
            <details style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.light}` }}>
              <summary style={{ background: C.white, padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: font, fontSize: 13, fontWeight: 600, color: C.dark, userSelect: 'none' }}>
                <span>📊 Ver mi reporte analítico detallado</span>
                <span className="chevron" style={{ fontSize: 16, color: C.mid }}>▾</span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px', background: C.bg }}>
                {datos.length > 1 && (
                  <div style={{ background: C.green, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Evolución del ICM</div>
                    <svg viewBox="0 0 680 110" style={{ width: '100%', height: 110 }}>
                      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.white} stopOpacity="0.25" /><stop offset="100%" stopColor={C.white} stopOpacity="0" /></linearGradient></defs>
                      {[20, 55, 90].map(y => <line key={y} x1="40" y1={y} x2="660" y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />)}
                      {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                      {pathD && <path d={pathD} fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {chartData.map((p, i) => (<g key={i}><circle cx={p.x * 6.8} cy={p.y * 1.1} r="5" fill={i === chartData.length - 1 ? C.orange : C.white} stroke={C.green} strokeWidth="2" /><text x={p.x * 6.8} y={p.y * 1.1 - 10} textAnchor="middle" fontSize="10" fill={C.white} fontWeight="600">{p.icm}</text></g>))}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      {chartData.map((p, i) => <span key={i} style={{ color: i === chartData.length - 1 ? C.white : 'rgba(255,255,255,0.6)', fontWeight: i === chartData.length - 1 ? 600 : 400 }}>{p.fecha}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>🚀 Tu potencial de mejora</div>
                  {[{ icon: '⚡', label: 'Actividad física', val: ultimo.efh_score, anos: 3 }, { icon: '🏋️', label: 'Composición corporal', val: ultimo.eco_score, anos: 4 }, { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score, anos: 2 }, { icon: '😴', label: 'Descanso', val: ultimo.des_score, anos: 3 }, { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score, anos: 2 }].sort((a, b) => a.val - b.val).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 11, color: C.dark }}>{s.label}</span><span style={{ fontSize: 11, color: scoreColor(s.val), fontWeight: 700 }}>{s.val}/100</span></div>
                        <div style={{ height: 5, background: '#E0E0E0', borderRadius: 100, overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.val}%`, background: scoreColor(s.val), borderRadius: 100 }} /></div>
                      </div>
                      <div style={{ fontSize: 9, color: scoreColor(s.val), fontWeight: 700, background: scoreBg(s.val), border: `1px solid ${scoreColor(s.val)}44`, padding: '2px 7px', borderRadius: 100, whiteSpace: 'nowrap' }}>-{s.anos} años</div>
                    </div>
                  ))}
                </div>
                {datos.length > 1 && (
                  <div style={{ background: C.white, borderRadius: 14, padding: 18, border: `1px solid ${C.light}` }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: C.dark, marginBottom: 14 }}>Historial de tests</div>
                    {[...datos].reverse().map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < datos.length - 1 ? `1px solid ${C.light}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: 13, color: C.dark, fontWeight: i === 0 ? 600 : 400 }}>{formatFecha(t.fecha)}{i === 0 && <span style={{ fontSize: 10, background: C.greenPale, color: C.green, padding: '1px 8px', borderRadius: 100, marginLeft: 6 }}>Último</span>}</div>
                          <div style={{ fontSize: 11, color: '#9A9790', marginTop: 2 }}>Edad metabólica: {t.edad_metabolica} años</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: icmColor(t.icm_total) }}>{t.icm_total}</div>
                          <div style={{ fontSize: 10, color: '#9A9790' }}>ICM</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {datos.length === 1 && (
                  <div style={{ background: C.greenPale, border: `1px solid #C8E8B0`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>📅</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: C.dark, marginBottom: 6 }}>Vuelve cuando notes cambios</div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 14 }}>Los cambios son medibles en 1-2 semanas.</div>
                    <a href="/bot" style={{ display: 'inline-block', background: C.green, color: C.white, padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Hacer nuevo test</a>
                  </div>
                )}
              </div>
            </details>

          </div>
        )}
      </div>
    </div>
  );
}