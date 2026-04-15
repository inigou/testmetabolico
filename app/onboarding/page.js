'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8', greenLight: '#EAF3DE',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const OBJETIVOS = [
  { id: 'slow_aging',           emoji: '🌿', nombre: 'Slow aging',          desc: 'Envejecer mejor, más energía' },
  { id: 'mantener',             emoji: '⚖️', nombre: 'Mantener peso',        desc: 'Estabilidad y adherencia' },
  { id: 'definicion_suave',     emoji: '🔥', nombre: 'Definición suave',     desc: 'Perder grasa sin sacrificios' },
  { id: 'definicion_agresiva',  emoji: '💪', nombre: 'Definición agresiva',  desc: 'Pérdida de grasa eficiente' },
  { id: 'hipertrofia',          emoji: '🏋️', nombre: 'Hipertrofia moderada', desc: 'Ganar músculo saludable' },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva', desc: 'Máxima ganancia muscular' },
  { id: 'perdida_rapida',       emoji: '⚡', nombre: 'Pérdida rápida',       desc: 'Resultados rápidos' },
];

const HORARIOS = [
  { id: 'manana',   emoji: '🌅', label: 'Mañana',  desc: '6h–10h' },
  { id: 'mediodia', emoji: '☀️', label: 'Mediodía', desc: '11h–14h' },
  { id: 'tarde',    emoji: '🌇', label: 'Tarde',    desc: '17h–20h' },
  { id: 'noche',    emoji: '🌙', label: 'Noche',    desc: '20h–23h' },
];

const TIPOS_ENTRENO = {
  pesas: '🏋️ Pesas', hiit: '🔥 HIIT', cardio: '🚴 Cardio',
  running: '🏃 Running', natacion: '🏊 Natación', yoga: '🧘 Yoga',
  surf: '🏄 Surf', caminar: '🚶 Caminar',
};
const METS = { caminar: 3.5, pesas: 6.0, hiit: 8.5, cardio: 5.5, yoga: 3.0, natacion: 7.0, surf: 5.5, running: 7.0 };

// ── Preferencias alimentarias ampliadas ─────────────────────────────
const TIPOS_DIETA = [
  { id: 'omnivoro',     label: '🍖 Omnívoro',     desc: 'Como de todo' },
  { id: 'flexitariano', label: '🥗 Flexitariano',  desc: 'Menos carne' },
  { id: 'vegetariano',  label: '🌿 Vegetariano',   desc: 'Sin carne ni pescado' },
  { id: 'vegano',       label: '🌱 Vegano',         desc: 'Sin productos animales' },
  { id: 'pescetariano', label: '🐟 Pescetariano',   desc: 'Sin carne, con pescado' },
  { id: 'paleo',        label: '🥩 Paleo',           desc: 'Sin cereales ni lácteos' },
  { id: 'cetogenica',   label: '🥑 Cetogénica',     desc: 'Muy baja en carbohidratos' },
  { id: 'mediterranean',label: '🫒 Mediterránea',  desc: 'Dieta mediterránea' },
];

const ALERGIAS = [
  { id: 'gluten',        emoji: '🌾', label: 'Gluten / Trigo' },
  { id: 'lactosa',       emoji: '🥛', label: 'Lácteos / Lactosa' },
  { id: 'huevo',         emoji: '🥚', label: 'Huevo' },
  { id: 'frutos_secos',  emoji: '🥜', label: 'Frutos secos' },
  { id: 'marisco',       emoji: '🦐', label: 'Marisco / Crustáceos' },
  { id: 'pescado',       emoji: '🐟', label: 'Pescado' },
  { id: 'soja',          emoji: '🫘', label: 'Soja' },
  { id: 'sesamo',        emoji: '🌰', label: 'Sésamo' },
  { id: 'mostaza',       emoji: '🌭', label: 'Mostaza' },
  { id: 'apio',          emoji: '🌿', label: 'Apio' },
];

const NO_COMO = [
  { id: 'carne_roja',    emoji: '🥩', label: 'Carne roja' },
  { id: 'carne_blanca',  emoji: '🍗', label: 'Carne blanca' },
  { id: 'pescado_blanco',emoji: '🐡', label: 'Pescado blanco' },
  { id: 'mariscos',      emoji: '🦞', label: 'Mariscos' },
  { id: 'legumbres',     emoji: '🫘', label: 'Legumbres' },
  { id: 'lacteos',       emoji: '🧀', label: 'Lácteos' },
  { id: 'azucar',        emoji: '🍬', label: 'Azúcar refinado' },
  { id: 'alcohol',       emoji: '🍷', label: 'Alcohol' },
  { id: 'ultraprocesados',emoji: '🍟', label: 'Ultraprocesados' },
  { id: 'picante',       emoji: '🌶️', label: 'Picante' },
  { id: 'cafe',          emoji: '☕', label: 'Cafeína' },
  { id: 'gluten_pref',   emoji: '🌾', label: 'Prefiero sin gluten' },
];

