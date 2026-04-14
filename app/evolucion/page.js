'use client';
import { useState, useEffect } from 'react';
import { cargarLogsUltimos, calcularRacha } from '../../lib/supabase';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_S = ['L','M','X','J','V','S','D'];

// Convierte getDay() (0=dom) a índice L-D
const getISODay = (date) => { const d = date.getDay(); return d === 0 ? 6 : d - 1; };

// Genera los últimos 84 días (12 semanas) con metadatos
function generarCeldas(logs) {
  const map = {};
  logs.forEach(l => { map[l.fecha] = l; });

  const celdas = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    const log = map[key];

    let nivel = 0; // 0=sin datos, 1=bajo, 2=medio, 3=alto
    let completados = 0;
    if (log) {
      const tasks = log.completed_tasks || {};
      completados = Object.values(tasks).filter(Boolean).length;
      const total = Object.keys(tasks).length || 1;
      const pct = completados / total;
      if (pct >= 0.8) nivel = 3;
      else if (pct >= 0.5) nivel = 2;
      else nivel = 1;
    }

    celdas.push({ fecha: key, date: d, log, nivel, completados });
  }
  return celdas;
}

const NIVEL_COLOR = {
  0: '#E8E4DC',
  1: '#C8E8B0',
  2: '#7AB648',
  3: '#2E7D32',
};

// Agrupa celdas en semanas para el grid
function agruparSemanas(celdas) {
  const semanas = [];
  let semana = [];
  celdas.forEach((celda, i) => {
    const diaISO = getISODay(celda.date);
    if (i === 0) {
      // Rellenar inicio con nulos
      for (let j = 0; j < diaISO; j++) semana.push(null);
    }
    semana.push(celda);
    if (semana.length === 7 || i === celdas.length - 1) {
      while (semana.length < 7) semana.push(null);
      semanas.push([...semana]);
      semana = [];
    }
  });
  return semanas;
}

