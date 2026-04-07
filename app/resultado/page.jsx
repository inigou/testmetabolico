"use client";

import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#F7F4EE",
  green: "#5B9B3C",
  orange: "#E8621A",
  white: "#FFFFFF",
  dark: "#1A1A1A",
  mid: "#6B6B6B",
  light: "#E8E4DC",
  greenLight: "#EAF3DE",
  greenPale: "#EBF5E4",
  orangePale: "#FDF0E8",
};

const font = "'Trebuchet MS', Verdana, Geneva, sans-serif";

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
    { titulo: "Mejora tu descanso", descripcion: "Dormir 7-8h reduce la inflamación sistémica y mejora la sensibilidad a la insulina.", impacto: "+8 pts ICM", icono: "🌙", color: "#3B6D11" },
    { titulo: "Añade fuerza 2x semana", descripcion: "El entrenamiento de resistencia es el mayor driver de metabolismo basal en adultos.", impacto: "+6 pts ICM", icono: "💪", color: "#C05010" },
    { titulo: "Reduce ultraprocesados", descripcion: "Eliminar un 30% de ultraprocesados mejora marcadores inflamatorios en 4 semanas.", impacto: "+5 pts ICM", icono: "🥦", color: "#3B6D11" },
    { titulo: "Gestión del estrés", descripcion: "El cortisol crónico es el enemigo silencioso del metabolismo. 10min/día marcan diferencia.", impacto: "+4 pts ICM", icono: "🧘", color: "#C05010" },
  ],
  evolucion: [
    { mes: "Nov", icm: 61 },
    { mes: "Dic", icm: 64 },
    { mes: "Ene", icm: 67 },
    { mes: "Feb", icm: 69 },
    { mes: "Mar", icm: 72 },
  ],
};

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

function ScoreBar({ score, color, animated }) {
  return (
    <div style={{ height: 10, background: "rgba(255,255,255,0.3)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: animated ? `${score}%` : "0%",
        background: color,
        borderRadius: 99,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

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
          <stop offset="0%" stopColor={C.white} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.white} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={poly} fill="none" stroke={C.white} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={5} fill={C.white} />
          <text x={xs[i]} y={ys[i] - 12} textAnchor="middle" fontSize="12" fontWeight="700"
            fill={C.white} fontFamily={font}>{d.icm}</text>
          <text x={xs[i]} y={H - pad.bottom + 18} textAnchor="middle" fontSize="12"
            fill="rgba(255,255,255,0.7)" fontFamily={font}>{d.mes}</text>
        </g>
      ))}
    </svg>
  );
}

