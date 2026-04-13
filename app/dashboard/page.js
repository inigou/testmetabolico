'use client';
import { useState, useEffect, useRef } from 'react';
import PlanMetabolico from './Planmetabolico';
import ConfiguracionMetabolica from './ConfiguracionMetabolica';
import DailyCheckIn from './DailyCheckIn';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [objetivoId, setObjetivoId] = useState('mantener');
  const [weather, setWeather] = useState(null);
  const [planDia, setPlanDia] = useState(null);

  // Chat
  const [mensajesChat, setMensajesChat] = useState([]);
  const [inputChat, setInputChat] = useState('');
  const [chatCargando, setChatCargando] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajeProactivoGenerado, setMensajeProactivoGenerado] = useState(false);
  const chatEndRef = useRef(null);

  const ultimo = datos?.[datos.length - 1];
  const anterior = datos?.[datos.length - 2];

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesChat]);

  // Cargar config guardada
  useEffect(() => {
    if (!datos || !email) return;
    try {
      const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
      if (cfg.objetivoId) setObjetivoId(cfg.objetivoId);
      const hoy = new Date().toISOString().split('T')[0];
      const checkin = JSON.parse(localStorage.getItem(`checkin_${email}_${hoy}`) || '{}');
      if (checkin.weather) setWeather(checkin.weather);
    } catch (e) { console.error(e); }
  }, [datos, email]);

  // Generar mensaje proactivo cuando tenemos weather + planDia
  useEffect(() => {
    if (!weather || !planDia || mensajeProactivoGenerado || !ultimo) return;
    setMensajeProactivoGenerado(true);
    generarMensajeProactivo();
  }, [weather, planDia]);

  const generarMensajeProactivo = async () => {
    if (!ultimo) return;
    setChatCargando(true);
    setMensajesChat([{ rol: 'bot', texto: '', cargando: true, esProactivo: true }]);

    const scores = [
      { nombre: 'actividad física', val: ultimo.efh_score },
      { nombre: 'composición corporal', val: ultimo.eco_score },
      { nombre: 'nutrición', val: ultimo.nut_score },
      { nombre: 'descanso', val: ultimo.des_score },
      { nombre: 'vitalidad', val: ultimo.vit_score },
    ];
    const peor = scores.reduce((a, b) => a.val < b.val ? a : b);
    const mejor = scores.reduce((a, b) => a.val > b.val ? a : b);

    const comidaHoy = planDia?.comidas
      ? `Desayuno: ${planDia.comidas.desayuno}. Comida: ${planDia.comidas.comida}. Cena: ${planDia.comidas.cena}.`
      : 'Sin plan de comidas todavía.';
    const entrenoHoy = planDia?.entrenamiento
      ? `${planDia.entrenamiento.tipo}: ${planDia.entrenamiento.ejercicios?.join(', ')}`
      : 'Día de descanso.';

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: `Genera un mensaje de bienvenida proactivo y muy directo (máximo 3 frases + 1 pregunta). 
          
CONTEXTO COMPLETO DE HOY:
- Estado metabólico: ${weather?.estado}
- Consejo del día: ${weather?.consejo}
- Plan de comidas de hoy (${planDia?.diaNombre}): ${comidaHoy}
- Entrenamiento de hoy: ${entrenoHoy}
- Bloque más débil del usuario: ${peor.nombre} (${peor.val}/100)

Menciona el estado de hoy, algo concreto del plan (una comida o el entreno), y haz UNA pregunta táctica sobre si quiere adaptar algo. Sé específico y cercano. NO genérico.`,
          perfil: {
            icm: ultimo.icm_total,
            categoria: ultimo.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado',
            edad_metabolica: ultimo.edad_metabolica,
            mejor_bloque: mejor.nombre,
            peor_bloque: peor.nombre,
            eco: ultimo.eco_score, efh: ultimo.efh_score,
            nut: ultimo.nut_score, des: ultimo.des_score, vit: ultimo.vit_score,
          },
        }),
      });
      const data = await res.json();
      setMensajesChat([{
        rol: 'bot', texto: data.respuesta || '',
        cargando: false, esProactivo: true,
        chips: generarChips(planDia, weather),
      }]);
    } catch (e) {
      setMensajesChat([{
        rol: 'bot',
        texto: `${weather?.estado} — ${weather?.consejo} ¿En qué te puedo ayudar hoy?`,
        cargando: false, esProactivo: true,
        chips: generarChips(planDia, weather),
      }]);
    }
    setChatCargando(false);
  };

  const generarChips = (plan, w) => {
    const chips = [];
    if (plan?.entrenamiento?.tipo) {
      chips.push(`Adapta el entreno de hoy`);
      chips.push(`Explícame el entreno de hoy`);
    }
    if (plan?.comidas?.comida) {
      chips.push(`Receta rápida para la comida`);
    }
    return chips.slice(0, 3);
  };

  const enviarMensaje = async (texto) => {
    const q = texto || inputChat;
    if (!q.trim() || chatCargando) return;
    setInputChat('');
    setChatCargando(true);

    const historialLimpio = mensajesChat
      .filter(m => !m.cargando && m.texto)
      .map(m => ({ rol: m.rol, texto: m.texto }));

    setMensajesChat(prev => [...prev, { rol: 'usuario', texto: q, cargando: false }]);
    setMensajesChat(prev => [...prev, { rol: 'bot', texto: '', cargando: true }]);

    const scores = [
      { nombre: 'actividad física', val: ultimo?.efh_score },
      { nombre: 'nutrición', val: ultimo?.nut_score },
      { nombre: 'descanso', val: ultimo?.des_score },
    ];
    const peor = scores.reduce((a, b) => (a.val || 0) < (b.val || 0) ? a : b);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: q,
          historial: historialLimpio,
          contexto_dia: {
            weather: weather?.estado,
            comidas: planDia?.comidas,
            entrenamiento: planDia?.entrenamiento,
          },
          perfil: {
            icm: ultimo?.icm_total,
            categoria: ultimo?.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado',
            edad_metabolica: ultimo?.edad_metabolica,
            mejor_bloque: 'actividad física',
            peor_bloque: peor.nombre,
            eco: ultimo?.eco_score, efh: ultimo?.efh_score,
            nut: ultimo?.nut_score, des: ultimo?.des_score, vit: ultimo?.vit_score,
          },
        }),
      });
      const data = await res.json();
      setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: data.respuesta || '', cargando: false } : m));
    } catch (e) {
      setMensajesChat(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, texto: 'Error al conectar.', cargando: false } : m));
    }
    setChatCargando(false);
  };

  const categoriaColor = (icm) => {
    if (icm >= 80) return C.green;
    if (icm >= 65) return '#7AB648';
    if (icm >= 50) return '#E8A020';
    return C.orange;
  };

  const scoreColor = (score) => {
    if (score >= 70) return C.green;
    if (score >= 50) return '#E8A020';
    return C.orange;
  };

  const formatFecha = (f) => {
    const d = new Date(f);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const chartData = datos?.map((t, i) => ({
    x: datos.length === 1 ? 50 : (i / (datos.length - 1)) * 80 + 10,
    y: 90 - ((t.icm_total / 100) * 70),
    icm: t.icm_total,
    fecha: formatFecha(t.fecha),
  }));

  const pathD = chartData?.length > 1
    ? chartData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 6.8} ${p.y * 1.1}`).join(' ')
    : null;

  const areaD = pathD
    ? `${pathD} L ${chartData[chartData.length - 1].x * 6.8} 110 L ${chartData[0].x * 6.8} 110 Z`
    : null;

  const buscarDatos = async () => {
    if (!email.trim()) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(
        `https://khinwyoejhoqqunfyjft.supabase.co/rest/v1/tests?email=eq.${encodeURIComponent(email)}&order=fecha.asc`,
        {
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM',
          },
        }
      );
      const tests = await res.json();
      if (tests.length === 0) {
        setError('No encontramos ningun test con ese email.');
      } else {
        setDatos(tests);
      }
    } catch {
      setError('Error al conectar. Intentalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // ── CHAT PANEL ──────────────────────────────────────────────────
  const ChatPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header chat */}
      <div style={{ background: C.green, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Coach metabólico</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Powered by Claude AI</div>
          </div>
        </div>
        <button onClick={() => setChatAbierto(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: C.orangePale }}>
        {mensajesChat.length === 0 && !chatCargando && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.mid, fontSize: 13 }}>
            Completa el check-in diario para activar tu coach personalizado
          </div>
        )}

        {mensajesChat.map((m, i) => (
          <div key={i}>
            {m.rol === 'usuario' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: C.orange, color: C.white, fontSize: 13, lineHeight: 1.6 }}>
                  {m.texto}
                </div>
              </div>
            )}
            {m.rol === 'bot' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 8 }}>
                <div style={{ maxWidth: '90%', background: C.white, border: '1px solid #E8E4DC', borderRadius: 14, padding: '12px 14px' }}>
                  {m.esProactivo && (
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      🤖 Mensaje de hoy
                    </div>
                  )}
                  {m.cargando ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, opacity: 0.6, animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  )}
                </div>
                {/* Chips respuesta rápida */}
                {m.esProactivo && m.chips?.length > 0 && !m.cargando && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 2 }}>
                    {m.chips.map((chip, ci) => (
                      <button key={ci} onClick={() => enviarMensaje(chip)} style={{
                        background: C.white, border: `1.5px solid ${C.green}`, color: C.green,
                        padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: font, transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = C.white; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.green; }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px', background: C.white, borderTop: `1px solid ${C.light}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={inputChat}
          onChange={e => setInputChat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !chatCargando && inputChat.trim() && enviarMensaje()}
          placeholder="Pregunta lo que quieras..."
          style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 13, fontFamily: font, outline: 'none', color: C.dark, background: C.bg }}
        />
        <button
          onClick={() => !chatCargando && inputChat.trim() && enviarMensaje()}
          disabled={chatCargando}
          style={{ background: chatCargando ? C.light : C.orange, color: C.white, border: 'none', padding: '10px 18px', borderRadius: 100, fontSize: 13, cursor: chatCargando ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, flexShrink: 0 }}
        >
          {chatCargando ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        .chevron { transition: transform 0.3s ease; display: inline-block; }
        details[open] .chevron { transform: rotate(180deg); }
        @media (min-width: 768px) {
          .fab-container { display: none !important; }
          .chat-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .chat-desktop { display: none !important; }
          .fab-container { display: block !important; }
        }
      `}</style>

      {mostrarConfig && (
        <ConfiguracionMetabolica
          ultimo={ultimo}
          email={email}
          onGuardar={(cfg) => { setObjetivoId(cfg.objetivoId); setMostrarConfig(false); }}
          onCerrar={() => setMostrarConfig(false)}
        />
      )}

      {/* FAB + MODAL CHAT — solo móvil */}
      <div className="fab-container" style={{ display: 'none' }}>
        {/* FAB button */}
        {!chatAbierto && datos && ultimo && (
          <button
            onClick={() => setChatAbierto(true)}
            style={{
              position: 'fixed', bottom: 24, right: 20, zIndex: 300,
              width: 60, height: 60, borderRadius: '50%',
              background: C.green, border: 'none',
              boxShadow: '0 4px 20px rgba(91,155,60,0.5)',
              cursor: 'pointer', fontSize: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🤖
            {mensajesChat.length > 0 && (
              <div style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: C.orange, border: `2px solid ${C.white}`,
              }} />
            )}
          </button>
        )}

        {/* Bottom sheet modal */}
        {chatAbierto && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            {/* Overlay */}
            <div onClick={() => setChatAbierto(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }} />
            {/* Sheet */}
            <div style={{
              position: 'relative', zIndex: 1,
              height: '85dvh', borderRadius: '20px 20px 0 0',
              background: C.white, overflow: 'hidden',
              animation: 'slideUp 0.3s ease',
              display: 'flex', flexDirection: 'column',
            }}>
              <ChatPanel />
            </div>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav style={{ background: C.green, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.white }}>
          🌿 my<span style={{ color: C.greenLight }}>metaboliq</span>
        </span>
        <a href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecoration: 'none' }}>Nuevo test</a>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 100px' }}>

        {!datos && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.dark, marginBottom: 8 }}>
              Tu evolución <span style={{ color: C.orange, fontStyle: 'italic' }}>metabólica</span>
            </h1>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 32, lineHeight: 1.7 }}>
              Introduce el email con el que hiciste el test para ver tu historial completo.
            </p>
            <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarDatos()}
                placeholder="tu@email.com"
                style={{ flex: 1, padding: '12px 18px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 14, background: C.white, fontFamily: font, outline: 'none', color: C.dark }}
              />
              <button onClick={buscarDatos} disabled={cargando} style={{ background: C.orange, color: C.white, border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
                {cargando ? '...' : 'Ver'}
              </button>
            </div>
            {error && <p style={{ color: C.orange, fontSize: 13, marginTop: 16 }}>{error}</p>}
          </div>
        )}

        {datos && ultimo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#9A9790', marginBottom: 2 }}>{datos.length} test{datos.length > 1 ? 's' : ''} completado{datos.length > 1 ? 's' : ''}</div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.dark }}>Tu dashboard</h2>
              </div>
              <button onClick={() => { setDatos(null); setEmail(''); setMensajesChat([]); setMensajeProactivoGenerado(false); }} style={{ fontSize: 11, color: '#9A9790', background: 'none', border: 'none', cursor: 'pointer' }}>
                Cambiar email
              </button>
            </div>

            {/* ═══ 1: HERO ICM ═══ */}
            <div style={{ background: C.green, borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 12, padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Edad real</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 48, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
                    {Math.round(ultimo.edad_metabolica - (ultimo.delta_anos || 0))}
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>{'→'}</div>
                <div style={{ background: C.white, borderRadius: 12, padding: '14px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 9, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Edad metabólica</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 60, color: C.orange, lineHeight: 1 }}>{ultimo.edad_metabolica}</div>
                  <div style={{
                    display: 'inline-block',
                    background: ultimo.delta_anos <= 0 ? C.greenPale : C.orangePale,
                    border: `1px solid ${ultimo.delta_anos <= 0 ? '#C8E8B0' : '#F9CFA8'}`,
                    color: ultimo.delta_anos <= 0 ? '#3B6D11' : C.orange,
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, marginTop: 6
                  }}>
                    {ultimo.delta_anos <= 0 ? `${Math.abs(ultimo.delta_anos)} años menos` : `+${ultimo.delta_anos} años`}
                  </div>
                </div>
              </div>

              <div style={{ background: C.white, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>ICM · Índice de Calidad Metabólica</div>
                    <div style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>
                      {ultimo.icm_total >= 80 ? 'Metabolismo óptimo' : ultimo.icm_total >= 65 ? 'Metabolismo activo' : ultimo.icm_total >= 50 ? 'Metabolismo moderado' : 'Metabolismo lento'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: C.dark, lineHeight: 1 }}>
                    {ultimo.icm_total}<span style={{ fontSize: 13, color: '#9A9790' }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 7, background: '#F0EBE3', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ultimo.icm_total}%`, background: `linear-gradient(90deg,${C.green},${C.orange})`, borderRadius: 100 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#C0B8B0', marginTop: 3 }}>
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7, marginBottom: 14 }}>
                {[
                  { icon: '⚡', label: 'Actividad', val: ultimo.efh_score },
                  { icon: '🏋️', label: 'Composición', val: ultimo.eco_score },
                  { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score },
                  { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score },
                  { icon: '😴', label: 'Descanso', val: ultimo.des_score },
                ].map((s, i) => {
                  const vals = [ultimo.efh_score, ultimo.eco_score, ultimo.nut_score, ultimo.vit_score, ultimo.des_score];
                  const isBest = s.val === Math.max(...vals);
                  const isWorst = s.val === Math.min(...vals);
                  return (
                    <div key={i} style={{
                      background: isBest ? C.orange : isWorst ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.15)',
                      borderRadius: 9, padding: '9px 5px', textAlign: 'center',
                      border: isWorst ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginBottom: 2 }}>
                        {isBest ? '★ TOP' : isWorst ? '↑ MEJORAR' : '\u00a0'}
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.white, fontWeight: 700 }}>{s.val}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 9, padding: '11px 13px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                  Tu punto fuerte es la <strong style={{ color: C.white }}>
                    {[
                      { nombre: 'actividad física', val: ultimo.efh_score },
                      { nombre: 'composición corporal', val: ultimo.eco_score },
                      { nombre: 'nutrición', val: ultimo.nut_score },
                      { nombre: 'vitalidad', val: ultimo.vit_score },
                      { nombre: 'descanso', val: ultimo.des_score },
                    ].reduce((a, b) => a.val > b.val ? a : b).nombre}
                  </strong>. Tu mayor palanca: <strong style={{ color: C.white }}>
                    {[
                      { nombre: 'actividad física', val: ultimo.efh_score },
                      { nombre: 'composición corporal', val: ultimo.eco_score },
                      { nombre: 'nutrición', val: ultimo.nut_score },
                      { nombre: 'vitalidad', val: ultimo.vit_score },
                      { nombre: 'descanso', val: ultimo.des_score },
                    ].reduce((a, b) => a.val < b.val ? a : b).nombre}
                  </strong>.
                </span>
              </div>
            </div>

            {/* ═══ 2: CHECK-IN ═══ */}
            <DailyCheckIn
              email={email}
              perfil={ultimo}
              objetivoId={objetivoId}
              onWeatherUpdate={(w) => setWeather(w)}
            />

            {/* ═══ 3: PLAN DE HOY ═══ */}
            <PlanMetabolico
              ultimo={ultimo}
              email={email}
              objetivoId={objetivoId}
              onAbrirConfig={() => setMostrarConfig(true)}
              onPlanDiaListo={(data) => setPlanDia(data)}
            />

            {/* ═══ 4: COACH DESKTOP ═══ */}
            <div className="chat-desktop" style={{ display: 'none', flexDirection: 'column', background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, overflow: 'hidden', height: 480 }}>
              <ChatPanel />
            </div>

            {/* ═══ 5: CTA SUSCRIPCIÓN ═══ */}
            <div style={{ background: C.orange, borderRadius: 14, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: C.white, marginBottom: 4 }}>Sigue tu evolución</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>9,90€/mes · Cancela cuando quieras</div>
              </div>
              <a href="#" style={{ background: C.white, color: C.orange, padding: '10px 22px', borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Activar seguimiento
              </a>
            </div>

            {/* ═══ 6: ANALÍTICA — COLAPSADA ═══ */}
            <details style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.light}` }}>
              <summary style={{
                background: C.white, padding: '16px 20px',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: font, fontSize: 13, fontWeight: 600, color: C.dark, userSelect: 'none',
              }}>
                <span>📊 Ver mi reporte analítico detallado</span>
                <span className="chevron" style={{ fontSize: 16, color: C.mid }}>▾</span>
              </summary>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px', background: C.bg }}>

                {/* Gráfico evolución */}
                {datos.length > 1 && (
                  <div style={{ background: C.green, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Evolución del ICM</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.white, marginBottom: 16 }}>Progreso mensual</div>
                    <svg viewBox="0 0 680 110" style={{ width: '100%', height: 120 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.white} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={C.white} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[20, 55, 90].map(y => (
                        <line key={y} x1="40" y1={y} x2="660" y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                      ))}
                      {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                      {pathD && <path d={pathD} fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {chartData.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x * 6.8} cy={p.y * 1.1} r="5" fill={i === chartData.length - 1 ? C.orange : C.white} stroke={C.green} strokeWidth="2" />
                          <text x={p.x * 6.8} y={p.y * 1.1 - 10} textAnchor="middle" fontSize="10" fill={C.white} fontWeight="600">{p.icm}</text>
                        </g>
                      ))}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      {chartData.map((p, i) => (
                        <span key={i} style={{ color: i === chartData.length - 1 ? C.white : 'rgba(255,255,255,0.6)', fontWeight: i === chartData.length - 1 ? 600 : 400 }}>
                          {p.fecha}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Potencial de mejora */}
                <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    🚀 Tu potencial de mejora
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ background: C.white, borderRadius: 9, padding: 12, textAlign: 'center', border: '1px solid #C8E8B0' }}>
                      <div style={{ fontSize: 9, color: '#9A9790', marginBottom: 4 }}>ICM actual</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: C.orange }}>{ultimo.icm_total}</div>
                    </div>
                    <div style={{ background: C.green, borderRadius: 9, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>ICM potencial</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: C.white }}>{Math.min(100, Math.round(ultimo.icm_total * 1.18))}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>mejorando 2 bloques</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: '⚡', label: 'Actividad física', val: ultimo.efh_score, anos: 3 },
                      { icon: '🏋️', label: 'Composición corporal', val: ultimo.eco_score, anos: 4 },
                      { icon: '🥗', label: 'Nutrición', val: ultimo.nut_score, anos: 2 },
                      { icon: '😴', label: 'Descanso', val: ultimo.des_score, anos: 3 },
                      { icon: '🧠', label: 'Vitalidad', val: ultimo.vit_score, anos: 2 },
                    ].sort((a, b) => a.val - b.val).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: C.dark }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: scoreColor(s.val), fontWeight: 600 }}>{s.val}/100</span>
                          </div>
                          <div style={{ height: 5, background: '#D4EDBE', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.val}%`, background: scoreColor(s.val), borderRadius: 100 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 9, color: '#3B6D11', fontWeight: 700, background: C.white, border: '1px solid #C8E8B0', padding: '2px 7px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                          -{s.anos} años
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparativa con media */}
                <div style={{ background: C.orangePale, borderRadius: 14, padding: 18, border: '1px solid #F9CFA8' }}>
                  <div style={{ fontSize: 10, color: '#C05010', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    📊 Tu posición vs media de tu edad
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                    {[
                      { label: 'ICM medio', tuval: ultimo.icm_total, media: 52, unit: '/100', color: C.orange },
                      { label: 'Edad metab. media', tuval: ultimo.edad_metabolica, media: Math.round(ultimo.edad_metabolica + Math.abs(ultimo.delta_anos || 0) * 0.3 + 3), unit: 'años', color: C.orange },
                      { label: 'Percentil', tuval: ultimo.icm_total >= 80 ? 92 : ultimo.icm_total >= 65 ? 75 : ultimo.icm_total >= 50 ? 50 : 25, media: 50, unit: '%', color: C.green },
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign: 'center', background: C.white, borderRadius: 9, padding: 12, border: '1px solid #F9CFA8' }}>
                        <div style={{ fontSize: 9, color: '#9A9790', marginBottom: 6, lineHeight: 1.4 }}>{item.label}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, alignItems: 'baseline' }}>
                          <div>
                            <div style={{ fontSize: 8, color: item.color, fontWeight: 700, marginBottom: 2 }}>TÚ</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: item.color, lineHeight: 1 }}>{item.tuval}</div>
                          </div>
                          <div style={{ fontSize: 9, color: '#F9CFA8' }}>vs</div>
                          <div>
                            <div style={{ fontSize: 8, color: '#9A9790', fontWeight: 700, marginBottom: 2 }}>MEDIA</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#9A9790', lineHeight: 1 }}>{item.media}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 8, color: '#9A9790', marginTop: 4 }}>{item.unit}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#9A6040', lineHeight: 1.6, textAlign: 'center', fontStyle: 'italic' }}>
                    Comparativa estimada basada en datos de referencia para tu grupo de edad. Orientativa.
                  </div>
                </div>

                {/* Historial */}
                {datos.length > 1 && (
                  <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.light}` }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.dark, marginBottom: 16 }}>Historial de tests</div>
                    {[...datos].reverse().map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < datos.length - 1 ? `1px solid ${C.light}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: 13, color: C.dark, fontWeight: i === 0 ? 600 : 400 }}>
                            {formatFecha(t.fecha)}
                            {i === 0 && <span style={{ fontSize: 10, background: C.greenPale, color: C.green, padding: '1px 8px', borderRadius: 100, marginLeft: 6 }}>Último</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#9A9790', marginTop: 2 }}>Edad metabólica: {t.edad_metabolica} años</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: categoriaColor(t.icm_total) }}>{t.icm_total}</div>
                          <div style={{ fontSize: 10, color: '#9A9790' }}>ICM</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA volver */}
                {datos.length === 1 && (
                  <div style={{ background: C.greenPale, border: `1px solid #C8E8B0`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: C.dark, marginBottom: 6 }}>Vuelve cuando notes cambios</div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 16 }}>
                      En descanso y nutrición los cambios son medibles en 1-2 semanas.
                    </div>
                    <a href="/bot" style={{ display: 'inline-block', background: C.green, color: C.white, padding: '10px 24px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Hacer nuevo test
                    </a>
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