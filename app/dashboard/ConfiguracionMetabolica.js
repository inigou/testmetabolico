'use client';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const OBJETIVOS = [
  { id: 'slow_aging', emoji: '🌿', nombre: 'Slow aging', ajuste: 600, macros: { p: 28, c: 47, g: 25 } },
  { id: 'mantener', emoji: '⚖️', nombre: 'Mantener peso', ajuste: 0, macros: { p: 25, c: 50, g: 25 } },
  { id: 'definicion_suave', emoji: '🔥', nombre: 'Definición suave', ajuste: -300, macros: { p: 35, c: 40, g: 25 } },
  { id: 'definicion_agresiva', emoji: '💪', nombre: 'Definición agresiva', ajuste: -500, macros: { p: 40, c: 35, g: 25 } },
  { id: 'hipertrofia', emoji: '🏋️', nombre: 'Hipertrofia moderada', ajuste: 300, macros: { p: 32, c: 48, g: 20 } },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva', ajuste: 500, macros: { p: 35, c: 45, g: 20 } },
  { id: 'perdida_rapida', emoji: '⚡', nombre: 'Pérdida rápida', ajuste: -800, macros: { p: 45, c: 30, g: 25 } },
];

const METS = [
  { id: 'caminar', label: 'Caminar', met: 3.5, emoji: '🚶' },
  { id: 'correr', label: 'Correr', met: 7.0, emoji: '🏃' },
  { id: 'bici', label: 'Bici', met: 5.0, emoji: '🚴' },
  { id: 'pesas', label: 'Pesas', met: 6.0, emoji: '🏋️' },
  { id: 'hiit', label: 'HIIT', met: 8.5, emoji: '🔥' },
  { id: 'natacion', label: 'Natación', met: 7.0, emoji: '🏊' },
  { id: 'yoga', label: 'Yoga', met: 3.0, emoji: '🧘' },
  { id: 'equipo', label: 'Deporte equipo', met: 6.5, emoji: '⚽' },
  { id: 'padel', label: 'Pádel', met: 4.5, emoji: '🎾' },
  { id: 'senderismo', label: 'Senderismo', met: 5.5, emoji: '🏔️' },
];

const ALIMENTOS_EXCLUIR = ['Legumbres', 'Pescado blanco', 'Espinacas', 'Brócoli', 'Lácteos', 'Carne roja', 'Huevo', 'Gluten', 'Frutos secos', 'Marisco', 'Cebolla/ajo', 'Pimientos'];
const EJERCICIOS_PREF = ['Cinta de correr', 'Bicicleta', 'Elíptica', 'Pesas libres', 'Yoga', 'Natación', 'Fútbol/deporte', 'Pádel/Tenis', 'Caminar', 'Senderismo', 'Funcional/crossfit'];

