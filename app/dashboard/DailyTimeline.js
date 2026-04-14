'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const getHora = () => new Date().getHours();
const getEventoActivo = () => { const h = getHora(); if (h<10) return 'desayuno'; if (h<14) return 'entreno'; if (h<16) return 'comida'; return 'cena'; };

// ── SubstituteInput — componente aislado para evitar pérdida de foco ──
function SubstituteInput({ onEnviar, onCancelar, cargando }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: C.white, borderRadius: 10, border: `1px solid ${C.orange}`, animation: 'fadeIn 0.15s ease' }}>
      <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        🔄 ¿Qué quieres cambiar?
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) onEnviar(val); if (e.key === 'Escape') onCancelar(); }}
          placeholder="Ej: No tengo arándanos, tengo plátano..."
          style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 12, fontFamily: font, outline: 'none', color: C.dark, background: C.bg }}
        />
        <button
          onClick={() => val.trim() && onEnviar(val)}
          disabled={cargando || !val.trim()}
          style={{ background: cargando ? C.light : C.orange, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 100, fontSize: 12, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, flexShrink: 0 }}
        >
          {cargando ? '...' : 'Aplicar'}
        </button>
        <button onClick={onCancelar} style={{ background: 'none', border: `1px solid ${C.light}`, color: C.mid, padding: '8px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font }}>
          ✕
        </button>
      </div>
    </div>
  );
}

