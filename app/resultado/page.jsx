"use client";

import { useState, useEffect, useRef } from "react";

// ─── Paleta corporativa ────────────────────────────────────────────
const C = {
  bg: "#F7F4EE",
  green: "#5B9B3C",
  orange: "#E8621A",
  white: "#FFFFFF",
  dark: "#1A1A1A",
  mid: "#6B6B6B",
  light: "#E8E4DC",
};

// ─── Datos mock — luego vendrán de Supabase/query params ──────────
const MOCK = {
  nombre: "Carlos",
  edadReal: 38,
  edadMetabolica: 31,
  icm: 72,
  fecha: "6 de abril, 2025",
  bloques: [
    { nombre: "Composición corporal", score: 78, icono: "⚖️" },
    { nombre: "Actividad física", score: 65, icono: "🏃" },
    { nombre: "Nutrición", score: 80, icono: "🥗" },
    { nombre: "Descanso", score: 58, icono: "😴" },
    { nombre: "Bienestar mental", score: 70, icono: "🧠" },
  ],
  recomendaciones: [
    {
      titulo: "Mejora tu descanso",
      descripcion: "Dormir 7-8h reduce la inflamación sistémica y mejora la sensibilidad a la insulina.",
      impacto: "+8 puntos ICM",
      icono: "🌙",
      color: C.green,
    },
    {
      titulo: "Añade fuerza 2x semana",
      descripcion: "El entrenamiento de resistencia es el mayor driver de metabolismo basal en adultos.",
      impacto: "+6 puntos ICM",
      icono: "💪",
      color: C.orange,
    },
    {
      titulo: "Reduce ultraprocesados",
      descripcion: "Eliminar un 30% de ultraprocesados mejora marcadores inflamatorios en 4 semanas.",
      impacto: "+5 puntos ICM",
      icono: "🥦",
      color: C.green,
    },
    {
      titulo: "Gestión del estrés",
      descripcion: "El cortisol crónico es el enemigo silencioso del metabolismo. 10min/día marcan diferencia.",
      impacto: "+4 puntos ICM",
      icono: "🧘",
      color: C.orange,
    },
  ],
  evolucion: [
    { mes: "Nov", icm: 61 },
    { mes: "Dic", icm: 64 },
    { mes: "Ene", icm: 67 },
    { mes: "Feb", icm: 69 },
    { mes: "Mar", icm: 72 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────
function getScoreLabel(score) {
  if (score >= 80) return { texto: "Excelente", color: C.green };
  if (score >= 65) return { texto: "Bien", color: "#7AB648" };
  if (score >= 50) return { texto: "Mejorable", color: C.orange };
  return { texto: "Crítico", color: "#C0392B" };
}

function getICMLabel(icm) {
  if (icm >= 80) return { texto: "Metabolismo óptimo", color: C.green };
  if (icm >= 65) return { texto: "Metabolismo saludable", color: "#7AB648" };
  if (icm >= 50) return { texto: "Metabolismo en riesgo", color: C.orange };
  return { texto: "Metabolismo bajo", color: "#C0392B" };
}

// ─── Componente: ICM Gauge ─────────────────────────────────────────
function ICMGauge({ icm, animated }) {
  const radius = 80;
  const stroke = 14;
  const norm = radius - stroke / 2;
  const circ = Math.PI * norm; // semicírculo
  const offset = circ - (icm / 100) * circ;
  const label = getICMLabel(icm);

  // colores del arco según valor
  const arcColor =
    icm >= 80 ? C.green : icm >= 65 ? "#7AB648" : icm >= 50 ? C.orange : "#C0392B";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={220} height={130} viewBox="0 0 220 130">
        {/* Track */}
        <path
          d={`M ${stroke / 2 + 10} 110 A ${norm} ${norm} 0 0 1 ${210 - stroke / 2} 110`}
          fill="none"
          stroke={C.light}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Arc animado */}
        <path
          d={`M ${stroke / 2 + 10} 110 A ${norm} ${norm} 0 0 1 ${210 - stroke / 2} 110`}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animated ? offset : circ}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        {/* Valor central */}
        <text x="110" y="95" textAnchor="middle" fontSize="42" fontWeight="800"
          fontFamily="Trebuchet MS, Verdana, sans-serif" fill={C.dark}>
          {icm}
        </text>
        <text x="110" y="115" textAnchor="middle" fontSize="13" fill={C.mid}
          fontFamily="Trebuchet MS, Verdana, sans-serif">
          / 100
        </text>
        {/* Etiquetas 0 y 100 */}
        <text x="14" y="124" fontSize="11" fill={C.mid} fontFamily="Trebuchet MS, Verdana, sans-serif">0</text>
        <text x="196" y="124" fontSize="11" fill={C.mid} fontFamily="Trebuchet MS, Verdana, sans-serif">100</text>
      </svg>
      <span style={{
        background: label.color, color: "#fff", borderRadius: 20,
        padding: "4px 16px", fontSize: 13, fontWeight: 700,
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
      }}>
        {label.texto}
      </span>
    </div>
  );
}