const FUENTES = {
  slow_aging: { p: ['Salmón', 'Huevos', 'Legumbres', 'Sardinas', 'Tofu'], c: ['Avena', 'Boniato', 'Arroz integral', 'Quinoa', 'Frutas del bosque'], g: ['AOVE', 'Aguacate', 'Nueces', 'Almendras', 'Semillas chía'] },
  mantener: { p: ['Pollo', 'Huevos', 'Atún', 'Legumbres', 'Yogur griego'], c: ['Arroz', 'Pasta integral', 'Patata', 'Avena', 'Pan integral'], g: ['AOVE', 'Aguacate', 'Frutos secos', 'Queso curado', 'Aceitunas'] },
  definicion_suave: { p: ['Pechuga pollo', 'Clara huevo', 'Atún al natural', 'Rape', 'Tofu'], c: ['Avena', 'Arroz integral', 'Boniato', 'Verduras', 'Frutas bajas en azúcar'], g: ['AOVE', 'Aguacate', 'Almendras', 'Nueces', 'Semillas'] },
  definicion_agresiva: { p: ['Pechuga pollo', 'Clara huevo', 'Merluza', 'Gambas', 'Proteína whey'], c: ['Avena', 'Arroz blanco post-entreno', 'Verduras de hoja', 'Pepino', 'Tomate'], g: ['AOVE mínimo', 'Aguacate pequeño', 'Almendras 20g', 'Salmón', 'Atún'] },
  hipertrofia: { p: ['Carne roja magra', 'Pollo', 'Huevos', 'Proteína whey', 'Atún'], c: ['Arroz blanco', 'Pasta', 'Pan', 'Plátano', 'Patata'], g: ['AOVE', 'Frutos secos', 'Mantequilla de cacahuete', 'Yema huevo', 'Queso'] },
  hipertrofia_agresiva: { p: ['Carne roja', 'Pollo', 'Huevos enteros', 'Proteína whey', 'Salmón'], c: ['Arroz', 'Pasta', 'Pan blanco', 'Plátano', 'Avena con leche'], g: ['AOVE abundante', 'Frutos secos', 'Mantequilla', 'Queso', 'Aguacate'] },
  perdida_rapida: { p: ['Clara huevo', 'Pechuga pavo', 'Merluza', 'Gambas', 'Cottage cheese'], c: ['Solo verduras', 'Pepino', 'Lechuga', 'Espinacas', 'Tomate cherry'], g: ['AOVE mínimo 1cs', 'Aguacate 50g', 'Almendras 15g'] },
};

const SUPABASE_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';

