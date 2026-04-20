'use client';
import { useState, useEffect } from 'react';

const C = {
  bg:        '#ffffff',
  panel:     '#F0F8FA',
  accent:    '#18778f',
  accentDk:  '#0D5F73',
  accentLt:  '#D1ECF1',
  orange:    '#E8621A',
  white:     '#FFFFFF',
  dark:      '#111827',
  mid:       '#4B5563',
  light:     '#D1ECF1',
  // columna izquierda oscura
  leftBg:    '#0F2A35',
  leftPanel: '#163545',
  // timeline boxes
  boxBg:     '#18778f',
  green:     '#18778f',
  greenPale: '#D1ECF1',
  orangePale:'#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const getDiaHoy       = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const getHora         = () => new Date().getHours();
const getEventoActivo = () => { const h = getHora(); if (h < 10) return 'desayuno'; if (h < 14) return 'entreno'; if (h < 16) return 'comida'; return 'cena'; };
const fechaStr        = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().split('T')[0]; };
const diaDeStr        = (str) => { const d = new Date(str + 'T12:00:00'); return d.getDay() === 0 ? 6 : d.getDay() - 1; };

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function actualizarCompletedTasks(email, fecha, tasks) {
  try {
    await fetch(`${SB_URL}/rest/v1/daily_logs`, {
      method: 'POST',
      headers: { ...sbH, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ email, fecha, completed_tasks: tasks }),
    });
  } catch (e) { console.error(e); }
}

async function cargarLogDia(email, fecha) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${fecha}&select=completed_tasks`,
      { headers: sbH }
    );
    const rows = await res.json();
    return rows?.[0] || null;
  } catch (e) { return null; }
}

// ── Input sustitución ────────────────────────────────────────────────
function SubstituteInput({ onEnviar, onCancelar, cargando, placeholder }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: C.white, borderRadius: 10, border: `1px solid ${C.orange}`, animation: 'fadeIn 0.15s ease' }}>
      <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        🔄 ¿Qué quieres cambiar?
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) onEnviar(val); if (e.key === 'Escape') onCancelar(); }}
          placeholder={placeholder || 'Ej: No tengo salmón, tengo pollo...'}
          style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 12, fontFamily: font, outline: 'none', color: C.dark, background: C.bg }} />
        <button onClick={() => val.trim() && onEnviar(val)} disabled={cargando || !val.trim()}
          style={{ background: cargando ? C.light : C.orange, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 100, fontSize: 12, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, flexShrink: 0 }}>
          {cargando ? '...' : 'Aplicar'}
        </button>
        <button onClick={onCancelar} style={{ background: 'none', border: `1px solid ${C.light}`, color: C.mid, padding: '8px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font }}>✕</button>
      </div>
    </div>
  );
}

// ── Quick Add ────────────────────────────────────────────────────────
function QuickAddInput({ onEnviar, cargando }) {
  const [val, setVal] = useState('');
  const [exito, setExito] = useState(null);

  const enviar = async () => {
    if (!val.trim() || cargando) return;
    const texto = val; setVal('');
    const resultado = await onEnviar(texto);
    if (resultado) { setExito(resultado); setTimeout(() => setExito(null), 4000); }
  };

  return (
    <div style={{ marginTop: 20, padding: '14px 16px', background: '#F0F8FA', borderRadius: 14, border: `1.5px dashed ${C.accentLt}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4 }}>⚡ Entrada rápida</div>
      <div style={{ fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>
        ¿Algo extra hoy? Escríbelo y lo añadimos al contador calórico
        <br /><span style={{ fontSize: 10, color: '#C0B8B0' }}>Ej: "2 copas de vino", "Caminata extra 30 min"</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="¿Qué has tomado o hecho extra?"
          style={{ flex: 1, padding: '9px 14px', border: `1.5px solid ${C.accentLt}`, borderRadius: 100, fontSize: 16, fontFamily: font, outline: 'none', color: C.dark, background: '#fff' }} />
        <button onClick={enviar} disabled={cargando || !val.trim()}
          style={{ background: cargando ? C.accentLt : C.accent, color: C.white, border: 'none', padding: '9px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: font, flexShrink: 0 }}>
          {cargando ? '...' : 'Añadir'}
        </button>
      </div>
      {exito && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: exito.tipo === 'ingesta' ? C.orangePale : C.greenPale, borderRadius: 8, fontSize: 11, color: exito.tipo === 'ingesta' ? '#C05010' : '#3B6D11', animation: 'fadeIn 0.2s ease' }}>
          {exito.tipo === 'ingesta' ? '🍽️' : '🏃'} <strong>{exito.kcal} kcal</strong> {exito.tipo === 'ingesta' ? 'añadidas' : 'gastadas'} — {exito.descripcion}
        </div>
      )}
    </div>
  );
}


