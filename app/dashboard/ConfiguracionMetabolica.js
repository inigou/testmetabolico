'use client';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const OBJETIVOS = [
  { id: 'slow_aging',           emoji: '🌿', nombre: 'Slow aging',           ajuste: 0,    macros: { p: 28, c: 47, g: 25 } },
  { id: 'mantener',             emoji: '⚖️', nombre: 'Mantener peso',         ajuste: 0,    macros: { p: 25, c: 50, g: 25 } },
  { id: 'definicion_suave',     emoji: '🔥', nombre: 'Definición suave',      ajuste: -300, macros: { p: 35, c: 40, g: 25 } },
  { id: 'definicion_agresiva',  emoji: '💪', nombre: 'Definición agresiva',   ajuste: -500, macros: { p: 40, c: 35, g: 25 } },
  { id: 'hipertrofia',          emoji: '🏋️', nombre: 'Hipertrofia moderada',  ajuste: 300,  macros: { p: 32, c: 48, g: 20 } },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva',  ajuste: 500,  macros: { p: 35, c: 45, g: 20 } },
  { id: 'perdida_rapida',       emoji: '⚡', nombre: 'Pérdida rápida',        ajuste: -800, macros: { p: 45, c: 30, g: 25 } },
];

const ALIMENTOS_EXCLUIR = ['Legumbres', 'Pescado blanco', 'Espinacas', 'Brócoli', 'Lácteos', 'Carne roja', 'Huevo', 'Gluten', 'Frutos secos', 'Marisco', 'Cebolla/ajo', 'Pimientos'];
const EJERCICIOS_PREF   = ['Cinta', 'Bicicleta', 'Elíptica', 'Pesas libres', 'Yoga', 'Natación', 'Fútbol', 'Pádel/Tenis', 'Caminar', 'Senderismo', 'Crossfit', 'Surf', 'Running'];
const HORARIOS_ENTRENO  = [
  { id: 'manana',     label: 'Mañana',      desc: '6h – 10h',  emoji: '🌅' },
  { id: 'mediodia',   label: 'Mediodía',    desc: '11h – 14h', emoji: '☀️' },
  { id: 'tarde',      label: 'Tarde',       desc: '17h – 20h', emoji: '🌇' },
  { id: 'noche',      label: 'Noche',       desc: '20h – 23h', emoji: '🌙' },
];

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

