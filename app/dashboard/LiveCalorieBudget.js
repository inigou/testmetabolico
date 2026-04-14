'use client';

// ─────────────────────────────────────────────────────────────────────────────
// LiveCalorieBudget — Marcador Metabólico Vivo
//
// Mecánica "ataca-defiende":
//   · Comidas ✓  → llenan la barra (ingesta sube)
//   · Entreno ✓  → vacía un bloque morado de la barra (crea espacio visual)
//   · Quick Add  → segmento rojo tomate
//
// Props:
//   presupuesto       {number}  kcal objetivo del día (desde plantilla base)
//   segmentos         {array}   [{ tipo, kcal, completado }] — uno por tarea del día
//   modoRescate       {boolean} si hay protocolo de evento activo
// ─────────────────────────────────────────────────────────────────────────────

// Colores por tipo de tarea
const COLOR_SEGMENTO = {
  desayuno:  '#ADD8E6', // azul claro
  comida:    '#90EE90', // verde lima
  cena:      '#FFA500', // naranja
  snack:     '#FFB6C1', // rosa claro
  entreno:   '#9B59B6', // morado (gasto — vacía)
  quickadd:  '#FF6347', // rojo tomate (extras)
};

const LABEL_SEGMENTO = {
  desayuno: 'Desayuno',
  comida:   'Comida',
  cena:     'Cena',
  snack:    'Snack',
  entreno:  'Entreno',
  quickadd: 'Extra',
};

const EMOJI_SEGMENTO = {
  desayuno: '🌅',
  comida:   '☀️',
  cena:     '🌙',
  snack:    '🍎',
  entreno:  '🏋️',
  quickadd: '⚡',
};

// ── Motor de haiku local — 0ms de latencia ────────────────────────────────
const COPYS = {
  rescate: [
    'Protocolo de recuperación. Hidratación máxima y a seguir el plan de hoy.',
  ],
  vacio: [
    'El día es tuyo. Recuerda priorizar la proteína en esta primera comida.',
    'Motor arrancando. Tienes todo el presupuesto intacto.',
  ],
  entreno_hecho: [
    '¡Boom! Entreno completado. Acabas de ganar un margen calórico extra.',
    'Ese esfuerzo físico te da oxígeno. Disfruta de la siguiente comida.',
  ],
  mitad: [
    'Ritmo perfecto. Estás clavando los macros de hoy.',
    'Energía estable. Sigues en el camino hacia el 118%.',
  ],
  limite: [
    '⚠️ Cerca del límite. Prioriza verduras y agua para saciarte.',
    'Ojo, margen ajustado. Un pequeño paseo extra te daría más espacio.',
  ],
  exceso: [
    'Has superado el límite. No pasa nada, mañana ajustaremos. ¡Cero culpas!',
  ],
};

// Elige frase según estado — determinístico (no aleatorio) para evitar re-renders
function elegirHaiku(pctConsumo, entrenoHecho, modoRescate) {
  if (modoRescate)      return COPYS.rescate[0];
  if (pctConsumo > 100) return COPYS.exceso[0];
  if (pctConsumo > 85)  return COPYS.limite[pctConsumo > 92 ? 0 : 1];
  if (entrenoHecho)     return COPYS.entreno_hecho[pctConsumo > 40 ? 0 : 1];
  if (pctConsumo < 15)  return COPYS.vacio[pctConsumo < 5 ? 1 : 0];
  return COPYS.mitad[pctConsumo > 60 ? 0 : 1];
}