// ── TareaCard — con auto-colapso reversible y highlight de siguiente acción ──
function TareaCard({
  ev, completado, esActual, esSiguiente, esSust, estaCarg, exito,
  modoLectura, entreno, diaData, font, C,
  onToggleCheck, onSustituir, onCancelarSust, onVerRutina,
}) {
  const [isExpanded, setIsExpanded] = useState(!completado);

  // Cuando se completa → colapsar automáticamente
  useEffect(() => {
    if (completado) setIsExpanded(false);
    else setIsExpanded(true);
  }, [completado]);

  // Borde: siguiente más sólido, completado semitransparente
  const borderColor = exito ? '#0D5F73'
    : esSiguiente ? '#0D5F73'
    : completado  ? '#0D5F73'
    : ev.border;

  const boxShadow = esSiguiente && !completado
    ? '0 4px 16px rgba(24,119,143,0.3)'
    : '0 2px 8px rgba(24,119,143,0.1)';

  return (
    <div style={{ flex: 1,
      background: completado ? `${ev.bg}BB` : ev.bg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 14, padding: '12px 14px',
      opacity: completado && !isExpanded ? 0.65 : 1,
      transition: 'all 0.25s ease',
      position: 'relative', overflow: 'hidden',
      boxShadow,
      cursor: completado ? 'pointer' : 'default',
    }}
      onClick={completado && !esSust ? () => setIsExpanded(v => !v) : undefined}
    >
      {/* Línea de acento superior — solo en siguiente acción */}
      {esSiguiente && !completado && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg,rgba(255,255,255,0.4),transparent)',
          borderRadius: '16px 16px 0 0' }} />
      )}
      {esActual && !esSiguiente && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg,${ev.color},transparent)`,
          borderRadius: '16px 16px 0 0' }} />
      )}
      {exito && (
        <div style={{ position: 'absolute', top: 8, right: 44,
          background: '#14B8A6', color: '#fff', fontSize: 9, fontWeight: 700,
          padding: '2px 8px', borderRadius: 100, animation: 'pop 0.4s ease' }}>
          ✓ Actualizado
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: 8 }}>

          {/* Header siempre visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isExpanded ? 6 : 0, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ev.titulo}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{ev.hora}</span>
            {ev.kcal > 0 && (
              <span style={{ fontSize: 9,
                background: ev.esEntreno ? 'rgba(255,255,255,0.18)' : 'rgba(232,98,26,0.3)',
                color: ev.esEntreno ? '#fff' : '#FFB385',
                padding: '1px 7px', borderRadius: 100, fontWeight: 700 }}>
                {ev.esEntreno ? `−${ev.kcal} kcal` : `${ev.kcal} kcal`}
              </span>
            )}
            {esSiguiente && !completado && (
              <span style={{ fontSize: 9, background: '#fff', color: '#18778f',
                padding: '1px 7px', borderRadius: 100, fontWeight: 700 }}>siguiente →</span>
            )}
            {estaCarg && <span style={{ fontSize: 9, color: '#E8621A' }}>actualizando...</span>}
            {/* Hint de expansión cuando está colapsado */}
            {completado && (
              <span style={{ fontSize: 9, color: '#9CA3AF', marginLeft: 'auto' }}>
                {isExpanded ? '▲ colapsar' : '▼ ver detalle'}
              </span>
            )}
          </div>

          {/* Contenido — solo si isExpanded */}
          {isExpanded && (
            <>
              {ev.esEntreno ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    {entreno?.ejercicios?.slice(0, 2).map((ej, j) => (
                      <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0, fontSize: 10, marginTop: 2 }}>▸</span>
                        <span style={{ fontSize: 12, color: '#111827',
                          textDecoration: completado ? 'line-through' : 'none',
                          textDecorationColor: '#9CA3AF' }}>{ej}</span>
                      </div>
                    ))}
                    {entreno?.ejercicios?.length > 2 && (
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        +{entreno.ejercicios.length - 2} más
                      </div>
                    )}
                  </div>
                  {!completado && (
                    <button onClick={e => { e.stopPropagation(); onVerRutina(); }}
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
                        padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: font }}>
                      Ver rutina completa →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55,
                  textDecoration: completado ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(255,255,255,0.4)' }}>
                  {ev.contenido || '—'}
                </div>
              )}

              {ev.snack && !completado && (
                <div style={{ marginTop: 8, padding: '5px 10px',
                  background: 'rgba(0,0,0,0.15)', borderRadius: 8,
                  fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  🍎 Snack: {ev.snack} {diaData?.kcal_snack ? `· ${diaData.kcal_snack} kcal` : ''}
                </div>
              )}

              {esSust && (
                <SubstituteInput
                  onEnviar={p => { onSustituir(ev.key, p); }}
                  onCancelar={onCancelarSust}
                  cargando={estaCarg}
                  placeholder={ev.esEntreno ? 'Ej: Hoy prefiero surf 90 min...' : 'Ej: No tengo salmón, tengo pollo...'}
                />
              )}

              {!completado && !esSust && !estaCarg && !modoLectura && (
                <button onClick={e => { e.stopPropagation(); onSustituir(ev.key); }}
                  style={{ marginTop: 8, background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer',
                    fontFamily: font, padding: '2px 0',
                    display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔄 <span style={{ textDecoration: 'underline' }}>Adaptar</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Check button — siempre visible, stopPropagation para no toggle expand */}
        <button
          onClick={e => { e.stopPropagation(); onToggleCheck(ev.key); }}
          style={{ width: 32, height: 32, borderRadius: '50%',
            border: `2px solid ${completado ? '#fff' : 'rgba(255,255,255,0.3)'}`,
            background: completado ? '#fff' : 'rgba(255,255,255,0.1)',
            color: completado ? '#18778f' : 'rgba(255,255,255,0.3)',
            fontSize: 14, cursor: modoLectura ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.25s ease',
            opacity: modoLectura ? 0.6 : 1 }}>
          ✓
        </button>
      </div>
    </div>
  );
}

export default function DailyTimeline({
  planSemanal, setPlanSemanal,
  email, objetivoId,
  onAbrirConfig, onTodoCompletado, onGenerarPlan, cargandoPlan, objetivo,
  onChecksChange, onGastoActividadChange,
  modoRescate,
  protocolos = [],   // chips de Banana — array de strings con emoji
}) {
  const diaHoy       = getDiaHoy();
  const eventoActivo = getEventoActivo();

  const [offsetDia, setOffsetDia]         = useState(0);
  const esHoy       = offsetDia === 0;
  const fechaActiva = fechaStr(offsetDia);
  const diaIndice   = diaDeStr(fechaActiva);

  const [checks, setChecks]                     = useState({ desayuno: false, comida: false, cena: false, entreno: false });
  const [checksListos, setChecksListos]         = useState(false);
  const [modoLectura, setModoLectura]           = useState(false);
  const [cargandoAyer, setCargandoAyer]         = useState(false);
  const [verRutina, setVerRutina]               = useState(false);
  const [celebrado, setCelebrado]               = useState(false);
  const [sustituyendo, setSustituyendo]         = useState(null);
  const [cargandoSustitucion, setCargandoSustitucion] = useState(false);
  const [sustitucionExito, setSustitucionExito] = useState(null);
  const [mensajeCoachSustitucion, setMensajeCoachSustitucion] = useState(null);
  const [quickAddCargando, setQuickAddCargando] = useState(false);
  const [gastoExtraLocal, setGastoExtraLocal]   = useState(0);
  const [ingestaExtra, setIngestaExtra]         = useState(0);

  const diaData = planSemanal?.dieta?.[diaIndice];
  const entreno = planSemanal?.ejercicios?.[diaIndice];


  const kcalPorTarea = {
    desayuno: diaData?.kcal_desayuno || 0,
    comida:   diaData?.kcal_comida   || 0,
    cena:     diaData?.kcal_cena     || 0,
  };

  // Cargar checks de hoy desde localStorage
  useEffect(() => {
    if (!email || !esHoy) return;
    try {
      const s = localStorage.getItem(`checks_${email}_${fechaActiva}`);
      if (s) setChecks(JSON.parse(s));
    } catch (e) {}
    setChecksListos(true); // solo persistir DESPUÉS de haber cargado
  }, [email, fechaActiva]);

  // Cargar ayer desde Supabase
  useEffect(() => {
    if (!email || esHoy) return;
    setCargandoAyer(true); setModoLectura(true);
    cargarLogDia(email, fechaActiva).then(log => {
      if (log?.completed_tasks) {
        setChecks(typeof log.completed_tasks === 'string' ? JSON.parse(log.completed_tasks) : log.completed_tasks);
      } else {
        setChecks({ desayuno: false, comida: false, cena: false, entreno: false });
      }
      setCargandoAyer(false);
    });
  }, [email, fechaActiva]);

  // Persistir checks hoy — solo si ya se han cargado del localStorage
  useEffect(() => {
    if (!email || !esHoy || !checksListos) return;
    try { localStorage.setItem(`checks_${email}_${fechaActiva}`, JSON.stringify(checks)); } catch (e) {}
    actualizarCompletedTasks(email, fechaActiva, checks).catch(console.error);
    if (onChecksChange) onChecksChange(checks);
    const relevantes = entreno
      ? [checks.desayuno, checks.comida, checks.cena, checks.entreno]
      : [checks.desayuno, checks.comida, checks.cena];
    if (relevantes.every(Boolean) && !celebrado) {
      setCelebrado(true);
      if (onTodoCompletado) onTodoCompletado();
    }
  }, [checks]);

  const toggleCheck = (key) => { if (modoLectura) return; setChecks(prev => ({ ...prev, [key]: !prev[key] })); };

  const sustituir = async (eventoKey, peticion) => {
    if (!peticion.trim()) return;
    setSustituyendo(null);
    setCargandoSustitucion(eventoKey);
    setMensajeCoachSustitucion(null);
    const esEntreno = eventoKey === 'entreno';
    const contenidoActual = esEntreno
      ? `${entreno?.tipo || 'Entrenamiento'}: ${entreno?.ejercicios?.join(', ')}`
      : diaData?.[eventoKey] || '';
    try {
      const res = await fetch('/api/substitute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comida_actual: contenidoActual,
          kcal_actual: esEntreno ? entreno?.kcal_quemadas : kcalPorTarea[eventoKey],
          peticion, tipo: esEntreno ? 'entreno' : eventoKey,
          objetivo: objetivo?.nombre || 'mantener peso',
          peso_usuario: 75,
        }),
      });
      const data = await res.json();
      if (data.sustitucion && planSemanal && setPlanSemanal) {
        const nuevo = JSON.parse(JSON.stringify(planSemanal));
        if (esEntreno) {
          if (nuevo.ejercicios?.[diaIndice]) {
            nuevo.ejercicios[diaIndice].tipo = data.sustitucion;
            nuevo.ejercicios[diaIndice].ejercicios = [data.sustitucion];
            if (data.kcal_nuevas != null) nuevo.ejercicios[diaIndice].kcal_quemadas = data.kcal_nuevas;
          }
          if (data.delta_kcal && onGastoActividadChange) { onGastoActividadChange(data.delta_kcal); setGastoExtraLocal(prev => prev + data.delta_kcal); }
          if (data.mensaje_coach) { setMensajeCoachSustitucion(data.mensaje_coach); setTimeout(() => setMensajeCoachSustitucion(null), 6000); }
        } else {
          nuevo.dieta[diaIndice][eventoKey] = data.sustitucion;
          if (data.kcal_nuevas != null) nuevo.dieta[diaIndice][`kcal_${eventoKey}`] = data.kcal_nuevas;
        }
        setPlanSemanal(nuevo);
        try { localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: nuevo, fecha: Date.now() })); } catch (e) {}
        setSustitucionExito(eventoKey);
        setTimeout(() => setSustitucionExito(null), 2500);
      }
    } catch (e) { console.error(e); }
    setCargandoSustitucion(null);
  };

  const procesarQuickAdd = async (texto) => {
    setQuickAddCargando(true);
    try {
      const res = await fetch('/api/substitute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comida_actual: texto, peticion: 'calcular_kcal', tipo: 'quick_add', objetivo: objetivo?.nombre || 'mantener peso' }),
      });
      const data = await res.json();
      const kcal = Math.abs(data.delta_kcal || data.kcal_nuevas || 0);
      const tipo = data.tipo_quick_add || (data.delta_kcal < 0 ? 'gasto' : 'ingesta');
      if (tipo === 'gasto') { if (onGastoActividadChange) onGastoActividadChange(kcal); setGastoExtraLocal(prev => prev + kcal); }
      else { setIngestaExtra(prev => prev + kcal); }
      setQuickAddCargando(false);
      return { kcal, tipo, descripcion: data.sustitucion || texto };
    } catch (e) { console.error(e); setQuickAddCargando(false); return null; }
  };

  const totalItems  = entreno ? 4 : 3;
  const totalChecks = [checks.desayuno, checks.comida, checks.cena, entreno ? checks.entreno : true].filter(Boolean).length;
  const progreso    = Math.round((totalChecks / totalItems) * 100);

  // ── Vista sin plan ───────────────────────────────────────────────
  if (!planSemanal) {
    return (
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
        <div style={{ background: C.accent, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            Genera tu plan personalizado con comidas, entrenamiento y seguimiento calórico.
          </div>
          <button onClick={onGenerarPlan} disabled={cargandoPlan}
            style={{ background: cargandoPlan ? C.light : C.green, color: C.white, border: 'none', padding: '13px 32px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: cargandoPlan ? 'not-allowed' : 'pointer', fontFamily: font }}>
            {cargandoPlan ? '⏳ Generando tu plan...' : 'Generar mi plan semanal →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Eventos del timeline ─────────────────────────────────────────
  // NOTA: ya no hay bloque "planTieneKcal" — el plan se muestra siempre
  const eventos = [
    { key: 'desayuno', hora: '7:30',  titulo: 'Desayuno', icono: '🌅', contenido: diaData?.desayuno, kcal: kcalPorTarea.desayuno, color: C.accent, bg: C.boxBg, border: C.accentDk, esEntreno: false },
    entreno ? { key: 'entreno', hora: '10:00', titulo: entreno?.tipo || 'Entrenamiento', icono: '🏋️', ejercicios: entreno?.ejercicios, kcal: entreno?.kcal_quemadas || 0, color: C.accent, bg: C.boxBg, border: C.accentDk, esEntreno: true } : null,
    { key: 'comida',   hora: '13:30', titulo: 'Comida',   icono: '☀️', contenido: diaData?.comida,   kcal: kcalPorTarea.comida, snack: diaData?.snack, color: C.accent, bg: C.boxBg, border: C.accentDk, esEntreno: false },
    { key: 'cena',     hora: '20:30', titulo: 'Cena',     icono: '🌙', contenido: diaData?.cena,     kcal: kcalPorTarea.cena,   color: C.accent, bg: C.boxBg, border: C.accentDk, esEntreno: false },
  ].filter(Boolean);

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes pop{0%{transform:scale(0.8)}50%{transform:scale(1.15)}100%{transform:scale(1)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Modal rutina completa */}
      {verRutina && entreno && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setVerRutina(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.white, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 720, maxHeight: '75vh', overflow: 'auto', padding: '24px 24px 40px', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.dark }}>{entreno.tipo}</div>
                <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{entreno.kcal_quemadas ? `~${entreno.kcal_quemadas} kcal quemadas` : DIAS_FULL[diaIndice]}</div>
              </div>
              <button onClick={() => setVerRutina(false)} style={{ background: C.bg, border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entreno.ejercicios?.map((ej, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: C.greenPale, borderRadius: 12, border: '1px solid #C8E8B0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.5, paddingTop: 4 }}>{ej}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.light}`, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: modoLectura ? '#4B5563' : C.accent, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {modoLectura ? '📖 Vista de ayer' : 'Plan de hoy'}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.white }}>{DIAS_FULL[diaIndice]}</div>

              {/* Protocolos activos de Banana */}
              {esHoy && protocolos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {protocolos.map((p, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: C.white,
                      borderRadius: 100,
                      padding: '3px 10px',
                      fontSize: 10, fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '0.02em',
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => { setOffsetDia(-1); setModoLectura(true); }} style={{ background: offsetDia === -1 ? C.white : 'rgba(255,255,255,0.2)', border: 'none', color: offsetDia === -1 ? C.green : C.white, padding: '6px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>← Ayer</button>
              <button onClick={() => { setOffsetDia(0); setModoLectura(false); }} style={{ background: offsetDia === 0 ? C.white : 'rgba(255,255,255,0.2)', border: 'none', color: offsetDia === 0 ? C.green : C.white, padding: '6px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Hoy</button>
              <button onClick={onAbrirConfig} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.white, width: 36, height: 36, borderRadius: '50%', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Configurar plantilla base">⚙️</button>
            </div>
          </div>


          {modoLectura && (
            <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
              📖 Modo lectura — lo que marcaste ayer
            </div>
          )}
        </div>

        {/* Mensaje coach sustitución */}
        {mensajeCoachSustitucion && (
          <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 12, color: '#3B6D11', lineHeight: 1.5 }}>{mensajeCoachSustitucion}</span>
          </div>
        )}

        {/* Celebración */}
        {celebrado && progreso === 100 && esHoy && (
          <div style={{ background: `linear-gradient(135deg,${C.green},#3B6D11)`, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 22, animation: 'pop 0.4s ease' }}>🎉</span>
            <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>¡Día perfecto! Tu metabolismo te lo agradecerá mañana.</div>
          </div>
        )}

        {cargandoAyer && <div style={{ padding: '24px', textAlign: 'center', color: C.mid, fontSize: 13 }}>Cargando datos de ayer...</div>}

        {/* Timeline */}
        {!cargandoAyer && (
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, background: 'rgba(24,119,143,0.2)', borderRadius: 2 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(() => {
                  // Primera tarea incompleta del día = "siguiente acción"
                  const primeraPendiente = eventos.find(e => !checks[e.key])?.key || null;
                  return eventos.map((ev, idx) => {
                    const completado   = checks[ev.key];
                    const esActual     = ev.key === eventoActivo && !completado && esHoy;
                    const esSiguiente  = ev.key === primeraPendiente && esHoy;
                    const esSust       = sustituyendo === ev.key;
                    const estaCarg     = cargandoSustitucion === ev.key;
                    const exito        = sustitucionExito === ev.key;

                    return (
                      <div key={ev.key} style={{ display: 'flex', gap: 16, paddingBottom: idx < eventos.length - 1 ? 16 : 0 }}>
                        {/* Icono lateral */}
                        <div style={{ flexShrink: 0 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: completado ? '#18778f' : esSiguiente ? '#18778f' : '#fff',
                            border: `2px solid ${completado ? '#0D5F73' : esSiguiente ? '#0D5F73' : '#D1ECF1'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: completado ? 16 : 18,
                            boxShadow: esSiguiente && !completado ? '0 0 0 3px rgba(20,184,166,0.2)' : 'none',
                            transition: 'all 0.3s ease', zIndex: 1, position: 'relative',
                          }}>
                            {completado ? '✓' : ev.icono}
                          </div>
                        </div>

                        {/* Tarjeta */}
                        <TareaCard
                          ev={ev}
                          completado={completado}
                          esActual={esActual}
                          esSiguiente={esSiguiente}
                          esSust={esSust}
                          estaCarg={estaCarg}
                          exito={exito}
                          modoLectura={modoLectura}
                          entreno={entreno}
                          diaData={diaData}
                          font={font}
                          C={C}
                          onToggleCheck={toggleCheck}
                          onSustituir={(key, peticion) => peticion ? sustituir(key, peticion) : setSustituyendo(key)}
                          onCancelarSust={() => setSustituyendo(null)}
                          onVerRutina={() => setVerRutina(true)}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Quick Add */}
            {esHoy && !modoLectura && (
              <QuickAddInput onEnviar={procesarQuickAdd} cargando={quickAddCargando} />
            )}

            {/* Regenerar plan — solo visible, sin banner intrusivo */}
            {esHoy && (
              <div style={{ marginTop: 16, paddingBottom: 20, textAlign: 'center' }}>
                <button onClick={onGenerarPlan} disabled={cargandoPlan} style={{ background: 'none', border: 'none', color: '#C0B8B0', fontSize: 11, cursor: 'pointer', fontFamily: font, textDecoration: 'underline' }}>
                  {cargandoPlan ? 'Generando...' : 'Regenerar plan esta semana'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}