export default function ConfiguracionMetabolica({ ultimo, email, onGuardar, onCerrar, gastoActividadExtra = 0 }) {
  const [tab, setTab] = useState('mando');
  const [guardando, setGuardando] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // ── Estado Tab 1: Centro de Mando ──
  const [pasos, setPasos] = useState(6000);
  const [hayEntreno, setHayEntreno] = useState(true);
  const [duracionEntreno, setDuracionEntreno] = useState(45);
  const [tipoEntreno, setTipoEntreno] = useState('pesas');

  // ── Estado Tab 2: Mi Objetivo ──
  const [objetivoId, setObjetivoId] = useState('mantener');

  // ── Estado Tab 3: Preferencias ──
  const [excluidos, setExcluidos] = useState([]);
  const [otrosExcluidos, setOtrosExcluidos] = useState('');
  const [ejerciciosPref, setEjerciciosPref] = useState({});
  const [nivelCocina, setNivelCocina] = useState('medio');
  const [tipoDieta, setTipoDieta] = useState('omnivoro');
  const [restricciones, setRestricciones] = useState([]);
  const [horarioEntreno, setHorarioEntreno] = useState('tarde');

  const obj = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[1];
  const peso   = ultimo?.C4 || 75;
  const altura = ultimo?.C3 || 170;
  const edad   = ultimo?.C1 || 35;
  const sexo   = ultimo?.C2 === 'Mujer' ? 'mujer' : 'hombre';

  // Mifflin-St Jeor
  const bmr = Math.round(
    sexo === 'hombre'
      ? (10 * peso) + (6.25 * altura) - (5 * edad) + 5
      : (10 * peso) + (6.25 * altura) - (5 * edad) - 161
  );

  const METS = { caminar: 3.5, pesas: 6.0, hiit: 8.5, cardio: 5.5, yoga: 3.0, natacion: 7.0, surf: 5.5, running: 7.0 };
  const met = METS[tipoEntreno] || 6;
  const kcalEntreno = hayEntreno ? Math.round(met * peso * (duracionEntreno / 60)) : 0;
  const kcalPasos   = Math.round(pasos * 0.04);
  const tdee = bmr + kcalEntreno + kcalPasos + gastoActividadExtra;
  const kcalObjetivo = tdee + obj.ajuste;
  const deficit = obj.ajuste;

  const protGramos  = Math.round((kcalObjetivo * obj.macros.p / 100) / 4);
  const carbGramos  = Math.round((kcalObjetivo * obj.macros.c / 100) / 4);
  const grasaGramos = Math.round((kcalObjetivo * obj.macros.g / 100) / 9);

  // Cargar config guardada
  useEffect(() => {
    if (!email) return;
    try {
      const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
      if (cfg.objetivoId)     setObjetivoId(cfg.objetivoId);
      if (cfg.pasos != null)  setPasos(cfg.pasos);
      if (cfg.hayEntreno != null) setHayEntreno(cfg.hayEntreno);
      if (cfg.duracionEntreno)    setDuracionEntreno(cfg.duracionEntreno);
      if (cfg.tipoEntreno)        setTipoEntreno(cfg.tipoEntreno);
      if (cfg.excluidos)      setExcluidos(cfg.excluidos);
      if (cfg.otrosExcluidos) setOtrosExcluidos(cfg.otrosExcluidos);
      if (cfg.ejerciciosPref) setEjerciciosPref(cfg.ejerciciosPref);
      if (cfg.nivelCocina)    setNivelCocina(cfg.nivelCocina);
      if (cfg.tipoDieta)      setTipoDieta(cfg.tipoDieta);
      if (cfg.restricciones)  setRestricciones(cfg.restricciones);
      if (cfg.horarioEntreno) setHorarioEntreno(cfg.horarioEntreno);
    } catch (e) { console.error(e); }
  }, [email]);

  // Chart dona — se recarga cuando cambian macros
  useEffect(() => {
    if (tab !== 'mando') return;
    const load = () => {
      if (!chartRef.current) return;
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
      if (!window.Chart) return;
      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Proteína', 'Carbohidratos', 'Grasa'],
          datasets: [{ data: [obj.macros.p, obj.macros.c, obj.macros.g], backgroundColor: ['#1565C0', '#5B9B3C', '#E8621A'], borderWidth: 0 }],
        },
        options: { responsive: false, plugins: { legend: { display: false } }, cutout: '68%' },
      });
    };
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload = load; document.head.appendChild(s);
    } else { load(); }
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [tab, objetivoId, pasos, hayEntreno, duracionEntreno]);

  const guardar = async () => {
    setGuardando(true);
    const cfg = { objetivoId, pasos, hayEntreno, duracionEntreno, tipoEntreno, excluidos, otrosExcluidos, ejerciciosPref, nivelCocina, tipoDieta, restricciones, horarioEntreno };
    try { localStorage.setItem(`config_${email}`, JSON.stringify(cfg)); } catch (e) { console.error(e); }
    try {
      await fetch(`${SB_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH', headers: sbHeaders,
        body: JSON.stringify({ objetivo_id: objetivoId, preferencias: cfg }),
      });
    } catch (e) { console.error(e); }
    setGuardando(false);
    if (onGuardar) onGuardar(cfg);
  };

  const deficitColor = deficit < -500 ? '#C62828' : deficit < 0 ? C.orange : deficit > 0 ? C.green : C.mid;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Overlay */}
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.2s ease' }} />

      {/* Sheet */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 720,
        height: '92dvh',
        borderRadius: '20px 20px 0 0',
        background: C.white,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        `}</style>

        {/* Header */}
        <div style={{ background: C.dark, padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: C.white }}>Centro de control</div>
            <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.white, width: 34, height: 34, borderRadius: '50%', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'mando',     label: '⚡ Centro' },
              { id: 'objetivo',  label: '🎯 Objetivo' },
              { id: 'prefs',     label: '⚙️ Preferencias' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '9px 16px', cursor: 'pointer', fontFamily: font,
                fontSize: 11, fontWeight: 700, border: 'none',
                background: tab === t.id ? C.white : 'transparent',
                color: tab === t.id ? C.dark : 'rgba(255,255,255,0.65)',
                borderRadius: '10px 10px 0 0',
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: C.bg }}>

          {/* ════════ TAB CENTRO DE MANDO ════════ */}
          {tab === 'mando' && (
            <div>
              {/* Ecuación dinámica */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Ecuación energética de hoy
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
                  {/* BMR */}
                  <div style={{ flex: 1, background: '#EEF0FA', borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: '1px solid #C8CEEA' }}>
                    <div style={{ fontSize: 9, color: '#5B6FA8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Basal</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#3949AB' }}>{bmr}</div>
                    <div style={{ fontSize: 8, color: '#9A9790', marginTop: 1 }}>kcal</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: C.mid }}>+</div>
                  {/* Pasos */}
                  <div style={{ flex: 1, background: C.greenPale, borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: '1px solid #C8E8B0' }}>
                    <div style={{ fontSize: 9, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Pasos</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.green }}>+{kcalPasos}</div>
                    <div style={{ fontSize: 8, color: '#9A9790', marginTop: 1 }}>kcal</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: C.mid }}>+</div>
                  {/* Entreno */}
                  <div style={{ flex: 1, background: hayEntreno ? C.orangePale : '#F5F5F5', borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: `1px solid ${hayEntreno ? '#F9CFA8' : C.light}` }}>
                    <div style={{ fontSize: 9, color: hayEntreno ? '#C05010' : '#9A9790', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Entreno</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: hayEntreno ? C.orange : '#C0C0C0' }}>+{kcalEntreno}</div>
                    <div style={{ fontSize: 8, color: '#9A9790', marginTop: 1 }}>kcal</div>
                  </div>
                  {gastoActividadExtra > 0 && <>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: C.mid }}>+</div>
                    <div style={{ flex: 1, background: '#EDE7F6', borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: '1px solid #CE93D8' }}>
                      <div style={{ fontSize: 9, color: '#7B1FA2', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Extra</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#7B1FA2' }}>+{gastoActividadExtra}</div>
                      <div style={{ fontSize: 8, color: '#9A9790', marginTop: 1 }}>kcal</div>
                    </div>
                  </>}
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: C.mid }}>=</div>
                  {/* Total */}
                  <div style={{ flex: 1.2, background: C.dark, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Objetivo</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: deficit < 0 ? C.orange : C.green }}>{kcalObjetivo}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>kcal/día</div>
                  </div>
                </div>
                {deficit !== 0 && (
                  <div style={{ marginTop: 8, padding: '6px 12px', background: deficit < 0 ? C.orangePale : C.greenPale, borderRadius: 8, fontSize: 11, color: deficitColor, fontWeight: 600, textAlign: 'center' }}>
                    {deficit < 0 ? `Déficit de ${Math.abs(deficit)} kcal — ${(Math.abs(deficit)*30/7700).toFixed(1)} kg en 30 días` : `Superávit de ${deficit} kcal — +${(deficit*30/7700).toFixed(1)} kg en 30 días`}
                  </div>
                )}
              </div>

              {/* Slider pasos */}
              <div style={{ background: C.white, borderRadius: 14, padding: '16px', marginBottom: 14, border: `1px solid ${C.light}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>🚶 Pasos hoy</div>
                    <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>Ajusta según tu actividad real</div>
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.green }}>{pasos.toLocaleString()}</div>
                </div>
                <input type="range" min="0" max="20000" step="500" value={pasos} onChange={e => setPasos(+e.target.value)}
                  style={{ width: '100%', accentColor: C.green }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#C0B8B0', marginTop: 4 }}>
                  <span>0</span><span>5k</span><span>10k</span><span>15k</span><span>20k</span>
                </div>
              </div>

              {/* Toggle entreno */}
              <div style={{ background: C.white, borderRadius: 14, padding: '16px', marginBottom: 14, border: `1px solid ${C.light}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hayEntreno ? 14 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>🏋️ Entreno hoy</div>
                    <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{hayEntreno ? `+${kcalEntreno} kcal` : 'Día de descanso'}</div>
                  </div>
                  {/* Toggle switch */}
                  <button onClick={() => setHayEntreno(v => !v)} style={{
                    width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', padding: 3,
                    background: hayEntreno ? C.green : C.light, position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: hayEntreno ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
                {hayEntreno && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: C.dark }}>Duración</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{duracionEntreno} min</span>
                    </div>
                    <input type="range" min="15" max="120" step="5" value={duracionEntreno} onChange={e => setDuracionEntreno(+e.target.value)}
                      style={{ width: '100%', accentColor: C.orange, marginBottom: 12 }} />
                    <div style={{ fontSize: 11, color: C.dark, marginBottom: 8 }}>Tipo de actividad</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries({ pesas: '🏋️ Pesas', hiit: '🔥 HIIT', cardio: '🚴 Cardio', running: '🏃 Running', natacion: '🏊 Natación', yoga: '🧘 Yoga', surf: '🏄 Surf', caminar: '🚶 Caminar' }).map(([k, v]) => (
                        <button key={k} onClick={() => setTipoEntreno(k)} style={{
                          padding: '5px 11px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                          background: tipoEntreno === k ? C.orange : C.bg,
                          color: tipoEntreno === k ? C.white : C.mid,
                          border: `1.5px solid ${tipoEntreno === k ? C.orange : C.light}`,
                        }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Macros + dona */}
              <div style={{ background: C.white, borderRadius: 14, padding: '16px', border: `1px solid ${C.light}` }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Distribución de macros</div>
                {/* Barra */}
                <div style={{ height: 12, borderRadius: 100, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                  <div style={{ width: `${obj.macros.p}%`, background: '#1565C0', transition: 'width 0.4s' }} />
                  <div style={{ width: `${obj.macros.c}%`, background: C.green, transition: 'width 0.4s' }} />
                  <div style={{ width: `${obj.macros.g}%`, background: C.orange, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Dona */}
                  <div style={{ flexShrink: 0 }}>
                    <canvas ref={chartRef} width="80" height="80" />
                  </div>
                  {/* Cards */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Proteína', g: protGramos, pct: obj.macros.p, color: '#1565C0', bg: '#E3F2FD' },
                      { label: 'Carbohidratos', g: carbGramos, pct: obj.macros.c, color: C.green, bg: C.greenPale },
                      { label: 'Grasa', g: grasaGramos, pct: obj.macros.g, color: C.orange, bg: C.orangePale },
                    ].map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: m.bg, borderRadius: 8, padding: '6px 10px' }}>
                        <span style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.label}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: m.color }}>{m.g}g</span>
                          <span style={{ fontSize: 9, color: '#9A9790', marginLeft: 4 }}>{m.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: C.mid, textAlign: 'center', fontStyle: 'italic' }}>
                  Calculado con fórmula Mifflin-St Jeor · {kcalObjetivo} kcal totales
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB MI OBJETIVO ════════ */}
          {tab === 'objetivo' && (
            <div>
              {/* Scores actuales */}
              {ultimo && (
                <div style={{ background: C.white, borderRadius: 14, padding: '16px', marginBottom: 16, border: `1px solid ${C.light}` }}>
                  <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Tu perfil metabólico actual</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: C.orange }}>{ultimo.icm_total}/100</div>
                      <div style={{ fontSize: 11, color: C.mid }}>ICM · {ultimo.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: C.green }}>{ultimo.edad_metabolica}</div>
                      <div style={{ fontSize: 11, color: C.mid }}>años metabólicos</div>
                    </div>
                  </div>
                  {[
                    { icon: '⚡', label: 'Actividad', val: ultimo.efh_score },
                    { icon: '🏋️', label: 'Composición', val: ultimo.eco_score },
                    { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score },
                    { icon: '😴', label: 'Descanso', val: ultimo.des_score },
                    { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score },
                  ].map((s, i) => {
                    const color = s.val >= 65 ? C.green : s.val >= 50 ? '#F9A825' : C.orange;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, width: 20 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: C.dark }}>{s.label}</span>
                            <span style={{ fontSize: 11, color, fontWeight: 700 }}>{s.val}</span>
                          </div>
                          <div style={{ height: 4, background: C.light, borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.val}%`, background: color, borderRadius: 100 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selector objetivo */}
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Selecciona tu meta</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OBJETIVOS.map(o => (
                  <button key={o.id} onClick={() => setObjetivoId(o.id)} style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: font,
                    background: objetivoId === o.id ? C.greenPale : C.white,
                    border: `2px solid ${objetivoId === o.id ? C.green : C.light}`,
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>{o.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{o.nombre}</div>
                      <div style={{ fontSize: 10, color: C.mid, marginTop: 1 }}>
                        {o.ajuste === 0 ? 'Sin ajuste calórico' : o.ajuste > 0 ? `+${o.ajuste} kcal/día` : `${o.ajuste} kcal/día`}
                        {' · '}P{o.macros.p}% / C{o.macros.c}% / G{o.macros.g}%
                      </div>
                    </div>
                    {objetivoId === o.id && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 11 }}>✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════ TAB PREFERENCIAS ════════ */}
          {tab === 'prefs' && (
            <div>
              {/* Horario entreno */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Horario de entrenamiento preferido</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {HORARIOS_ENTRENO.map(h => (
                    <button key={h.id} onClick={() => setHorarioEntreno(h.id)} style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: font,
                      background: horarioEntreno === h.id ? C.greenPale : C.white,
                      border: `2px solid ${horarioEntreno === h.id ? C.green : C.light}`,
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 20 }}>{h.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{h.label}</div>
                        <div style={{ fontSize: 10, color: C.mid }}>{h.desc}</div>
                      </div>
                      {horarioEntreno === h.id && <div style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 9 }}>✓</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de dieta */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tipo de dieta</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ id: 'omnivoro', label: '🍖 Omnívoro' }, { id: 'flexitariano', label: '🥗 Flexitariano' }, { id: 'vegetariano', label: '🌿 Vegetariano' }, { id: 'vegano', label: '🌱 Vegano' }].map(d => (
                    <button key={d.id} onClick={() => setTipoDieta(d.id)} style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                      background: tipoDieta === d.id ? C.orange : C.white,
                      color: tipoDieta === d.id ? C.white : C.mid,
                      border: `1.5px solid ${tipoDieta === d.id ? C.orange : C.light}`,
                    }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alimentos excluidos */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Alimentos que no como</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {ALIMENTOS_EXCLUIR.map(item => {
                    const exc = excluidos.includes(item);
                    return (
                      <button key={item} onClick={() => setExcluidos(prev => exc ? prev.filter(e => e !== item) : [...prev, item])} style={{
                        padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                        background: exc ? '#FDECEA' : C.white, color: exc ? '#C0392B' : C.mid,
                        border: `1.5px solid ${exc ? '#F1948A' : C.light}`,
                        textDecoration: exc ? 'line-through' : 'none',
                      }}>
                        {item}
                      </button>
                    );
                  })}
                </div>
                <input value={otrosExcluidos} onChange={e => setOtrosExcluidos(e.target.value)} placeholder="Otros alimentos que excluyes..."
                  style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 12, fontFamily: font, background: C.white, color: C.dark, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Ejercicios preferidos */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mis ejercicios favoritos</div>
                <div style={{ fontSize: 10, color: C.mid, marginBottom: 10 }}>1 toque = me encanta · 2 toques = lo odio · 3 = neutro</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {EJERCICIOS_PREF.map(ej => {
                    const estado = ejerciciosPref[ej] || 0;
                    const estilos = [
                      { bg: C.white, color: C.mid, border: C.light, text: ej },
                      { bg: C.greenPale, color: C.green, border: '#C8E8B0', text: `✓ ${ej}` },
                      { bg: '#FDECEA', color: '#C0392B', border: '#F1948A', text: `✗ ${ej}` },
                    ];
                    const e = estilos[estado];
                    return (
                      <button key={ej} onClick={() => setEjerciciosPref(prev => ({ ...prev, [ej]: (estado + 1) % 3 }))} style={{
                        padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                        background: e.bg, color: e.color, border: `1.5px solid ${e.border}`,
                      }}>
                        {e.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nivel cocina */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Nivel en la cocina</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ id: 'rapido', label: '⚡ Rápido -20min' }, { id: 'medio', label: '👨‍🍳 Medio' }, { id: 'avanzado', label: '🏆 Avanzado' }].map(n => (
                    <button key={n.id} onClick={() => setNivelCocina(n.id)} style={{
                      flex: 1, padding: '9px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                      background: nivelCocina === n.id ? C.green : C.white,
                      color: nivelCocina === n.id ? C.white : C.mid,
                      border: `1.5px solid ${nivelCocina === n.id ? C.green : C.light}`,
                    }}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restricciones */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Restricciones</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {['Sin gluten', 'Sin lactosa', 'Halal', 'Kosher'].map(r => {
                    const activo = restricciones.includes(r);
                    return (
                      <button key={r} onClick={() => setRestricciones(prev => activo ? prev.filter(x => x !== r) : [...prev, r])} style={{
                        padding: '6px 14px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                        background: activo ? C.orangePale : C.white, color: activo ? C.orange : C.mid,
                        border: `1.5px solid ${activo ? C.orange : C.light}`,
                      }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer guardar */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.light}`, background: C.white, flexShrink: 0 }}>
          <button onClick={guardar} disabled={guardando} style={{
            width: '100%', background: guardando ? '#C8E8B0' : C.green, color: C.white, border: 'none',
            padding: '14px', borderRadius: 100, fontSize: 14, fontWeight: 700,
            cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: font,
          }}>
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}