export default function ConfiguracionMetabolica({ ultimo, email, onGuardar, onCerrar }) {
  const [tabActivo, setTabActivo] = useState('objetivo');
  const [objetivoId, setObjetivoId] = useState('mantener');
  const [sesiones, setSesiones] = useState(3);
  const [duracion, setDuracion] = useState(45);
  const [metId, setMetId] = useState('pesas');
  const [horasSentado, setHorasSentado] = useState(8);
  const [pasosId, setPasosId] = useState('6000');
  const [excluidos, setExcluidos] = useState([]);
  const [ejerciciosPref, setEjerciciosPref] = useState({});
  const [nivelCocina, setNivelCocina] = useState('medio');
  const [tipoDieta, setTipoDieta] = useState('omnivoro');
  const [restricciones, setRestricciones] = useState([]);
  const [otrosExcluidos, setOtrosExcluidos] = useState('');
  const [guardando, setGuardando] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const objetivo = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[1];
  const peso = ultimo?.C4 || 75;
  const altura = ultimo?.C3 || 170;
  const edad = ultimo?.C1 || 35;
  const sexo = ultimo?.C2 === 'Mujer' ? 'mujer' : 'hombre';

  const bmr = sexo === 'hombre'
    ? (10 * peso) + (6.25 * altura) - (5 * edad) + 5
    : (10 * peso) + (6.25 * altura) - (5 * edad) - 161;

  const metActivo = METS.find(m => m.id === metId)?.met || 6;
  const ejercicioKcal = Math.round(metActivo * peso * (duracion / 60) * sesiones / 7);
  const neat = Math.round(parseInt(pasosId) * 0.04);
  const penalizacion = Math.max(0, (horasSentado - 4) * 20);
  const tdee = Math.round(bmr + ejercicioKcal + neat - penalizacion);
  const kcalObjetivo = tdee + objetivo.ajuste;
  const deficit = objetivo.ajuste;
  const protGramos = Math.round((kcalObjetivo * objetivo.macros.p / 100) / 4);
  const carbGramos = Math.round((kcalObjetivo * objetivo.macros.c / 100) / 4);
  const grasaGramos = Math.round((kcalObjetivo * objetivo.macros.g / 100) / 9);
  const kgPorSemana = Math.abs(deficit * 7 / 7700).toFixed(2);
  const kgPor30dias = Math.abs(deficit * 30 / 7700).toFixed(1);

  // Cargar config guardada al montar
  useEffect(() => {
    if (!email) return;
    const clave = `config_${email}`;
    try {
      const guardado = localStorage.getItem(clave);
      if (guardado) {
        const cfg = JSON.parse(guardado);
        if (cfg.objetivoId) setObjetivoId(cfg.objetivoId);
        if (cfg.sesiones) setSesiones(cfg.sesiones);
        if (cfg.duracion) setDuracion(cfg.duracion);
        if (cfg.metId) setMetId(cfg.metId);
        if (cfg.horasSentado) setHorasSentado(cfg.horasSentado);
        if (cfg.pasosId) setPasosId(cfg.pasosId);
        if (cfg.excluidos) setExcluidos(cfg.excluidos);
        if (cfg.ejerciciosPref) setEjerciciosPref(cfg.ejerciciosPref);
        if (cfg.nivelCocina) setNivelCocina(cfg.nivelCocina);
        if (cfg.tipoDieta) setTipoDieta(cfg.tipoDieta);
        if (cfg.restricciones) setRestricciones(cfg.restricciones);
        if (cfg.otrosExcluidos) setOtrosExcluidos(cfg.otrosExcluidos);
      }
    } catch (e) { console.error(e); }
  }, [email]);

  // Chart dona
  useEffect(() => {
    if (tabActivo !== 'energia' || !chartRef.current) return;
    const loadChart = () => {
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
      if (window.Chart) {
        chartInstance.current = new window.Chart(chartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Proteína', 'Carbohidratos', 'Grasa'],
            datasets: [{ data: [objetivo.macros.p, objetivo.macros.c, objetivo.macros.g], backgroundColor: ['#1565C0', '#5B9B3C', '#E8621A'], borderWidth: 0 }]
          },
          options: { responsive: true, plugins: { legend: { display: false } }, cutout: '65%' }
        });
      }
    };
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload = loadChart;
      document.head.appendChild(s);
    } else { loadChart(); }
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [tabActivo, objetivoId, sesiones, duracion, metId, horasSentado, pasosId]);

  const guardarConfig = async () => {
    setGuardando(true);
    const cfg = { objetivoId, sesiones, duracion, metId, horasSentado, pasosId, excluidos, ejerciciosPref, nivelCocina, tipoDieta, restricciones, otrosExcluidos };

    // Guardar en localStorage
    try { localStorage.setItem(`config_${email}`, JSON.stringify(cfg)); } catch (e) { console.error(e); }

    // Guardar objetivo_id en Supabase
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ objetivo_id: objetivoId, preferencias: cfg }),
      });
    } catch (e) { console.error(e); }

    setGuardando(false);
    if (onGuardar) onGuardar(cfg);
  };

  const fuentes = FUENTES[objetivoId] || FUENTES.mantener;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}>
      <div style={{ background: C.white, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header modal */}
        <div style={{ background: C.green, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.white }}>Configuración metabólica</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Personaliza tu objetivo y parámetros</div>
          </div>
          <button onClick={onCerrar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontFamily: font }}>
            Cerrar
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.light}`, background: C.bg, flexShrink: 0 }}>
          {[
            { id: 'objetivo', label: '🎯 Objetivo' },
            { id: 'energia', label: '⚡ Mi energía' },
            { id: 'preferencias', label: '⚙️ Preferencias' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setTabActivo(tab.id)} style={{
              flex: 1, padding: '11px 4px',
              background: tabActivo === tab.id ? C.white : 'transparent',
              border: 'none', borderBottom: tabActivo === tab.id ? `2px solid ${C.orange}` : '2px solid transparent',
              fontSize: 10, fontWeight: 600,
              color: tabActivo === tab.id ? C.orange : '#9A9790',
              cursor: 'pointer', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* TAB OBJETIVO */}
          {tabActivo === 'objetivo' && (
            <div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 16 }}>
                Tu objetivo determina el plan de alimentación, el déficit o superávit calórico y las recomendaciones del coach.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OBJETIVOS.map(obj => (
                  <button key={obj.id} onClick={() => setObjetivoId(obj.id)} style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: font,
                    background: objetivoId === obj.id ? C.greenPale : C.bg,
                    border: `2px solid ${objetivoId === obj.id ? C.green : C.light}`,
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 24 }}>{obj.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{obj.nombre}</div>
                      <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>
                        {obj.ajuste === 0 ? 'Sin ajuste calórico' : obj.ajuste > 0 ? `+${obj.ajuste} kcal/día` : `${obj.ajuste} kcal/día`}
                        {' · '}P{obj.macros.p}% / C{obj.macros.c}% / G{obj.macros.g}%
                      </div>
                    </div>
                    {objetivoId === obj.id && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 12 }}>✓</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB ENERGÍA */}
          {tabActivo === 'energia' && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tipo de actividad principal</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {METS.map(m => (
                    <button key={m.id} onClick={() => setMetId(m.id)} style={{
                      padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                      background: metId === m.id ? C.orange : C.bg,
                      color: metId === m.id ? C.white : C.mid,
                      border: `1.5px solid ${metId === m.id ? C.orange : C.light}`,
                    }}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Sesiones/semana', val: sesiones, set: setSesiones, min: 0, max: 14, step: 1, suffix: '' },
                  { label: 'Duración (min)', val: duracion, set: setDuracion, min: 15, max: 120, step: 5, suffix: 'min' },
                  { label: 'Horas sentado/día', val: horasSentado, set: setHorasSentado, min: 2, max: 16, step: 1, suffix: 'h' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.dark }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{s.val}{s.suffix}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.set(+e.target.value)}
                      style={{ width: '100%', accentColor: C.orange }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: C.dark, marginBottom: 6 }}>Pasos diarios</div>
                  <select value={pasosId} onChange={e => setPasosId(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 12, fontFamily: font, background: C.white, color: C.dark, outline: 'none' }}>
                    <option value="1500">Menos de 3.000</option>
                    <option value="3000">3.000 – 6.000</option>
                    <option value="6000">6.000 – 10.000</option>
                    <option value="10000">10.000 – 15.000</option>
                    <option value="15000">Más de 15.000</option>
                  </select>
                </div>
              </div>

              {/* Panel resultado */}
              <div style={{ background: C.dark, borderRadius: 16, padding: 20, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lo que gastas</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: C.white, lineHeight: 1, marginBottom: 10 }}>
                      {tdee}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}> kcal</span>
                    </div>
                    {[
                      { label: 'Basal', val: Math.round(bmr), color: 'rgba(255,255,255,0.7)' },
                      { label: 'Ejercicio', val: `+${ejercicioKcal}`, color: C.green },
                      { label: 'NEAT', val: `+${neat}`, color: '#7AB648' },
                      { label: 'Sedentarismo', val: `-${penalizacion}`, color: penalizacion > 0 ? C.orange : 'rgba(255,255,255,0.4)' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                        <span style={{ fontSize: 10, color: item.color, fontWeight: 600 }}>{item.val} kcal</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{'→'}</div>
                    <div style={{ background: deficit < 0 ? C.orange : C.green, color: C.white, padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {deficit < 0 ? `${deficit} kcal` : deficit > 0 ? `+${deficit} kcal` : 'equilibrio'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lo que debes comer</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: deficit < 0 ? C.orange : C.green, lineHeight: 1, marginBottom: 6 }}>
                      {kcalObjetivo}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}> kcal</span>
                    </div>
                    {deficit !== 0 && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                        {kgPorSemana} kg/sem · {kgPor30dias} kg/mes
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ height: 10, borderRadius: 100, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                  <div style={{ width: `${objetivo.macros.p}%`, background: '#1565C0' }} />
                  <div style={{ width: `${objetivo.macros.c}%`, background: C.green }} />
                  <div style={{ width: `${objetivo.macros.g}%`, background: C.orange }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  {[
                    { label: 'Proteína', g: protGramos, pct: objetivo.macros.p, color: '#1565C0', bg: '#E3F2FD' },
                    { label: 'Carbohidratos', g: carbGramos, pct: objetivo.macros.c, color: C.green, bg: C.greenPale },
                    { label: 'Grasa', g: grasaGramos, pct: objetivo.macros.g, color: C.orange, bg: C.orangePale },
                  ].map((m, i) => (
                    <div key={i} style={{ background: m.bg, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: m.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: m.color }}>{m.g}g</div>
                      <div style={{ fontSize: 9, color: C.mid }}>{m.pct}%</div>
                    </div>
                  ))}
                  <div style={{ width: 70, height: 70 }}>
                    <canvas ref={chartRef} width="70" height="70" />
                  </div>
                </div>
              </div>

              {/* Fuentes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Proteína', items: fuentes.p, color: '#1565C0', bg: '#E3F2FD' },
                  { label: 'Carbohidratos', items: fuentes.c, color: C.green, bg: C.greenPale },
                  { label: 'Grasa', items: fuentes.g, color: C.orange, bg: C.orangePale },
                ].map((col, i) => (
                  <div key={i} style={{ background: col.bg, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 9, color: col.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{col.label}</div>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 11, color: C.dark, marginBottom: 4 }}>• {item}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB PREFERENCIAS */}
          {tabActivo === 'preferencias' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Alimentos que no como</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                  {ALIMENTOS_EXCLUIR.map(item => {
                    const exc = excluidos.includes(item);
                    return (
                      <button key={item} onClick={() => setExcluidos(prev => exc ? prev.filter(e => e !== item) : [...prev, item])} style={{
                        padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                        background: exc ? '#FDECEA' : C.bg, color: exc ? '#C0392B' : C.mid,
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

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mis ejercicios</div>
                <div style={{ fontSize: 10, color: C.mid, marginBottom: 10 }}>1 toque = me encanta · 2 toques = lo odio · 3 = neutro</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {EJERCICIOS_PREF.map(ej => {
                    const estado = ejerciciosPref[ej] || 0;
                    const estilos = [
                      { bg: C.bg, color: C.mid, border: C.light, text: ej },
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

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Nivel en la cocina</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ id: 'rapido', label: 'Rápido -20min' }, { id: 'medio', label: 'Medio' }, { id: 'avanzado', label: 'Avanzado' }].map(n => (
                    <button key={n.id} onClick={() => setNivelCocina(n.id)} style={{
                      flex: 1, padding: '9px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                      background: nivelCocina === n.id ? C.green : C.bg, color: nivelCocina === n.id ? C.white : C.mid,
                      border: `1.5px solid ${nivelCocina === n.id ? C.green : C.light}`,
                    }}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tipo de dieta</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ id: 'omnivoro', label: '🍖 Omnívoro' }, { id: 'flexitariano', label: '🥗 Flexitariano' }, { id: 'vegetariano', label: '🌿 Vegetariano' }, { id: 'vegano', label: '🌱 Vegano' }].map(d => (
                    <button key={d.id} onClick={() => setTipoDieta(d.id)} style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                      background: tipoDieta === d.id ? C.orange : C.bg, color: tipoDieta === d.id ? C.white : C.mid,
                      border: `1.5px solid ${tipoDieta === d.id ? C.orange : C.light}`,
                    }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Restricciones</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {['Sin gluten', 'Sin lactosa', 'Halal', 'Kosher'].map(r => {
                    const activo = restricciones.includes(r);
                    return (
                      <button key={r} onClick={() => setRestricciones(prev => activo ? prev.filter(x => x !== r) : [...prev, r])} style={{
                        padding: '6px 14px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                        background: activo ? C.orangePale : C.bg, color: activo ? C.orange : C.mid,
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

        {/* Footer con botón guardar */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.light}`, flexShrink: 0 }}>
          <button onClick={guardarConfig} disabled={guardando} style={{
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