export default function DailyTimeline({ planSemanal, setPlanSemanal, email, objetivoId, onAbrirConfig, onTodoCompletado, onGenerarPlan, cargandoPlan, objetivo }) {
  const diaHoy = getDiaHoy();
  const eventoActivo = getEventoActivo();

  const [checks, setChecks] = useState({ desayuno: false, comida: false, cena: false, entreno: false });
  const [verRutina, setVerRutina] = useState(false);
  const [celebrado, setCelebrado] = useState(false);
  const [sustituyendo, setSustituyendo] = useState(null); // key del evento
  const [cargandoSustitucion, setCargandoSustitucion] = useState(false);
  const [sustitucionExito, setSustitucionExito] = useState(null);

  const diaData = planSemanal?.dieta?.[diaHoy];
  const entreno = planSemanal?.ejercicios?.[diaHoy];

  useEffect(() => {
    if (!email) return;
    const hoy = new Date().toISOString().split('T')[0];
    try { const s = localStorage.getItem(`checks_${email}_${hoy}`); if (s) setChecks(JSON.parse(s)); } catch(e) {}
  }, [email]);

  useEffect(() => {
    if (!email) return;
    const hoy = new Date().toISOString().split('T')[0];
    try { localStorage.setItem(`checks_${email}_${hoy}`, JSON.stringify(checks)); } catch(e) {}
    const relevantes = entreno ? [checks.desayuno, checks.comida, checks.cena, checks.entreno] : [checks.desayuno, checks.comida, checks.cena];
    if (relevantes.every(Boolean) && !celebrado) { setCelebrado(true); if (onTodoCompletado) onTodoCompletado(); }
  }, [checks]);

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const sustituir = async (eventoKey, peticion) => {
    if (!peticion.trim()) return;
    setSustituyendo(null);
    setCargandoSustitucion(eventoKey);

    // Contenido actual de esa comida
    const contenidoActual = eventoKey === 'entreno'
      ? `${entreno?.tipo}: ${entreno?.ejercicios?.join(', ')}`
      : diaData?.[eventoKey] || '';

    try {
      const res = await fetch('/api/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comida_actual: contenidoActual,
          peticion,
          tipo: eventoKey,
          objetivo: objetivo?.nombre || 'mantener peso',
        }),
      });
      const data = await res.json();
      if (data.sustitucion && planSemanal && setPlanSemanal) {
        const nuevoPlan = JSON.parse(JSON.stringify(planSemanal));
        if (eventoKey !== 'entreno') {
          nuevoPlan.dieta[diaHoy][eventoKey] = data.sustitucion;
        }
        setPlanSemanal(nuevoPlan);
        // Actualizar localStorage
        try {
          localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: nuevoPlan, fecha: Date.now() }));
        } catch(e) {}
        setSustitucionExito(eventoKey);
        setTimeout(() => setSustitucionExito(null), 2500);
      }
    } catch(e) { console.error(e); }
    setCargandoSustitucion(null);
  };

  const totalItems = entreno ? 4 : 3;
  const totalChecks = [checks.desayuno, checks.comida, checks.cena, entreno ? checks.entreno : true].filter(Boolean).length;
  const progreso = Math.round((totalChecks / totalItems) * 100);

  if (!planSemanal) {
    return (
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
        <div style={{ background: C.green, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: C.white }}>Plan de hoy</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{DIAS_FULL[diaHoy]}</div>
          </div>
          <button onClick={onAbrirConfig} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer' }}>⚙️</button>
        </div>
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🍽️</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: C.dark, marginBottom: 8 }}>Sin plan esta semana</div>
          <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 24 }}>
            Genera tu plan para ver las comidas y el entreno de cada día.
          </div>
          <button onClick={onGenerarPlan} disabled={cargandoPlan} style={{ background: cargandoPlan ? C.light : C.green, color: C.white, border: 'none', padding: '13px 32px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: cargandoPlan ? 'not-allowed' : 'pointer', fontFamily: font }}>
            {cargandoPlan ? 'Generando...' : 'Generar mi plan semanal'}
          </button>
          {cargandoPlan && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 48, height: 8, background: '#F0EBE3', borderRadius: 100, animation: `pulse 1.5s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          )}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    );
  }

  const eventos = [
    { key: 'desayuno', hora: '7:30', titulo: 'Desayuno', icono: '🌅', contenido: diaData?.desayuno, color: '#E8A020', bg: '#FFF8EC', border: '#F9CFA8', esEntreno: false },
    entreno ? { key: 'entreno', hora: '10:00', titulo: entreno?.tipo || 'Entrenamiento', icono: '🏋️', contenido: null, ejercicios: entreno?.ejercicios, color: C.green, bg: C.greenPale, border: '#C8E8B0', esEntreno: true } : null,
    { key: 'comida', hora: '13:30', titulo: 'Comida', icono: '☀️', contenido: diaData?.comida, snack: diaData?.snack, color: C.orange, bg: C.orangePale, border: '#F9CFA8', esEntreno: false },
    { key: 'cena', hora: '20:30', titulo: 'Cena', icono: '🌙', contenido: diaData?.cena, color: '#5B6FA8', bg: '#EEF0FA', border: '#C8CEEA', esEntreno: false },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pop{0%{transform:scale(0.8)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
      `}</style>

      {/* Modal rutina completa */}
      {verRutina && entreno && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setVerRutina(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.white, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 720, maxHeight: '75vh', overflow: 'auto', padding: '24px 24px 40px', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.dark }}>{entreno.tipo}</div>
                <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{DIAS_FULL[diaHoy]}</div>
              </div>
              <button onClick={() => setVerRutina(false)} style={{ background: C.bg, border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entreno.ejercicios?.map((ej, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: C.greenPale, borderRadius: 12, border: '1px solid #C8E8B0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                  <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.5, paddingTop: 4 }}>{ej}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.light}`, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: C.green, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Plan de hoy</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.white }}>{DIAS_FULL[diaHoy]}</div>
            </div>
            <button onClick={onAbrirConfig} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.white, width: 36, height: 36, borderRadius: '50%', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
          </div>
          {/* Barra progreso */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Progreso del día</span>
              <span style={{ fontSize: 11, color: C.white, fontWeight: 700 }}>{totalChecks}/{totalItems}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: progreso === 100 ? '#C8E8B0' : C.white, borderRadius: 100, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* Celebración */}
        {celebrado && progreso === 100 && (
          <div style={{ background: `linear-gradient(135deg, ${C.green}, #3B6D11)`, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 22, animation: 'pop 0.4s ease' }}>🎉</span>
            <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>¡Día perfecto! Tu metabolismo te lo agradecerá mañana.</div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ padding: '20px 20px 24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, background: C.light, borderRadius: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {eventos.map((ev, idx) => {
                const completado = checks[ev.key];
                const esActual = ev.key === eventoActivo && !completado;
                const esSustituyendo = sustituyendo === ev.key;
                const estaCargando = cargandoSustitucion === ev.key;
                const exito = sustitucionExito === ev.key;

                return (
                  <div key={ev.key} style={{ display: 'flex', gap: 16, paddingBottom: idx < eventos.length - 1 ? 16 : 0 }}>
                    {/* Dot */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: completado ? C.green : esActual ? ev.color : C.white, border: `2px solid ${completado ? C.green : esActual ? ev.color : C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: completado ? 16 : 18, boxShadow: esActual ? `0 0 0 4px ${ev.color}22` : 'none', transition: 'all 0.3s ease', zIndex: 1, position: 'relative' }}>
                        {completado ? '✓' : ev.icono}
                      </div>
                    </div>

                    {/* Card */}
                    <div style={{ flex: 1, background: exito ? '#F0FDF4' : completado ? '#F8FDF5' : ev.bg, border: `1.5px solid ${exito ? C.green : completado ? '#C8E8B0' : ev.border}`, borderRadius: 16, padding: '14px 16px', opacity: completado ? 0.75 : 1, transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>

                      {/* Línea top "ahora" */}
                      {esActual && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${ev.color},transparent)`, borderRadius: '16px 16px 0 0' }} />}
                      {/* Badge éxito sustitución */}
                      {exito && <div style={{ position: 'absolute', top: 8, right: 8, background: C.green, color: C.white, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, animation: 'pop 0.4s ease' }}>✓ Actualizado</div>}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, marginRight: 8 }}>
                          {/* Título + hora */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: ev.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ev.titulo}</span>
                            <span style={{ fontSize: 9, color: C.mid }}>{ev.hora}</span>
                            {esActual && <span style={{ fontSize: 9, background: ev.color, color: C.white, padding: '1px 7px', borderRadius: 100, fontWeight: 700 }}>ahora</span>}
                            {estaCargando && <span style={{ fontSize: 9, color: C.orange }}>actualizando...</span>}
                          </div>

                          {/* Contenido */}
                          {ev.esEntreno ? (
                            <div>
                              <div style={{ marginBottom: 8 }}>
                                {entreno?.ejercicios?.slice(0, 2).map((ej, j) => (
                                  <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                                    <span style={{ color: C.green, flexShrink: 0, fontSize: 10, marginTop: 2 }}>▸</span>
                                    <span style={{ fontSize: 12, color: C.dark, textDecoration: completado ? 'line-through' : 'none' }}>{ej}</span>
                                  </div>
                                ))}
                                {entreno?.ejercicios?.length > 2 && <div style={{ fontSize: 11, color: C.mid }}>+{entreno.ejercicios.length - 2} más</div>}
                              </div>
                              <button onClick={() => setVerRutina(true)} style={{ background: 'none', border: `1px solid ${C.green}`, color: C.green, padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
                                Ver rutina completa →
                              </button>
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.55, textDecoration: completado ? 'line-through' : 'none', textDecorationColor: C.mid }}>
                              {ev.contenido || '—'}
                            </div>
                          )}

                          {ev.snack && !completado && (
                            <div style={{ marginTop: 8, padding: '5px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, fontSize: 11, color: C.mid }}>
                              🍎 Snack: {ev.snack}
                            </div>
                          )}

                          {/* Input sustitución */}
                          {esSustituyendo && (
                            <SubstituteInput
                              onEnviar={(peticion) => sustituir(ev.key, peticion)}
                              onCancelar={() => setSustituyendo(null)}
                              cargando={estaCargando}
                            />
                          )}

                          {/* Botón sustituir — solo si no está completado y no es entrada abierta */}
                          {!completado && !esSustituyendo && !estaCargando && (
                            <button
                              onClick={() => setSustituyendo(ev.key)}
                              style={{ marginTop: 8, background: 'none', border: 'none', color: C.mid, fontSize: 10, cursor: 'pointer', fontFamily: font, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              🔄 <span style={{ textDecoration: 'underline' }}>Adaptar</span>
                            </button>
                          )}
                        </div>

                        {/* Check button */}
                        <button onClick={() => toggleCheck(ev.key)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${completado ? C.green : C.light}`, background: completado ? C.green : C.white, color: completado ? C.white : C.light, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s ease' }}>
                          ✓
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={onGenerarPlan} style={{ background: 'none', border: 'none', color: '#C0B8B0', fontSize: 11, cursor: 'pointer', fontFamily: font, textDecoration: 'underline' }}>
              Regenerar plan esta semana
            </button>
          </div>
        </div>
      </div>
    </>
  );
}