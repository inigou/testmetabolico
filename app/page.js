"use client";

import { useState, useEffect, useRef } from "react";

// ─── Paleta ────────────────────────────────────────────────────────
const C = {
  bg: "#F7F4EE",
  green: "#5B9B3C",
  orange: "#E8621A",
  white: "#FFFFFF",
  dark: "#1A1A1A",
  mid: "#6B6B6B",
  light: "#E8E4DC",
  greenLight: "#EAF3DE",
  orangeLight: "#FDF0E8",
};

const font = "'Trebuchet MS', Verdana, Geneva, sans-serif";

// ─── Animación de entrada ──────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Contador animado ──────────────────────────────────────────────
function Counter({ to, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Componente principal ──────────────────────────────────────────
export default function LandingPage() {

  const [menuOpen, setMenuOpen] = useState(false);
  const botRef = useRef(null);

  const scrollToBot = () => {
    botRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sec = (bg, extra = {}) => ({
    background: bg,
    padding: "72px 20px",
    ...extra,
  });

  const container = {
    maxWidth: 900,
    margin: "0 auto",
  };

  return (
    <div style={{ fontFamily: font, background: C.bg, color: C.dark, overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(247,244,238,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.light}`,
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          height: 64, display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: C.green, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>🌿</div>
            <span style={{ fontWeight: 900, fontSize: 18, color: C.dark }}>
              test<span style={{ color: C.green }}>metabólico</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={scrollToBot}
              style={{
                background: C.orange, color: C.white,
                border: "none", borderRadius: 10,
                padding: "10px 20px", fontWeight: 800,
                fontSize: 14, cursor: "pointer",
                fontFamily: font,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Hacer el test →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...sec(C.bg), padding: "100px 20px 80px", position: "relative", overflow: "hidden" }}>
        {/* Decoración fondo */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: C.greenLight, opacity: 0.6, zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -60,
          width: 250, height: 250, borderRadius: "50%",
          background: C.orangeLight, opacity: 0.5, zIndex: 0,
        }} />

        <div style={{ ...container, position: "relative", zIndex: 1, textAlign: "center" }}>
          <FadeIn>
            <div style={{
              display: "inline-block",
              background: C.greenLight,
              border: `1px solid ${C.green}44`,
              borderRadius: 20, padding: "6px 16px",
              fontSize: 13, color: C.green, fontWeight: 700,
              marginBottom: 24,
            }}>
              ✦ Test metabólico gratuito · 5 minutos
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 900, lineHeight: 1.1,
              margin: "0 0 24px",
              letterSpacing: "-1px",
            }}>
              Descubre cuántos años<br />
              tiene tu metabolismo<br />
              <span style={{ color: C.green }}>de verdad</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: C.mid, lineHeight: 1.65,
              maxWidth: 560, margin: "0 auto 40px",
            }}>
              Tu edad metabólica puede ser 10 años menor — o mayor — que tu edad real.
              El test ICM lo calcula en 5 minutos y te dice exactamente qué mejorar.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={scrollToBot}
                style={{
                  background: C.orange, color: C.white,
                  border: "none", borderRadius: 14,
                  padding: "18px 36px", fontWeight: 900,
                  fontSize: 18, cursor: "pointer",
                  fontFamily: font,
                  boxShadow: `0 8px 32px ${C.orange}44`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.04) translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 12px 40px ${C.orange}55`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 8px 32px ${C.orange}44`;
                }}
              >
                Calcular mi edad metabólica →
              </button>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: C.mid,
              }}>
                <span>✓ Gratis</span>
                <span>·</span>
                <span>✓ Sin registro</span>
                <span>·</span>
                <span>✓ Resultado inmediato</span>
              </div>
            </div>
          </FadeIn>

          {/* Preview resultado */}
          <FadeIn delay={0.4}>
            <div style={{
              marginTop: 60,
              background: C.white,
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              maxWidth: 480, margin: "60px auto 0",
              border: `1px solid ${C.light}`,
            }}>
              <p style={{ fontSize: 12, color: C.mid, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
                Ejemplo de resultado
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{
                  background: C.green, borderRadius: 16,
                  padding: "16px 20px", textAlign: "center", color: C.white,
                  minWidth: 100,
                }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Edad metabólica</div>
                  <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>31</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>años</div>
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, color: C.mid, marginBottom: 8 }}>ICM Global</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 8, background: C.light, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: "72%", height: "100%", background: C.green, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontWeight: 900, color: C.green }}>72</span>
                  </div>
                  <div style={{
                    display: "inline-block", background: C.greenLight,
                    color: C.green, borderRadius: 10, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700,
                  }}>Metabolismo saludable</div>
                  <div style={{ fontSize: 12, color: C.mid, marginTop: 8 }}>
                    7 años menos que tu edad real
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ ...sec(C.green), padding: "48px 20px" }}>
        <div style={{
          ...container,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 32, textAlign: "center",
        }}>
          {[
            { num: 73, suffix: "%", label: "de adultos tiene metabolismo por debajo de su potencial" },
            { num: 5, suffix: " min", label: "es todo lo que necesitas para conocer tu ICM" },
            { num: 8, suffix: " sem", label: "para ver cambios reales con las palancas correctas" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{ color: C.white }}>
                <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
                  <Counter to={s.num} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, lineHeight: 1.5 }}>
                  {s.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={sec(C.bg)}>
        <div style={container}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: 16 }}>
                Tu cuerpo envejece a su ritmo.<br />
                <span style={{ color: C.orange }}>No al tuyo.</span>
              </h2>
              <p style={{ fontSize: 17, color: C.mid, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
                Puedes tener 35 años y un metabolismo de 50. O 50 años y funcionar como a los 38.
                La diferencia no es genética — es lo que haces con 5 palancas concretas.
              </p>
            </div>
          </FadeIn>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}>
            {[
              { icon: "⚖️", titulo: "Composición corporal", desc: "La relación músculo-grasa dice más de tu metabolismo que el peso en la báscula." },
              { icon: "🏃", titulo: "Actividad física", desc: "No solo quemar calorías. El movimiento regula hormonas, insulina y energía celular." },
              { icon: "🥗", titulo: "Nutrición", desc: "Qué comes importa. Cuándo comes también. Los ultraprocesados envejecen el metabolismo." },
              { icon: "😴", titulo: "Descanso", desc: "Dormir mal durante 2 semanas equivale metabólicamente a 5 años de envejecimiento." },
              { icon: "🧠", titulo: "Bienestar mental", desc: "El cortisol crónico del estrés es el mayor saboteador silencioso del metabolismo." },
            ].map((b, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{
                  background: C.white,
                  borderRadius: 16, padding: "24px 20px",
                  border: `1px solid ${C.light}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{b.titulo}</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={{ ...sec(C.orange), padding: "72px 20px" }}>
        <div style={container}>
          <FadeIn>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900,
              color: C.white, textAlign: "center", marginBottom: 48,
            }}>
              3 pasos. 5 minutos.
            </h2>
          </FadeIn>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}>
            {[
              {
                num: "01",
                titulo: "Responde el test",
                desc: "Nuestro bot te hace preguntas sobre tus hábitos en los 5 bloques metabólicos. Sin jerga médica.",
              },
              {
                num: "02",
                titulo: "Calculamos tu ICM",
                desc: "El algoritmo calcula tu Índice de Capital Metabólico y tu edad metabólica real en segundos.",
              },
              {
                num: "03",
                titulo: "Recibes tu resultado",
                desc: "Un informe visual con tu ICM, puntos por bloque, y las palancas exactas que moverán tu metabolismo.",
              },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 16, padding: "28px 22px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}>
                  <div style={{
                    fontSize: 40, fontWeight: 900,
                    color: "rgba(255,255,255,0.25)",
                    lineHeight: 1, marginBottom: 12,
                  }}>{s.num}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 10 }}>
                    {s.titulo}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}>
                    {s.desc}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <button
                onClick={scrollToBot}
                style={{
                  background: C.white, color: C.orange,
                  border: "none", borderRadius: 14,
                  padding: "16px 36px", fontWeight: 900,
                  fontSize: 17, cursor: "pointer", fontFamily: font,
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Empezar ahora — es gratis →
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ROCÍO ── */}
      <section style={sec(C.bg)}>
        <div style={{ ...container, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <FadeIn>
            <div style={{
              background: C.greenLight,
              borderRadius: 20, padding: "40px 32px",
              border: `1px solid ${C.green}33`,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: C.green, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 20,
                color: C.white, fontWeight: 900,
              }}>RF</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Rocío Fábregas</div>
              <div style={{ fontSize: 14, color: C.green, fontWeight: 700, marginBottom: 16 }}>
                Nutricionista clínica · Especialista en metabolismo
              </div>
              <p style={{ fontSize: 15, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
                "El ICM no es solo un número. Es un mapa. Trabajo con cada paciente para convertir 
                ese mapa en un plan real, sostenible y adaptado a su vida."
              </p>
              <a href="mailto:rocio@testmetabolico.com" style={{
                display: "inline-block",
                background: C.green, color: C.white,
                borderRadius: 10, padding: "12px 24px",
                fontWeight: 800, fontSize: 14,
                textDecoration: "none",
                transition: "transform 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Consulta gratuita con Rocío →
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 900, marginBottom: 20, lineHeight: 1.2 }}>
                Tu resultado tiene más valor con una 
                <span style={{ color: C.green }}> experta detrás</span>
              </h2>
              <p style={{ fontSize: 16, color: C.mid, lineHeight: 1.7, marginBottom: 24 }}>
                El test ICM te da el diagnóstico. Rocío te da el plan. 
                Juntos, el resultado pasa de ser un número interesante a una hoja de ruta real.
              </p>
              {[
                "Interpretación personalizada de tu ICM",
                "Plan nutricional adaptado a tus palancas",
                "Seguimiento mensual de tu evolución",
                "Sin dietas genéricas, sin soluciones mágicas",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: C.greenLight, border: `2px solid ${C.green}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: C.green, flexShrink: 0, marginTop: 1,
                  }}>✓</div>
                  <span style={{ fontSize: 15, color: C.dark }}>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── URGENCIA / SOCIAL PROOF ── */}
      <section style={{ ...sec(C.dark), padding: "56px 20px" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <FadeIn>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 900, color: C.white, marginBottom: 16 }}>
              ¿Cuándo fue la última vez que<br />
              <span style={{ color: C.orange }}>entendiste tu metabolismo de verdad?</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
              La mayoría espera a tener un problema para investigar. 
              Los que actúan antes son los que llegan a los 50 con energía de 35.
            </p>
            <button
              onClick={scrollToBot}
              style={{
                background: C.orange, color: C.white,
                border: "none", borderRadius: 14,
                padding: "18px 40px", fontWeight: 900,
                fontSize: 18, cursor: "pointer", fontFamily: font,
                boxShadow: `0 8px 32px ${C.orange}44`,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Quiero saber mi edad metabólica →
            </button>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
              Gratis · Sin tarjeta · Resultado en tu email
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── BOT EMBEBIDO ── */}
      <section ref={botRef} style={{ ...sec(C.bg), padding: "80px 20px" }}>
        <div style={container}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-block",
                background: C.orangeLight,
                border: `1px solid ${C.orange}44`,
                borderRadius: 20, padding: "6px 16px",
                fontSize: 13, color: C.orange, fontWeight: 700,
                marginBottom: 16,
              }}>
                🚀 Empieza aquí
              </div>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, marginBottom: 16 }}>
                Calcula tu ICM ahora
              </h2>
              <p style={{ fontSize: 16, color: C.mid, maxWidth: 460, margin: "0 auto" }}>
                Responde las preguntas del asistente. En 5 minutos recibirás tu informe completo en tu email.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div style={{
              background: C.white,
              borderRadius: 24,
              overflow: "hidden",
              border: `1px solid ${C.light}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              maxWidth: 700, margin: "0 auto",
            }}>
              {/* Header del bot */}
              <div style={{
                background: C.green, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20,
                }}>🌿</div>
                <div>
                  <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>
                    Asistente metabólico
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                    Test ICM · ~5 minutos
                  </div>
                </div>
                <div style={{
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#7FE87F",
                    boxShadow: "0 0 6px #7FE87F",
                  }} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>En línea</span>
                </div>
              </div>

              {/* iframe del bot */}
              <div style={{ height: 600, position: "relative" }}>
                <iframe
                  src="/bot"
                  style={{
                    width: "100%", height: "100%",
                    border: "none",
                  }}
                  title="Test metabólico ICM"
                />
              </div>
            </div>
          </FadeIn>

          {/* Trust signals debajo del bot */}
          <FadeIn delay={0.2}>
            <div style={{
              display: "flex", gap: 24, justifyContent: "center",
              flexWrap: "wrap", marginTop: 32,
            }}>
              {[
                { icon: "🔒", text: "Tus datos son privados y no se comparten" },
                { icon: "✉️", text: "Resultado en tu email en segundos" },
                { icon: "🆓", text: "100% gratuito, sin compromisos" },
              ].map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, color: C.mid,
                }}>
                  <span>{t.icon}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...sec(C.white), padding: "72px 20px" }}>
        <div style={{ ...container, maxWidth: 640 }}>
          <FadeIn>
            <h2 style={{ fontSize: 32, fontWeight: 900, textAlign: "center", marginBottom: 40 }}>
              Preguntas frecuentes
            </h2>
          </FadeIn>
          {[
            {
              q: "¿Qué es el Índice de Capital Metabólico (ICM)?",
              a: "Es una puntuación de 0 a 100 que refleja la salud global de tu metabolismo evaluando 5 bloques: composición corporal, actividad física, nutrición, descanso y bienestar mental.",
            },
            {
              q: "¿En cuánto tiempo veo resultados si aplico las recomendaciones?",
              a: "La mayoría de personas nota cambios en energía y bienestar en 2-3 semanas. Los cambios en el ICM son medibles en 4-6 semanas con constancia.",
            },
            {
              q: "¿Necesito datos médicos o análisis de sangre?",
              a: "No. El test se basa en hábitos y percepción personal. No sustituye a un diagnóstico médico, pero sí te da un mapa muy preciso de dónde actuar.",
            },
            {
              q: "¿Para qué sirve la consulta con Rocío?",
              a: "Para convertir tu resultado en un plan concreto. Rocío interpreta tu ICM en detalle y diseña una estrategia nutricional adaptada a tus palancas específicas.",
            },
          ].map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: C.dark, padding: "40px 20px",
        textAlign: "center",
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 12 }}>
            🌿 testmetabólico
          </div>
          <div>© 2025 testmetabolico.com · Todos los derechos reservados</div>
          <div style={{ marginTop: 8 }}>
            El test ICM es orientativo y no sustituye el diagnóstico médico profesional.
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 20, justifyContent: "center" }}>
            <a href="/privacidad" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
              Política de privacidad
            </a>
            <a href="/cookies" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
              Cookies
            </a>
            <a href="mailto:hola@testmetabolico.com" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── FAQ Item (acordeón) ───────────────────────────────────────────
function FaqItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={delay}>
      <div style={{
        border: `1px solid ${C.light}`,
        borderRadius: 12, marginBottom: 12,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        boxShadow: open ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "100%", textAlign: "left",
            background: open ? C.greenLight : C.white,
            border: "none", padding: "18px 20px",
            fontFamily: font, fontWeight: 700, fontSize: 15,
            cursor: "pointer", color: C.dark,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            transition: "background 0.2s",
          }}
        >
          {q}
          <span style={{
            fontSize: 20, color: C.green,
            transform: open ? "rotate(45deg)" : "rotate(0)",
            transition: "transform 0.2s",
            flexShrink: 0, marginLeft: 12,
          }}>+</span>
        </button>
        {open && (
          <div style={{
            padding: "0 20px 18px",
            fontSize: 14, color: C.mid, lineHeight: 1.7,
            background: C.white,
          }}>
            {a}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