// Mini sparkline SVG
function Sparkline({ datos, campo, color, label }) {
  if (!datos || datos.length < 2) return null;
  const vals = datos.map(d => d[campo] || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const rango = max - min || 1;
  const W = 280, H = 60, PAD = 8;

  const puntos = vals.map((v, i) => {
    const x = PAD + (i / (vals.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / rango) * (H - PAD * 2);
    return { x, y, v };
  });

  const path = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${puntos[puntos.length-1].x} ${H} L ${puntos[0].x} ${H} Z`;
  const ultimo = puntos[puntos.length - 1];
  const media = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{label}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 10, color: C.mid }}>Media: <strong style={{ color }}>{media}</strong></span>
          <span style={{ fontSize: 10, color: C.mid }}>Hoy: <strong style={{ color }}>{vals[vals.length-1]}</strong></span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 56, display: 'block' }}>
        <defs>
          <linearGradient id={`grad_${campo}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad_${campo})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={ultimo.x} cy={ultimo.y} r="4" fill={color} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#C0B8B0', marginTop: 2 }}>
        <span>{datos[0]?.fecha?.slice(5)}</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

export default function MiEvolucion() {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [mesActivo, setMesActivo] = useState(new Date().getMonth());

  const racha = calcularRacha(logs);
  const celdas = generarCeldas(logs);
  const semanas = agruparSemanas(celdas);
  const totalDias = celdas.filter(c => c.log).length;
  const diasVerdes = celdas.filter(c => c.nivel === 3).length;
  const logsFiltrados = logs.filter(l => new Date(l.fecha).getMonth() === mesActivo);

  const promedioEnergia = logsFiltrados.length > 0
    ? Math.round(logsFiltrados.reduce((a, b) => a + (b.energia || 0), 0) / logsFiltrados.length * 10) / 10
    : 0;
  const promedioSueno = logsFiltrados.length > 0
    ? Math.round(logsFiltrados.reduce((a, b) => a + (b.sueno || 0), 0) / logsFiltrados.length * 10) / 10
    : 0;

  const buscar = async () => {
    if (!emailInput.trim()) return;
    setCargando(true);
    const data = await cargarLogsUltimos(emailInput.trim(), 90);
    setLogs(data || []);
    setEmail(emailInput.trim());
    setCargando(false);
  };

  if (!email) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
        <nav style={{ background: C.green, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></span>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecoration: 'none' }}>← Dashboard</a>
        </nav>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📈</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.dark, marginBottom: 10 }}>
            Mi evolución
          </h1>
          <p style={{ fontSize: 14, color: C.mid, marginBottom: 32, lineHeight: 1.7 }}>
            Visualiza tus rachas, tendencias y adherencia diaria.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 380, margin: '0 auto' }}>
            <input
              type="email" value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="tu@email.com"
              style={{ flex: 1, padding: '12px 18px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 14, background: C.white, fontFamily: font, outline: 'none', color: C.dark }}
            />
            <button onClick={buscar} disabled={cargando} style={{ background: C.orange, color: C.white, border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              {cargando ? '...' : 'Ver'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <nav style={{ background: C.green, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></span>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecoration: 'none' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 80px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: C.dark }}>Mi evolución</h1>
          <button onClick={() => setEmail('')} style={{ fontSize: 11, color: '#9A9790', background: 'none', border: 'none', cursor: 'pointer' }}>
            Cambiar email
          </button>
        </div>

        {/* ── STATS TOP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: '🔥', label: 'Racha actual', valor: `${racha} días`, color: racha >= 7 ? C.green : racha >= 3 ? C.orange : C.mid },
            { icon: '📅', label: 'Días con check-in', valor: `${totalDias}`, color: C.green },
            { icon: '✅', label: 'Días perfectos', valor: `${diasVerdes}`, color: '#2E7D32' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.light}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.valor}</div>
              <div style={{ fontSize: 10, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MAPA DE CALOR ── */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px', border: `1px solid ${C.light}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.dark }}>Mapa de adherencia</div>
              <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>Últimas 12 semanas</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.mid }}>
              <span>Sin datos</span>
              {[0,1,2,3].map(n => <div key={n} style={{ width:12, height:12, borderRadius:3, background:NIVEL_COLOR[n] }} />)}
              <span>Perfecto</span>
            </div>
          </div>

          {/* Días de la semana */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 4, paddingLeft: 0 }}>
            {DIAS_S.map(d => (
              <div key={d} style={{ width: 14, textAlign: 'center', fontSize: 8, color: '#9A9790', fontWeight: 600 }}>{d}</div>
            ))}
          </div>

          {/* Grid — filas = semanas, cols = días */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {semanas.map((semana, si) => (
              <div key={si} style={{ display: 'flex', gap: 3 }}>
                {semana.map((celda, di) => {
                  if (!celda) return <div key={di} style={{ width: 14, height: 14 }} />;
                  const esFuturo = celda.date > new Date();
                  return (
                    <div
                      key={di}
                      onMouseEnter={() => setTooltip(celda)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: esFuturo ? 'transparent' : NIVEL_COLOR[celda.nivel],
                        border: esFuturo ? 'none' : celda.nivel === 0 ? `1px solid ${C.light}` : 'none',
                        cursor: celda.log ? 'pointer' : 'default',
                        transition: 'transform 0.1s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.log && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 10, fontSize: 12, color: C.dark }}>
              <strong>{tooltip.fecha}</strong> — Energía: {tooltip.log.energia}/10 · Sueño: {tooltip.log.sueno}/10 · Estrés: {tooltip.log.estres}/10
              {tooltip.completados > 0 && ` · ${tooltip.completados} tareas completadas`}
            </div>
          )}

          {/* Leyenda meses */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {[...new Set(celdas.map(c => c.fecha.slice(0,7)))].map(mes => {
              const [y, m] = mes.split('-');
              return <span key={mes} style={{ fontSize: 9, color: '#9A9790' }}>{MESES[parseInt(m)-1]} {y}</span>;
            })}
          </div>
        </div>

        {/* ── GRÁFICAS TENDENCIA ── */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px', border: `1px solid ${C.light}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.dark }}>Tendencias del mes</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {MESES.map((m, i) => {
                const tienedatos = logs.some(l => new Date(l.fecha).getMonth() === i);
                if (!tienedatos) return null;
                return (
                  <button key={i} onClick={() => setMesActivo(i)} style={{ padding: '4px 10px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: font, fontSize: 10, fontWeight: 600, background: mesActivo === i ? C.orange : C.bg, color: mesActivo === i ? C.white : C.mid }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {logsFiltrados.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: C.mid }}>
              Necesitas al menos 2 check-ins en {MESES[mesActivo]} para ver la tendencia.
            </div>
          ) : (
            <>
              <Sparkline datos={logsFiltrados} campo="energia" color={C.green} label="⚡ Energía" />
              <Sparkline datos={logsFiltrados} campo="sueno" color="#5B6FA8" label="😴 Sueño" />
              <Sparkline datos={logsFiltrados} campo="estres" color={C.orange} label="🧠 Estrés" />

              {/* Resumen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
                {[
                  { label: 'Energía media', val: promedioEnergia, color: C.green },
                  { label: 'Sueño medio', val: promedioSueno, color: '#5B6FA8' },
                  { label: 'Días registrados', val: logsFiltrados.length, color: C.orange },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── HISTORIAL RECIENTE ── */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px', border: `1px solid ${C.light}` }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.dark, marginBottom: 16 }}>Últimos 7 registros</div>
          {logs.slice(-7).reverse().map((log, i) => {
            const fecha = new Date(log.fecha);
            const tasks = log.completed_tasks || {};
            const completados = Object.values(tasks).filter(Boolean).length;
            const total = Object.keys(tasks).length;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 6 ? `1px solid ${C.light}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                    {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  {total > 0 && (
                    <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>
                      {completados}/{total} tareas completadas
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span>⚡ {log.energia}/10</span>
                  <span>😴 {log.sueno}/10</span>
                  <span>🧠 {log.estres}/10</span>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: C.mid }}>
              Aún no hay registros. Completa tu primer check-in en el Dashboard.
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/dashboard" style={{ display: 'inline-block', background: C.green, color: C.white, padding: '12px 28px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Ir al Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}