// ─── Componente: Score Bar ─────────────────────────────────────────
function ScoreBar({ score, color, animated }) {
  return (
    <div style={{ height: 10, background: C.light, borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: animated ? `${score}%` : "0%",
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        borderRadius: 99,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ─── Componente: Mini Chart (SVG inline) ──────────────────────────
function MiniChart({ data }) {
  const W = 520, H = 160, pad = { top: 20, right: 20, bottom: 40, left: 40 };
  const xs = data.map((_, i) => pad.left + (i / (data.length - 1)) * (W - pad.left - pad.right));
  const minV = Math.min(...data.map((d) => d.icm)) - 5;
  const maxV = Math.max(...data.map((d) => d.icm)) + 5;
  const ys = data.map((d) => pad.top + (1 - (d.icm - minV) / (maxV - minV)) * (H - pad.top - pad.bottom));
  const poly = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const area = `${xs[0]},${H - pad.bottom} ` + poly + ` ${xs[xs.length - 1]},${H - pad.bottom}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={poly} fill="none" stroke={C.green} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={5} fill={C.green} />
          <text x={xs[i]} y={ys[i] - 12} textAnchor="middle" fontSize="12" fontWeight="700"
            fill={C.dark} fontFamily="Trebuchet MS, Verdana, sans-serif">{d.icm}</text>
          <text x={xs[i]} y={H - pad.bottom + 18} textAnchor="middle" fontSize="12"
            fill={C.mid} fontFamily="Trebuchet MS, Verdana, sans-serif">{d.mes}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────
export default function ResultadoPage() {
  const [animated, setAnimated] = useState(false);
  const data = MOCK;
  const icmLabel = getICMLabel(data.icm);
  const edadDiff = data.edadReal - data.edadMetabolica;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const sectionStyle = (bg) => ({
    background: bg,
    borderRadius: 20,
    padding: "32px 28px",
    marginBottom: 20,
  });

  const base = {
    fontFamily: "Trebuchet MS, Verdana, Geneva, sans-serif",
    color: C.dark,
  };

  return (
    <div style={{ ...base, background: C.bg, minHeight: "100vh" }}>
      {/* ── NAV ── */}
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.light}`,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: C.green }}>
          🌿 testmetabólico
        </span>
        <span style={{ fontSize: 12, color: C.mid }}>{data.fecha}</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── HERO ── */}
        <div style={{
          ...sectionStyle(C.green),
          color: C.white,
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, opacity: 0.85 }}>
            Hola, <strong>{data.nombre}</strong> — aquí están tus resultados
          </p>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>
            Tu edad metabólica es
          </h1>
          <div style={{
            fontSize: 96, fontWeight: 900, lineHeight: 1,
            color: C.white, textShadow: "0 4px 20px rgba(0,0,0,0.15)",
            margin: "8px 0",
          }}>
            {data.edadMetabolica}
          </div>
          <p style={{ margin: "0 0 20px", fontSize: 16, opacity: 0.9 }}>
            años — <strong>{edadDiff} años menos</strong> que tu edad real ({data.edadReal})
          </p>

          {/* Gauge */}
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 16,
            padding: "20px 16px 8px", display: "inline-block",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1 }}>
              Índice de Capital Metabólico
            </p>
            <ICMGauge icm={data.icm} animated={animated} />
          </div>
        </div>

        {/* ── SCORES 5 BLOQUES ── */}
        <div style={sectionStyle(C.white)}>
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>
            Tus 5 áreas metabólicas
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {data.bloques.map((b, i) => {
              const lbl = getScoreLabel(b.score);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {b.icono} {b.nombre}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        background: lbl.color, color: "#fff",
                        borderRadius: 12, padding: "2px 10px",
                        fontSize: 11, fontWeight: 700,
                      }}>{lbl.texto}</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: lbl.color }}>{b.score}</span>
                    </div>
                  </div>
                  <ScoreBar score={b.score} color={lbl.color} animated={animated} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── INTERPRETACIÓN IA ── */}
        <div style={{ ...sectionStyle(C.orange), color: C.white }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800 }}>
            🔍 Qué significa esto para ti
          </h2>
          <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.65, opacity: 0.95 }}>
            Tu metabolismo está funcionando <strong>7 años por delante de tu edad cronológica</strong>. 
            Eso te sitúa en el <strong>top 15%</strong> de personas de tu edad y sexo.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, opacity: 0.95 }}>
            Tus mayores oportunidades están en <strong>descanso</strong> y <strong>actividad física</strong>. 
            Con mejoras moderadas en estas dos áreas, podrías alcanzar un ICM de <strong>85+</strong> 
            en los próximos 3 meses.
          </p>
          <div style={{
            marginTop: 16,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, opacity: 0.9,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✨</span>
            <span>Interpretación personalizada con IA disponible próximamente</span>
          </div>
        </div>

        {/* ── RECOMENDACIONES ── */}
        <div style={sectionStyle(C.white)}>
          <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 800 }}>
            🎯 Tus 4 palancas de mejora
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.recomendaciones.map((r, i) => (
              <div key={i} style={{
                border: `2px solid ${r.color}22`,
                borderLeft: `5px solid ${r.color}`,
                borderRadius: 12,
                padding: "16px",
                background: `${r.color}06`,
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{r.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{r.titulo}</span>
                    <span style={{
                      background: r.color, color: "#fff",
                      borderRadius: 10, padding: "2px 10px",
                      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8,
                    }}>{r.impacto}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.55 }}>
                    {r.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── GRÁFICO EVOLUCIÓN ── */}
        <div style={sectionStyle(C.white)}>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
            📈 Tu evolución ICM
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: C.mid }}>
            Últimos 5 meses · Tendencia positiva
          </p>
          <div style={{ overflowX: "auto" }}>
            <MiniChart data={data.evolucion} />
          </div>
          <div style={{
            marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap",
          }}>
            <Stat label="Primer test" value="61" />
            <Stat label="Hoy" value={String(data.icm)} highlight />
            <Stat label="Mejora total" value="+11 pts" />
          </div>
        </div>

        {/* ── PRÓXIMOS PASOS ── */}
        <div style={{ ...sectionStyle(C.bg), border: `2px solid ${C.light}` }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
            🗺️ ¿Qué puedes hacer ahora?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { paso: "1", texto: "Repite el test en 4 semanas para ver tu progreso real", icon: "🔄" },
              { paso: "2", texto: "Trabaja una palanca a la vez — empieza por el descanso", icon: "🌙" },
              { paso: "3", texto: "Consulta con una profesional para un plan personalizado", icon: "👩‍⚕️" },
            ].map((s) => (
              <div key={s.paso} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{
                  background: C.green, color: "#fff", borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>{s.paso}</span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, paddingTop: 4 }}>
                  {s.icon} {s.texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA NUTRICIONISTA ── */}
        <div style={{
          ...sectionStyle(C.dark),
          color: C.white,
          textAlign: "center",
        }}>
          <span style={{
            fontSize: 36, display: "block", marginBottom: 12,
          }}>👩‍⚕️</span>
          <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900 }}>
            ¿Quieres un plan personalizado?
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
            Laura García, nutricionista clínica, trabaja con tu ICM para diseñar 
            una hoja de ruta metabólica realista y sostenible.
          </p>
          <a href="mailto:laura@testmetabolico.com" style={{
            display: "inline-block",
            background: C.orange, color: C.white,
            borderRadius: 12, padding: "14px 32px",
            fontWeight: 800, fontSize: 16,
            textDecoration: "none",
            transition: "transform 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Hablar con Laura →
          </a>
          <p style={{ margin: "16px 0 0", fontSize: 11, opacity: 0.5 }}>
            Primera consulta gratuita · Sin compromiso
          </p>
        </div>

        {/* ── CTA SUSCRIPCIÓN ── */}
        <div style={{
          ...sectionStyle(C.white),
          border: `2px solid ${C.green}`,
          textAlign: "center",
        }}>
          <div style={{
            background: C.green, color: "#fff",
            borderRadius: 20, padding: "3px 12px",
            fontSize: 11, fontWeight: 700, display: "inline-block",
            marginBottom: 12,
          }}>PRÓXIMAMENTE</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>
            📊 Seguimiento mensual
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: C.mid, lineHeight: 1.55 }}>
            Recibe tu test mensual, alertas de cambio y acceso al dashboard 
            con toda tu evolución. <strong>9,90€/mes.</strong>
          </p>
          <button style={{
            background: C.green, color: "#fff",
            borderRadius: 10, padding: "12px 28px",
            fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer",
          }}>
            Quiero seguimiento → 
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: C.mid }}>
            Cancela cuando quieras
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Mini stat card ────────────────────────────────────────────────
function Stat({ label, value, highlight }) {
  return (
    <div style={{
      flex: 1, minWidth: 80,
      background: highlight ? C.green : C.bg,
      borderRadius: 10, padding: "10px 14px", textAlign: "center",
    }}>
      <div style={{
        fontWeight: 900, fontSize: 22,
        color: highlight ? C.white : C.dark,
      }}>{value}</div>
      <div style={{
        fontSize: 11, color: highlight ? "rgba(255,255,255,0.8)" : C.mid,
        marginTop: 2,
      }}>{label}</div>
    </div>
  );
}