// ── Chip seleccionable ───────────────────────────────────────────────
function Chip({ label, emoji, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 13px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
      fontFamily: font, display: 'flex', alignItems: 'center', gap: 5,
      background: selected ? '#FDECEA' : C.white,
      color: selected ? '#C0392B' : C.mid,
      border: `1.5px solid ${selected ? '#F1948A' : C.light}`,
      textDecoration: selected ? 'line-through' : 'none',
      transition: 'all 0.15s',
    }}>
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      {selected && <span style={{ fontSize: 10, fontWeight: 700 }}>✕</span>}
    </button>
  );
}

function ChipGreen({ label, emoji, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 13px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
      fontFamily: font, display: 'flex', alignItems: 'center', gap: 5,
      background: selected ? C.greenPale : C.white,
      color: selected ? '#3B6D11' : C.mid,
      border: `1.5px solid ${selected ? C.green : C.light}`,
      fontWeight: selected ? 700 : 400,
      transition: 'all 0.15s',
    }}>
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      {selected && <span style={{ fontSize: 10 }}>✓</span>}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  // ── Pantalla inicial ─────────────────────────────────────────────
  const [emailInput, setEmailInput]   = useState('');
  const [buscando, setBuscando]       = useState(false);
  const [errorEmail, setErrorEmail]   = useState('');
  const [paso, setPaso]               = useState(0); // 0=email, 1=prefs, 2=objetivo, 3=cuadro
  const [saving, setSaving]           = useState(false);

  // Datos del usuario (pre-rellenados desde BD)
  const [email, setEmail]             = useState('');
  const [nombre, setNombre]           = useState('');

  // Paso 1 — Preferencias
  const [tipoDieta, setTipoDieta]     = useState('omnivoro');
  const [alergias, setAlergias]       = useState([]);
  const [noComidas, setNoComidas]     = useState([]);
  const [horario, setHorario]         = useState('tarde');
  const [nivelCocina, setNivelCocina] = useState('medio');
  const [presupuestoSemanal, setPresupuestoSemanal] = useState('sin_limite');

  // Paso 2 — Objetivo
  const [objetivoId, setObjetivoId]   = useState('mantener');

  // Paso 3 — Cuadro de mando
  const [pasos, setPasos]             = useState(6000);
  const [hayEntreno, setHayEntreno]   = useState(true);
  const [duracion, setDuracion]       = useState(45);
  const [tipoEntreno, setTipoEntreno] = useState('pesas');

  const bmr = 1700;
  const kcalPasos   = Math.round(pasos * 0.04);
  const kcalEntreno = hayEntreno ? Math.round((METS[tipoEntreno] || 6) * 70 * (duracion / 60)) : 0;
  const presupuesto = bmr + kcalPasos + kcalEntreno;

  // ── Pantalla 0: buscar usuario por email ────────────────────────
  const continuarConEmail = async () => {
    if (!emailInput.includes('@')) { setErrorEmail('Introduce un email válido'); return; }
    setBuscando(true);
    setErrorEmail('');
    try {
      // Buscar en tabla tests (donde seguro existe si hizo el test)
      const res = await fetch(
        `${SB_URL}/rest/v1/tests?email=eq.${encodeURIComponent(emailInput)}&select=email&limit=1`,
        { headers: sbH }
      );
      const rows = await res.json();
      if (!rows?.length) {
        setErrorEmail('No encontramos ningún test con ese email. ¿Has hecho el test ICM primero?');
        setBuscando(false); return;
      }

      // Buscar nombre en tabla usuarios si existe
      const uRes = await fetch(
        `${SB_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(emailInput)}&select=nombre&limit=1`,
        { headers: sbH }
      );
      const uRows = await uRes.json();
      const nombreBD = uRows?.[0]?.nombre || '';

      setEmail(emailInput);
      setNombre(nombreBD);
      setPaso(1);
    } catch (e) {
      setErrorEmail('Error al conectar. Inténtalo de nuevo.');
    }
    setBuscando(false);
  };

  const toggleItem = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const finalizar = async () => {
    setSaving(true);
    const cfg = {
      nombre, objetivoId, tipoDieta,
      alergias, noComidas,
      horarioEntreno: horario, nivelCocina,
      presupuestoSemanal,
      pasosHabituales: pasos, hayEntrenoHabitual: hayEntreno,
      duracionEntrenoBase: duracion, tipoEntrenoBase: tipoEntreno,
      presupuestoBase: presupuesto,
    };
    try {
      localStorage.setItem(`config_${email}`, JSON.stringify(cfg));
      await fetch(`${SB_URL}/rest/v1/usuarios`, {
        method: 'POST',
        headers: { ...sbH, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ email, nombre, objetivo_id: objetivoId, preferencias: cfg, onboarding_completed: true }),
      });
    } catch (e) { console.error(e); }
    router.push('/dashboard');
    setSaving(false);
  };

  // ── Barra de progreso (solo pasos 1-3) ──────────────────────────
  const Progreso = () => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: paso >= n ? C.green : C.light, color: paso >= n ? C.white : C.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, transition: 'all 0.3s' }}>
            {paso > n ? '✓' : n}
          </div>
          {n < 3 && <div style={{ width: 40, height: 2, background: paso > n ? C.green : C.light, borderRadius: 2, transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ background: C.green, padding: '18px 24px', textAlign: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 20, color: C.white }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></span>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '36px 20px 80px', animation: 'fadeIn 0.4s ease' }}>

        {/* ═══ PANTALLA 0: EMAIL ═══ */}
        {paso === 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.dark, marginBottom: 10 }}>Bienvenido al dashboard</div>
              <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.7 }}>
                Introduce el email con el que hiciste el test ICM para personalizar tu experiencia
              </div>
            </div>

            <div style={{ background: C.white, borderRadius: 16, padding: '24px', border: `1px solid ${C.light}` }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tu email del test ICM</div>
              <input
                type="email" value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setErrorEmail(''); }}
                onKeyDown={e => e.key === 'Enter' && !buscando && continuarConEmail()}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: '13px 16px', border: `1.5px solid ${emailInput.includes('@') ? C.green : C.light}`, borderRadius: 100, fontSize: 15, fontFamily: font, outline: 'none', color: C.dark, background: C.bg, boxSizing: 'border-box', marginBottom: 16 }}
              />
              {errorEmail && (
                <div style={{ background: '#FFEBEE', border: '1px solid #F1948A', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#C0392B', lineHeight: 1.5 }}>
                  ⚠️ {errorEmail}
                  {errorEmail.includes('test ICM') && (
                    <div style={{ marginTop: 6 }}>
                      <a href="/bot" style={{ color: C.orange, fontWeight: 700, textDecoration: 'none' }}>→ Hacer el test ICM primero</a>
                    </div>
                  )}
                </div>
              )}
              <button onClick={continuarConEmail} disabled={buscando || !emailInput.includes('@')}
                style={{ width: '100%', background: emailInput.includes('@') && !buscando ? C.green : C.light, color: C.white, border: 'none', padding: '14px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: emailInput.includes('@') && !buscando ? 'pointer' : 'not-allowed', fontFamily: font, transition: 'background 0.2s' }}>
                {buscando ? 'Buscando...' : 'Continuar →'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.mid }}>
              ¿Aún no has hecho el test? <a href="/bot" style={{ color: C.green, fontWeight: 700, textDecoration: 'none' }}>Empieza aquí →</a>
            </div>
          </div>
        )}

        {/* ═══ PASOS 1-3 ═══ */}
        {paso >= 1 && <Progreso />}

        {/* ═══ PASO 1: PREFERENCIAS ═══ */}
        {paso === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.dark, marginBottom: 6 }}>
                {nombre ? `Hola, ${nombre} 👋` : 'Tus preferencias alimentarias'}
              </div>
              <div style={{ fontSize: 14, color: C.mid }}>Personalizaremos tu plan en base a estos datos</div>
            </div>

            {/* Nombre */}
            <Section title="¿Cómo te llamamos?">
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${nombre.length >= 2 ? C.green : C.light}`, borderRadius: 100, fontSize: 14, fontFamily: font, outline: 'none', color: C.dark, background: C.white, boxSizing: 'border-box' }} />
            </Section>

            {/* Tipo de dieta */}
            <Section title="¿Cómo describes tu alimentación?">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TIPOS_DIETA.map(d => (
                  <button key={d.id} onClick={() => setTipoDieta(d.id)} style={{ padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: font, background: tipoDieta === d.id ? C.greenPale : C.white, border: `2px solid ${tipoDieta === d.id ? C.green : C.light}`, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: tipoDieta === d.id ? 700 : 400, color: C.dark }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Alergias e intolerancias */}
            <Section title="⚠️ Alergias e intolerancias (importante)">
              <div style={{ background: '#FFFDE7', border: '1px solid #F9E080', borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 11, color: '#7B6000' }}>
                Estos alimentos se eliminarán completamente de tu plan
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {ALERGIAS.map(a => (
                  <Chip key={a.id} label={a.label} emoji={a.emoji} selected={alergias.includes(a.id)} onClick={() => toggleItem(alergias, setAlergias, a.id)} />
                ))}
              </div>
            </Section>

            {/* No me gusta / no como */}
            <Section title="🚫 No como o prefiero evitar">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {NO_COMO.map(n => (
                  <Chip key={n.id} label={n.label} emoji={n.emoji} selected={noComidas.includes(n.id)} onClick={() => toggleItem(noComidas, setNoComidas, n.id)} />
                ))}
              </div>
            </Section>

            {/* Horario entreno */}
            <Section title="⏰ Horario de entreno habitual">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {HORARIOS.map(h => (
                  <button key={h.id} onClick={() => setHorario(h.id)} style={{ padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: font, background: horario === h.id ? C.greenPale : C.white, border: `2px solid ${horario === h.id ? C.green : C.light}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{h.emoji}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{h.label}</div>
                      <div style={{ fontSize: 10, color: C.mid }}>{h.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Nivel cocina */}
            <Section title="👨‍🍳 Nivel en la cocina">
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'rapido', label: '⚡ Rápido', desc: '<20 min' }, { id: 'medio', label: '👨‍🍳 Medio', desc: '20-45 min' }, { id: 'avanzado', label: '🏆 Avanzado', desc: 'Sin límite' }].map(n => (
                  <button key={n.id} onClick={() => setNivelCocina(n.id)} style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font, background: nivelCocina === n.id ? C.greenPale : C.white, color: nivelCocina === n.id ? '#3B6D11' : C.mid, border: `2px solid ${nivelCocina === n.id ? C.green : C.light}`, textAlign: 'center' }}>
                    <div>{n.label}</div>
                    <div style={{ fontSize: 9, marginTop: 2, fontWeight: 400 }}>{n.desc}</div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Presupuesto compra */}
            <Section title="💰 Presupuesto semanal de comida">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'bajo',       label: '< 50€/sem' },
                  { id: 'medio',      label: '50–100€/sem' },
                  { id: 'alto',       label: '100–150€/sem' },
                  { id: 'sin_limite', label: 'Sin límite' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPresupuestoSemanal(p.id)} style={{ padding: '8px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', fontFamily: font, background: presupuestoSemanal === p.id ? C.orange : C.white, color: presupuestoSemanal === p.id ? C.white : C.mid, border: `1.5px solid ${presupuestoSemanal === p.id ? C.orange : C.light}`, fontWeight: presupuestoSemanal === p.id ? 700 : 400 }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </Section>

            <button onClick={() => setPaso(2)}
              style={{ width: '100%', marginTop: 8, background: C.green, color: C.white, border: 'none', padding: '15px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 4px 16px rgba(91,155,60,0.3)' }}>
              Siguiente — Mi objetivo →
            </button>
          </div>
        )}

        {/* ═══ PASO 2: OBJETIVO ═══ */}
        {paso === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.dark, marginBottom: 6 }}>¿Cuál es tu meta?</div>
              <div style={{ fontSize: 14, color: C.mid }}>Tu plan semanal se construirá en torno a este objetivo</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {OBJETIVOS.map(o => (
                <button key={o.id} onClick={() => setObjetivoId(o.id)} style={{ padding: '16px', borderRadius: 14, cursor: 'pointer', fontFamily: font, background: objetivoId === o.id ? C.greenPale : C.white, border: `2px solid ${objetivoId === o.id ? C.green : C.light}`, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 26 }}>{o.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{o.nombre}</div>
                    <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{o.desc}</div>
                  </div>
                  {objetivoId === o.id && <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 12, flexShrink: 0 }}>✓</div>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button onClick={() => setPaso(1)} style={{ flex: 1, background: C.white, color: C.mid, border: `1.5px solid ${C.light}`, padding: '13px', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontFamily: font }}>← Atrás</button>
              <button onClick={() => setPaso(3)} style={{ flex: 2, background: C.green, color: C.white, border: 'none', padding: '13px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                Siguiente — Cuadro de mando →
              </button>
            </div>
          </div>
        )}

        {/* ═══ PASO 3: CUADRO DE MANDO ═══ */}
        {paso === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.dark, marginBottom: 6 }}>Tu día tipo</div>
              <div style={{ fontSize: 14, color: C.mid }}>Calibramos tu presupuesto calórico base</div>
            </div>

            {/* Preview presupuesto */}
            <div style={{ background: C.dark, borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Presupuesto calórico base estimado</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, color: C.green, lineHeight: 1 }}>{presupuesto.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                BMR ~{bmr} + Pasos {kcalPasos} + Entreno {kcalEntreno} kcal
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Se ajustará con tus datos del test metabólico</div>
            </div>

            {/* Pasos */}
            <div style={{ background: C.white, borderRadius: 14, padding: '16px', marginBottom: 14, border: `1px solid ${C.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>🚶 Pasos diarios habituales</div>
                  <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>Tu media aproximada</div>
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.green }}>{pasos.toLocaleString()}</div>
              </div>
              <input type="range" min="0" max="20000" step="500" value={pasos} onChange={e => setPasos(+e.target.value)} style={{ width: '100%', accentColor: C.green }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#C0B8B0', marginTop: 3 }}>
                <span>Sedentario</span><span>5k</span><span>10k</span><span>15k</span><span>Muy activo</span>
              </div>
            </div>

            {/* Entreno */}
            <div style={{ background: C.white, borderRadius: 14, padding: '16px', marginBottom: 24, border: `1px solid ${C.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hayEntreno ? 16 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>🏋️ Suelo entrenar habitualmente</div>
                  <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{hayEntreno ? `+${kcalEntreno} kcal estimadas en días de entreno` : 'Sin entreno habitual'}</div>
                </div>
                <button onClick={() => setHayEntreno(v => !v)} style={{ width: 50, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', padding: 2, background: hayEntreno ? C.green : C.light, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.white, position: 'absolute', top: 2, left: hayEntreno ? 26 : 2, transition: 'left 0.2s' }} />
                </button>
              </div>
              {hayEntreno && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.dark }}>Duración habitual</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{duracion} min</span>
                  </div>
                  <input type="range" min="15" max="120" step="5" value={duracion} onChange={e => setDuracion(+e.target.value)} style={{ width: '100%', accentColor: C.orange, marginBottom: 14 }} />
                  <div style={{ fontSize: 11, color: '#9A9790', marginBottom: 8 }}>Tipo de entreno habitual</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(TIPOS_ENTRENO).map(([k, v]) => (
                      <button key={k} onClick={() => setTipoEntreno(k)} style={{ padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font, background: tipoEntreno === k ? C.orange : C.bg, color: tipoEntreno === k ? C.white : C.mid, border: `1.5px solid ${tipoEntreno === k ? C.orange : C.light}`, fontWeight: tipoEntreno === k ? 700 : 400 }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Resumen antes de finalizar */}
            <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#3B6D11', fontWeight: 700, marginBottom: 8 }}>✅ Resumen de tu perfil</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: C.dark }}>📧 {email}</div>
                {nombre && <div style={{ fontSize: 12, color: C.dark }}>👤 {nombre}</div>}
                <div style={{ fontSize: 12, color: C.dark }}>🎯 {OBJETIVOS.find(o => o.id === objetivoId)?.nombre}</div>
                <div style={{ fontSize: 12, color: C.dark }}>🍽️ {TIPOS_DIETA.find(d => d.id === tipoDieta)?.label}</div>
                {alergias.length > 0 && <div style={{ fontSize: 12, color: '#C05010' }}>⚠️ Sin: {alergias.map(a => ALERGIAS.find(x => x.id === a)?.label).join(', ')}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(2)} style={{ flex: 1, background: C.white, color: C.mid, border: `1.5px solid ${C.light}`, padding: '13px', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontFamily: font }}>← Atrás</button>
              <button onClick={finalizar} disabled={saving} style={{ flex: 2, background: saving ? '#C8E8B0' : `linear-gradient(135deg,${C.green},#3B6D11)`, color: C.white, border: 'none', padding: '15px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: font, boxShadow: saving ? 'none' : '0 4px 20px rgba(91,155,60,0.3)' }}>
                {saving ? 'Guardando...' : '¡Listo! Ir al dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}