function haikusColor(pctConsumo, modoRescate) {
  if (modoRescate)      return { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' };
  if (pctConsumo > 100) return { bg: '#FFEBEE', color: '#C62828', border: '#FFCDD2' };
  if (pctConsumo > 85)  return { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' };
  return { bg: '#E8F5E9', color: '#2E7D32', border: '#C8E8B0' };
}

const font = 'Trebuchet MS, Verdana, sans-serif';
const C = {
  bg: '#F7F4EE', white: '#FFFFFF', dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  green: '#5B9B3C', orange: '#E8621A', greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};

export default function LiveCalorieBudget({ presupuesto = 0, segmentos = [], modoRescate = false }) {

  // ── Calcular totales ────────────────────────────────────────────────────
  const ingestaHoy = segmentos
    .filter(s => s.completado && s.tipo !== 'entreno')
    .reduce((acc, s) => acc + (s.kcal || 0), 0);

  const gastoEntreno = segmentos
    .filter(s => s.completado && s.tipo === 'entreno')
    .reduce((acc, s) => acc + (s.kcal || 0), 0);

  const entrenoHecho = gastoEntreno > 0;

  // Presupuesto efectivo = presupuesto base - gasto entreno (el entreno "crea espacio")
  const presupuestoEfectivo = presupuesto + gastoEntreno;

  // Ingesta neta = ingesta - gasto entreno (el entreno "vacía" la barra)
  const ingestaNeta = Math.max(0, ingestaHoy - gastoEntreno);

  const balance = presupuesto > 0 ? presupuesto - ingestaHoy + gastoEntreno : 0;
  const pctConsumo = presupuesto > 0
    ? Math.round((ingestaHoy / presupuestoEfectivo) * 100)
    : 0;

  const haiku = elegirHaiku(pctConsumo, entrenoHecho, modoRescate);
  const haikuStyle = haikusColor(pctConsumo, modoRescate);

  // Sin presupuesto configurado
  if (presupuesto === 0) {
    return (
      <div style={{ background: C.white, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>
          Configura tu <strong>Plantilla Base</strong> en <strong>⚙️</strong> para activar el marcador calórico en vivo
        </div>
      </div>
    );
  }

  // ── Construir segmentos de la barra ─────────────────────────────────────
  // Orden visual: desayuno → comida → cena → snack → quickadd → [morado entreno al final]
  const ORDEN = ['desayuno', 'comida', 'cena', 'snack', 'quickadd'];
  const segmentosActivos = ORDEN
    .map(tipo => {
      const seg = segmentos.find(s => s.tipo === tipo && s.completado);
      return seg ? { ...seg } : null;
    })
    .filter(Boolean);

  const totalBarraKcal = presupuestoEfectivo || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`
        @keyframes segmentoPop {
          0%   { transform: scaleX(0); opacity: 0; }
          60%  { transform: scaleX(1.04); }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes entrenoPop {
          0%   { transform: scaleX(0) translateX(100%); opacity: 0; }
          60%  { transform: scaleX(1.03) translateX(0); }
          100% { transform: scaleX(1) translateX(0); opacity: 1; }
        }
        @keyframes haikusFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(155,89,182,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(155,89,182,0); }
        }
      `}</style>

      {/* ── Tarjeta principal ─────────────────────────────────────────── */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, overflow: 'hidden' }}>

        {/* Fila de totales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', padding: '14px 16px', gap: 0 }}>
          {/* Ingesta */}
          <div style={{ textAlign: 'center', paddingRight: 8 }}>
            <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              🍎 Ingesta de hoy
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: ingestaHoy > presupuestoEfectivo ? '#C62828' : C.orange, lineHeight: 1, transition: 'color 0.3s' }}>
              {ingestaHoy}
            </div>
            <div style={{ fontSize: 8, color: C.mid, marginTop: 2 }}>kcal comidas</div>
          </div>

          <div style={{ background: C.light, width: 1 }} />

          {/* Gasto total */}
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              ⚡ Gasto estimado
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.green, lineHeight: 1 }}>
              {presupuestoEfectivo}
            </div>
            <div style={{ fontSize: 8, color: C.mid, marginTop: 2 }}>
              {gastoEntreno > 0 ? `BMR + ${gastoEntreno} entreno` : 'BMR + actividad base'}
            </div>
          </div>

          <div style={{ background: C.light, width: 1 }} />

          {/* Balance / resta */}
          <div style={{ textAlign: 'center', paddingLeft: 8 }}>
            <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              {balance >= 0 ? '✅ Margen libre' : '⚠️ Exceso'}
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: balance >= 0 ? C.green : '#C62828', lineHeight: 1, transition: 'all 0.4s' }}>
              {balance >= 0 ? balance : Math.abs(balance)}
            </div>
            <div style={{ fontSize: 8, color: balance >= 0 ? '#3B6D11' : '#C62828', marginTop: 2, fontWeight: 600 }}>
              {balance >= 0 ? 'kcal de margen' : 'kcal de más'}
            </div>
          </div>
        </div>

        {/* ── BARRA SEGMENTADA ────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 14px' }}>
          {/* Barra */}
          <div style={{ height: 18, background: '#F0EBE3', borderRadius: 100, overflow: 'hidden', display: 'flex', position: 'relative', marginBottom: 6 }}>
            {/* Segmentos de ingesta (izquierda → derecha) */}
            {segmentosActivos.map((seg, i) => {
              const pct = Math.min(100, (seg.kcal / totalBarraKcal) * 100);
              return (
                <div key={`${seg.tipo}-${i}`} style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: COLOR_SEGMENTO[seg.tipo] || C.orange,
                  borderRadius: i === 0 ? '100px 0 0 100px' : 0,
                  transformOrigin: 'left center',
                  animation: 'segmentoPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  transition: 'width 0.5s ease',
                  minWidth: pct > 0 ? 2 : 0,
                  flexShrink: 0,
                }} />
              );
            })}

            {/* Bloque morado del entreno — aparece al final y "vacía" visualmente */}
            {gastoEntreno > 0 && (
              <div style={{
                position: 'absolute',
                right: 0, top: 0, bottom: 0,
                width: `${Math.min(100, (gastoEntreno / totalBarraKcal) * 100)}%`,
                background: 'linear-gradient(90deg, rgba(155,89,182,0.15), rgba(155,89,182,0.7))',
                borderRadius: '0 100px 100px 0',
                borderLeft: '2px dashed rgba(155,89,182,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'entrenoPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, pulseGlow 2s ease-in-out infinite',
              }}>
                <span style={{ fontSize: 9, color: 'rgba(155,89,182,0.9)', fontWeight: 700 }}>−{gastoEntreno}</span>
              </div>
            )}
          </div>

          {/* Leyenda de segmentos activos */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {segmentosActivos.map((seg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLOR_SEGMENTO[seg.tipo], flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: C.mid }}>{EMOJI_SEGMENTO[seg.tipo]} {LABEL_SEGMENTO[seg.tipo]} {seg.kcal}kcal</span>
              </div>
            ))}
            {gastoEntreno > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#9B59B6', flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: '#9B59B6', fontWeight: 600 }}>🏋️ Entreno −{gastoEntreno}kcal</span>
              </div>
            )}
            {/* Marca de presupuesto */}
            <div style={{ marginLeft: 'auto', fontSize: 9, color: '#C0B8B0' }}>
              / {presupuestoEfectivo} kcal · {pctConsumo}%
            </div>
          </div>
        </div>
      </div>

      {/* ── HAIKU CONTEXTUAL ─────────────────────────────────────────── */}
      <div style={{
        background: haikuStyle.bg,
        border: `1px solid ${haikuStyle.border}`,
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        animation: 'haikusFade 0.3s ease',
        key: haiku, // fuerza re-render con animación al cambiar
      }}>
        <div style={{ flex: 1, fontSize: 12, color: haikuStyle.color, lineHeight: 1.55, fontStyle: 'italic' }}>
          {haiku}
        </div>
      </div>

      {/* ── Mini-stats de segmentos pendientes (si hay presupuesto y no todo completado) */}
      {presupuesto > 0 && segmentos.filter(s => !s.completado && s.tipo !== 'entreno').length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {segmentos.filter(s => !s.completado && s.tipo !== 'entreno').map((seg, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: C.white, border: `1px solid ${C.light}`,
              borderRadius: 100, padding: '4px 10px',
              opacity: 0.65,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR_SEGMENTO[seg.tipo] || C.mid, border: `1px solid ${C.light}` }} />
              <span style={{ fontSize: 9, color: C.mid }}>{EMOJI_SEGMENTO[seg.tipo]} {LABEL_SEGMENTO[seg.tipo]} ~{seg.kcal}kcal pendiente</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}