export default function ResultadoPage() {
  const [animated, setAnimated] = useState(false);
  const data = MOCK;
  const icmLabel = getICMLabel(data.icm);
  const edadDiff = data.edadReal - data.edadMetabolica;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", color: C.dark }}>

      {/* NAV */}
      <nav style={{
        background: C.green, padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>
          🌿 my<span style={{ color: C.greenLight }}>metaboliq</span>
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{data.fecha}</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* BANNER PRINCIPAL — fondo naranja */}
        <div style={{
          background: C.orange, borderRadius: 20, padding: "32px 28px",
          marginBottom: 16, color: C.white, textAlign: "center",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 14, opacity: 0.85 }}>
            Hola, <strong>{data.nombre}</strong> — aquí están tus resultados
          </p>

          {/* Ages */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, margin: "20px 0" }}>
            <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 14, padding: "16px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Edad real</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 52, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>{data.edadReal}</div>
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>→</div>
            <div style={{ background: C.white, borderRadius: 14, padding: "16px 24px", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 10, color: C.orange, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>Edad metabólica</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 72, color: C.orange, lineHeight: 1 }}>{data.edadMetabolica}</div>
              <div style={{ display: "inline-block", background: C.greenPale, border: "1px solid #C8E8B0", color: "#3B6D11", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 100, marginTop: 8 }}>
                −{edadDiff} años ↑
              </div>
            </div>
          </div>

          {/* ICM */}
          <div style={{ background: C.white, borderRadius: 14, padding: "18px", marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#9A9790", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>ICM · Índice de Calidad Metabólica</div>
                <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{icmLabel.texto}</div>
              </div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 40, color: C.dark, lineHeight: 1 }}>
                {data.icm}<span style={{ fontSize: 16, color: "#9A9790" }}>/100</span>
              </div>
            </div>
            <div style={{ height: 8, background: "#F0EBE3", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: animated ? `${data.icm}%` : "0%", background: `linear-gradient(90deg,${C.green},${C.orange})`, borderRadius: 100, transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#C0B8B0", marginTop: 4 }}>
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>
        </div>

        {/* SCORES — fondo verde */}
        <div style={{ background: C.green, borderRadius: 20, padding: "28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: C.white }}>
            Tus 5 áreas metabólicas
          </h2>

          {/* Grid scores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 20 }}>
            {data.bloques.map((b, i) => {
              const best = b.score === Math.max(...data.bloques.map(x => x.score));
              const worst = b.score === Math.min(...data.bloques.map(x => x.score));
              return (
                <div key={i} style={{
                  background: best ? C.white : worst ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.15)",
                  borderRadius: 10, padding: "10px 6px", textAlign: "center",
                  border: worst ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}>
                  {best && <div style={{ fontSize: 8, color: C.green, fontWeight: 700, marginBottom: 2 }}>★ TOP</div>}
                  {worst && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 2 }}>↑ MEJORAR</div>}
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{b.icono}</div>
                  <div style={{ fontSize: 8, color: best ? C.mid : "rgba(255,255,255,0.7)", marginBottom: 2 }}>{b.nombre.split(" ")[0]}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 20, color: best ? C.orange : C.white, fontWeight: 700 }}>{b.score}</div>
                </div>
              );
            })}
          </div>

          {/* Barras detalle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.bloques.map((b, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.white }}>{b.icono} {b.nombre}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.white }}>{b.score}</span>
                </div>
                <ScoreBar score={b.score} color={C.white} animated={animated} />
              </div>
            ))}
          </div>
        </div>

        {/* INTERPRETACIÓN — fondo naranja pálido */}
        <div style={{ background: C.orangePale, border: "1px solid #F9CFA8", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 800, color: C.orange }}>
            🔍 Qué significa esto para ti
          </h2>
          <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.7, color: C.dark }}>
            Tu metabolismo está funcionando <strong>7 años por delante de tu edad cronológica</strong>.
            Eso te sitúa en el <strong>top 15%</strong> de personas de tu edad y sexo.
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: C.dark }}>
            Tus mayores oportunidades están en <strong>descanso</strong> y <strong>actividad física</strong>.
            Con mejoras moderadas en estas dos áreas, podrías alcanzar un ICM de <strong>85+</strong> en los próximos 3 meses.
          </p>
        </div>

        {/* RECOMENDACIONES — fondo crema */}
        <div style={{ background: C.bg, border: `1px solid ${C.light}`, borderRadius: 20, padding: "28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 800 }}>
            🎯 Tus 4 palancas de mejora
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.recomendaciones.map((r, i) => (
              <div key={i} style={{
                background: C.white,
                borderLeft: `4px solid ${i % 2 === 0 ? C.green : C.orange}`,
                borderRadius: 12, padding: "16px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{r.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{r.titulo}</span>
                    <span style={{
                      background: i % 2 === 0 ? C.greenPale : C.orangePale,
                      color: i % 2 === 0 ? "#3B6D11" : C.orange,
                      border: `1px solid ${i % 2 === 0 ? "#C8E8B0" : "#F9CFA8"}`,
                      borderRadius: 100, padding: "2px 10px",
                      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8,
                    }}>{r.impacto}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.55 }}>{r.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO EVOLUCIÓN — fondo verde */}
        <div style={{ background: C.green, borderRadius: 20, padding: "28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: C.white }}>
            📈 Tu evolución ICM
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            Últimos 5 meses · Tendencia positiva
          </p>
          <div style={{ overflowX: "auto" }}>
            <MiniChart data={data.evolucion} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {[
              { label: "Primer test", value: "61" },
              { label: "Hoy", value: String(data.icm), highlight: true },
              { label: "Mejora total", value: "+11 pts" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 80,
                background: s.highlight ? C.white : "rgba(255,255,255,0.15)",
                borderRadius: 10, padding: "10px 14px", textAlign: "center",
              }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: s.highlight ? C.orange : C.white }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.highlight ? C.mid : "rgba(255,255,255,0.7)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRÓXIMOS PASOS — fondo verde pálido */}
        <div style={{ background: C.greenPale, border: "1px solid #C8E8B0", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "#3B6D11" }}>
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
                  background: C.green, color: C.white, borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>{s.paso}</span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, paddingTop: 4, color: C.dark }}>
                  {s.icon} {s.texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA NUTRICIONISTA — fondo naranja */}
        <div style={{ background: C.orange, borderRadius: 20, padding: "32px 28px", marginBottom: 16, textAlign: "center", color: C.white }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>👩‍⚕️</span>
          <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900 }}>
            ¿Quieres un plan personalizado?
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>
            Rocío Fábregas, nutricionista clínica, trabaja con tu ICM para diseñar
            una hoja de ruta metabólica realista y sostenible.
          </p>
          <a href="mailto:tutestmetabolico@gmail.com" style={{
            display: "inline-block", background: C.white, color: C.orange,
            borderRadius: 100, padding: "14px 32px",
            fontWeight: 800, fontSize: 15, textDecoration: "none",
          }}>
            Hablar con Rocío →
          </a>
          <p style={{ margin: "14px 0 0", fontSize: 11, opacity: 0.6 }}>
            Primera consulta gratuita · Sin compromiso
          </p>
        </div>

        {/* CTA SUSCRIPCIÓN — fondo crema con borde verde */}
        <div style={{ background: C.white, border: `2px solid ${C.green}`, borderRadius: 20, padding: "28px", textAlign: "center" }}>
          <div style={{ background: C.green, color: C.white, borderRadius: 100, padding: "3px 14px", fontSize: 11, fontWeight: 700, display: "inline-block", marginBottom: 12 }}>
            PRÓXIMAMENTE
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>
            📊 Seguimiento mensual
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: C.mid, lineHeight: 1.55 }}>
            Recibe tu test mensual, alertas de cambio y acceso al dashboard
            con toda tu evolución. <strong>9,90€/mes.</strong>
          </p>
          <button style={{
            background: C.green, color: C.white,
            borderRadius: 100, padding: "12px 28px",
            fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer",
            fontFamily: font,
          }}>
            Quiero seguimiento →
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: C.mid }}>Cancela cuando quieras</p>
        </div>

      </div>
    </div>
  );
}