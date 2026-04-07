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
  orangeLight: "#FDF0E8",
  greenPale: "#EBF5E4",
  orangePale: "#FDF0E8",
};

const font = "'Trebuchet MS', Verdana, Geneva, sans-serif";

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

function FaqItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={delay}>
      <div style={{
        border: `1px solid ${C.light}`,
        borderRadius: 12, marginBottom: 12,
        overflow: "hidden",
        boxShadow: open ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "100%", textAlign: "left",
            background: open ? C.greenPale : C.white,
            border: "none", padding: "18px 20px",
            fontFamily: font, fontWeight: 700, fontSize: 15,
            cursor: "pointer", color: C.dark,
            display: "flex", justifyContent: "space-between", alignItems: "center",
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

export default function LandingPage() {
  const botRef = useRef(null);
  const scrollToBot = () => {
    botRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const container = { maxWidth: 900, margin: "0 auto" };

  return (
    <div style={{ fontFamily: font, background: C.bg, color: C.dark, overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: C.green,
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
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>🌿</div>
            <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>
              my<span style={{ color: C.greenLight }}>metaboliq</span>
            </span>
          </div>
          
          <a href="/dashboard" style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: 600,
            marginRight: 8,
          }}>
            Mi Espacio →
          </a>

          <button
            onClick={scrollToBot}
            style={{
              background: C.orange, color: C.white,
              border: "none", borderRadius: 100,
              padding: "10px 22px", fontWeight: 800,
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
      </nav>

      {/* ── HERO — fondo verde ── */}
      <section style={{ background: C.green, padding: "80px 20px 72px" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <FadeIn>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 100, padding: "5px 14px",
              fontSize: 12, color: C.white, fontWeight: 700,
              marginBottom: 24, letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.white }} />
              Test metabólico gratuito · 5 minutos
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 68px)",
              fontWeight: 900, lineHeight: 1.1,
              color: C.white,
              margin: "0 0 24px",
              letterSpacing: "-1px",
            }}>
              Descubre cuántos años<br />
              tiene tu metabolismo<br />
              <span style={{ color: C.greenLight, fontStyle: "italic" }}>de verdad</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "rgba(255,255,255,0.85)", lineHeight: 1.7,
              maxWidth: 520, margin: "0 auto 36px",
            }}>
              Tu edad metabólica puede ser 10 años menor — o mayor — que tu edad real.
              El test ICM lo calcula en 5 minutos y te dice exactamente qué mejorar.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <button
              onClick={scrollToBot}
              style={{
                background: C.orange, color: C.white,
                border: "none", borderRadius: 100,
                padding: "18px 40px", fontWeight: 900,
                fontSize: 17, cursor: "pointer",
                fontFamily: font,
                boxShadow: `0 8px 32px rgba(232,98,26,0.4)`,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Calcular mi edad metabólica →
            </button>
            <div style={{
              display: "flex", gap: 20, justifyContent: "center",
              marginTop: 16, flexWrap: "wrap",
            }}>
              {["✓ Gratis", "✓ Sin registro", "✓ Resultado inmediato"].map((t, i) => (
                <span key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── BOT — fondo crema, posición alta ── */}
      <section ref={botRef} style={{ background: C.bg, padding: "64px 20px" }}>
        <div style={container}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                display: "inline-block",
                background: C.orangePale,
                border: `1px solid ${C.orange}44`,
                borderRadius: 100, padding: "6px 16px",
                fontSize: 12, color: C.orange, fontWeight: 700,
                marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                🚀 Empieza aquí
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 900, marginBottom: 10 }}>
                Calcula tu ICM ahora
              </h2>
              <p style={{ fontSize: 15, color: C.mid, maxWidth: 420, margin: "0 auto" }}>
                Responde las preguntas del asistente. En 5 minutos recibirás tu informe completo.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{
              background: C.white, borderRadius: 24,
              overflow: "hidden",
              border: `1px solid ${C.light}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              maxWidth: 700, margin: "0 auto",
            }}>
              <div style={{
                background: C.orange, padding: "18px 24px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🌿</div>
                <div>
                  <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>Asistente metabólico</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Test ICM · ~5 minutos</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.greenLight }} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>En línea</span>
                </div>
              </div>
              <div style={{ height: 600 }}>
                <iframe src="/bot" style={{ width: "100%", height: "100%", border: "none" }} title="Test ICM" />
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {[
                { icon: "🔒", text: "Datos privados" },
                { icon: "✉️", text: "Resultado en tu email" },
                { icon: "🆓", text: "100% gratuito" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.mid }}>
                  <span>{t.icon}</span><span>{t.text}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── STATS — fondo naranja ── */}
      <section style={{ background: C.orange, padding: "56px 20px" }}>
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
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, lineHeight: 1.5 }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PREVIEW RESULTADO — fondo naranja ── */}
      <section style={{ background: C.orange, padding: "0 20px 64px" }}>
        <div style={{ ...container, maxWidth: 560 }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                Ejemplo de resultado
              </p>
            </div>

            {/* Ages */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 14, padding: "16px 20px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Edad real</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 44, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>38</div>
              </div>
              <div style={{ fontSize: 20, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>→</div>
              <div style={{ background: C.white, borderRadius: 14, padding: "16px 20px", textAlign: "center", flex: 1, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div style={{ fontSize: 9, color: C.orange, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>Edad metabólica</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 56, color: C.orange, lineHeight: 1 }}>33</div>
                <div style={{ display: "inline-block", background: C.greenPale, border: `1px solid #C8E8B0`, color: "#3B6D11", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, marginTop: 6 }}>−5 años ↑</div>
              </div>
            </div>

            {/* ICM bar */}
            <div style={{ background: C.white, borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#9A9790", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>ICM · Índice de Calidad Metabólica</div>
                  <div style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>Metabolismo activo</div>
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 36, color: C.dark, lineHeight: 1 }}>74<span style={{ fontSize: 14, color: "#9A9790" }}>/100</span></div>
              </div>
              <div style={{ height: 8, background: "#F0EBE3", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "74%", background: `linear-gradient(90deg,${C.green},${C.orange})`, borderRadius: 100 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#C0B8B0", marginTop: 4 }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            {/* Scores */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {[
                { icon: "⚡", label: "Actividad", val: 82, best: true },
                { icon: "🏋️", label: "Composición", val: 74 },
                { icon: "🥗", label: "Nutrición", val: 69 },
                { icon: "🧠", label: "Vitalidad", val: 66 },
                { icon: "😴", label: "Descanso", val: 58, worst: true },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.best ? C.green : s.worst ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.15)",
                  borderRadius: 10, padding: "10px 6px", textAlign: "center",
                  border: s.worst ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}>
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 18, color: C.white, fontWeight: 700 }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "12px 14px", marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>Tu punto fuerte es la <strong style={{ color: C.white }}>actividad física</strong>. Tu mayor palanca: el <strong style={{ color: C.white }}>descanso</strong>.</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PROBLEMA — fondo crema ── */}
      <section style={{ background: C.bg, padding: "72px 20px" }}>
        <div style={container}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, marginBottom: 14 }}>
                Tu cuerpo envejece a su ritmo.<br />
                <span style={{ color: C.orange }}>No al tuyo.</span>
              </h2>
              <p style={{ fontSize: 16, color: C.mid, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
                Puedes tener 35 años y un metabolismo de 50. La diferencia no es genética —
                es lo que haces con 5 palancas concretas.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { icon: "⚖️", titulo: "Composición corporal", desc: "La relación músculo-grasa dice más de tu metabolismo que el peso en la báscula." },
              { icon: "🏃", titulo: "Actividad física", desc: "El movimiento regula hormonas, insulina y energía celular. No solo quemar calorías." },
              { icon: "🥗", titulo: "Nutrición", desc: "Qué comes importa. Cuándo comes también. Los ultraprocesados envejecen el metabolismo." },
              { icon: "😴", titulo: "Descanso", desc: "Dormir mal durante 2 semanas equivale metabólicamente a 5 años de envejecimiento." },
              { icon: "🧠", titulo: "Bienestar mental", desc: "El cortisol crónico del estrés es el mayor saboteador silencioso del metabolismo." },
            ].map((b, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{
                  background: C.white, borderRadius: 14, padding: "22px 18px",
                  border: `1px solid ${C.light}`,
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{b.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{b.titulo}</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA — fondo verde ── */}
      <section style={{ background: C.green, padding: "72px 20px" }}>
        <div style={container}>
          <FadeIn>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: C.white, textAlign: "center", marginBottom: 40 }}>
              3 pasos. 5 minutos.
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { num: "01", titulo: "Responde el test", desc: "El bot te hace preguntas sobre tus hábitos en los 5 bloques metabólicos. Sin jerga médica." },
              { num: "02", titulo: "Calculamos tu ICM", desc: "El algoritmo calcula tu Índice de Calidad Metabólica y tu edad metabólica real en segundos." },
              { num: "03", titulo: "Recibes tu resultado", desc: "Informe visual con tu ICM, scores por bloque, y las palancas exactas que moverán tu metabolismo." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "28px 22px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "rgba(255,255,255,0.2)", lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: C.white, marginBottom: 10 }}>{s.titulo}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button
                onClick={scrollToBot}
                style={{
                  background: C.orange, color: C.white,
                  border: "none", borderRadius: 100,
                  padding: "16px 36px", fontWeight: 900,
                  fontSize: 16, cursor: "pointer", fontFamily: font,
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

      {/* ── ROCÍO — fondo crema ── */}
      <section style={{ background: C.bg, padding: "72px 20px" }}>
        <div style={{ ...container, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}>
          <FadeIn>
            <div style={{ background: C.greenPale, borderRadius: 20, padding: "40px 32px", border: `1px solid #C8E8B0` }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: C.green, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 28, marginBottom: 20,
                color: C.white, fontWeight: 900,
              }}>RF</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Rocío Fábregas</div>
              <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 16 }}>
                Nutricionista clínica · Especialista en metabolismo
              </div>
              <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
                "El ICM no es solo un número. Es un mapa. Trabajo con cada paciente para convertir
                ese mapa en un plan real, sostenible y adaptado a su vida."
              </p>
              <a href="mailto:tutestmetabolico@gmail.com" style={{
                display: "inline-block", background: C.green, color: C.white,
                borderRadius: 100, padding: "12px 24px",
                fontWeight: 800, fontSize: 13, textDecoration: "none",
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
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, marginBottom: 18, lineHeight: 1.2 }}>
                Tu resultado tiene más valor con una
                <span style={{ color: C.green }}> experta detrás</span>
              </h2>
              <p style={{ fontSize: 15, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
                El test ICM te da el diagnóstico. Rocío te da el plan.
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
                    background: C.greenPale, border: `2px solid ${C.green}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: C.green, flexShrink: 0, marginTop: 2,
                  }}>✓</div>
                  <span style={{ fontSize: 14, color: C.dark }}>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ — fondo naranja pálido ── */}
      <section style={{ background: C.orangePale, padding: "72px 20px" }}>
        <div style={{ ...container, maxWidth: 640 }}>
          <FadeIn>
            <h2 style={{ fontSize: 30, fontWeight: 900, textAlign: "center", marginBottom: 36 }}>
              Preguntas frecuentes
            </h2>
          </FadeIn>
          {[
            { q: "¿Qué es el Índice de Calidad Metabólica (ICM)?", a: "Es una puntuación de 0 a 100 que refleja la salud global de tu metabolismo evaluando 5 bloques: composición corporal, actividad física, nutrición, descanso y bienestar mental." },
            { q: "¿En cuánto tiempo veo resultados si aplico las recomendaciones?", a: "La mayoría de personas nota cambios en energía y bienestar en 2-3 semanas. Los cambios en el ICM son medibles en 4-6 semanas con constancia." },
            { q: "¿Necesito datos médicos o análisis de sangre?", a: "No. El test se basa en hábitos y percepción personal. No sustituye a un diagnóstico médico, pero sí te da un mapa muy preciso de dónde actuar." },
            { q: "¿Para qué sirve la consulta con Rocío?", a: "Para convertir tu resultado en un plan concreto. Rocío interpreta tu ICM en detalle y diseña una estrategia nutricional adaptada a tus palancas específicas." },
          ].map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── CTA FINAL — fondo verde ── */}
      <section style={{ background: C.green, padding: "80px 20px", textAlign: "center" }}>
        <FadeIn>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, color: C.white, marginBottom: 16 }}>
            ¿Cuándo fue la última vez que<br />
            <span style={{ color: C.greenLight, fontStyle: "italic" }}>entendiste tu metabolismo?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Los que actúan antes son los que llegan a los 50 con energía de 35.
          </p>
          <button
            onClick={scrollToBot}
            style={{
              background: C.orange, color: C.white,
              border: "none", borderRadius: 100,
              padding: "18px 40px", fontWeight: 900,
              fontSize: 17, cursor: "pointer", fontFamily: font,
              boxShadow: `0 8px 32px rgba(232,98,26,0.4)`,
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Quiero saber mi edad metabólica →
          </button>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
            Gratis · Sin tarjeta · Resultado en tu email
          </p>
        </FadeIn>
      </section>

      {/* ── FOOTER — fondo crema ── */}
      <footer style={{ background: C.bg, padding: "40px 20px", borderTop: `1px solid ${C.light}`, textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.green, marginBottom: 10 }}>🌿 mymetaboliq</div>
        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.8 }}>
          <div>© 2025 mymetaboliq.com · Todos los derechos reservados</div>
          <div style={{ marginTop: 4 }}>El test ICM es orientativo y no sustituye el diagnóstico médico profesional.</div>
          <div style={{ marginTop: 10, display: "flex", gap: 20, justifyContent: "center" }}>
            {["Política de privacidad", "Cookies", "Contacto"].map((t, i) => (
              <a key={i} href="#" style={{ color: C.mid, fontSize: 12, textDecoration: "none" }}>{t}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}