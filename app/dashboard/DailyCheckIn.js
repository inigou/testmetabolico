'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const hoy = () => new Date().toISOString().split('T')[0];

const getColorEnergia = (v) => v >= 7 ? C.green : v >= 4 ? '#F9A825' : C.orange;
const getColorSueno   = (v) => v >= 7 ? C.green : v >= 4 ? '#F9A825' : C.orange;
const getColorEstres  = (v) => v <= 3 ? C.green : v <= 6 ? '#F9A825' : C.orange;

async function fetchCheckInHoy(email) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/daily_logs?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy()}&select=energia,sueno,estres,completed_tasks`,
      { headers: sbH }
    );
    const rows = await res.json();
    return rows?.[0] || null;
  } catch (e) {
    console.error('fetchCheckInHoy error:', e);
    return null;
  }
}

async function upsertCheckIn(email, energia, sueno, estres, completedTasks = {}) {
  try {
    await fetch(`${SB_URL}/rest/v1/daily_logs`, {
      method: 'POST',
      headers: { ...sbH, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        email,
        fecha: hoy(),
        energia,
        sueno,
        estres,
        completed_tasks: completedTasks,
      }),
    });
  } catch (e) {
    console.error('upsertCheckIn error:', e);
  }
}

export default function DailyCheckIn({ email, perfil, objetivoId, onWeatherUpdate, completedTasksHoy }) {
  const [energia, setEnergia] = useState(7);
  const [sueno, setSueno]     = useState(7);
  const [estres, setEstres]   = useState(4);
  const [guardando, setGuardando]         = useState(false);
  const [cargandoWeather, setCargandoWeather] = useState(false);
  const [weather, setWeather]             = useState(null);
  const [yaHizoCheckIn, setYaHizoCheckIn] = useState(false);
  const [inicializando, setInicializando] = useState(true);

  // ── Carga inicial: Supabase primero, localStorage como fallback ───
  useEffect(() => {
    if (!email) return;

    const init = async () => {
      setInicializando(true);

      // 1. Intentar cargar desde Supabase (fuente de verdad)
      const logBD = await fetchCheckInHoy(email);

      if (logBD) {
        // Ya hizo check-in hoy en cualquier dispositivo
        setEnergia(logBD.energia || 7);
        setSueno(logBD.sueno || 7);
        setEstres(logBD.estres || 4);
        setYaHizoCheckIn(true);

        // Intentar recuperar weather del cache local (no se guarda en BD)
        const cacheKey = `checkin_${email}_${hoy()}`;
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
          if (cached.weather) {
            setWeather(cached.weather);
            if (onWeatherUpdate) onWeatherUpdate(cached.weather);
          } else {
            // Regenerar weather con los datos de BD
            await generarWeather(logBD.energia, logBD.sueno, logBD.estres, false);
          }
        } catch (e) {
          await generarWeather(logBD.energia, logBD.sueno, logBD.estres, false);
        }
      } else {
        // No hay check-in hoy — limpiar estado por si acaso
        setYaHizoCheckIn(false);
        setWeather(null);
      }

      setInicializando(false);
    };

    init();
  }, [email]);

  const generarWeather = async (e, s, st, guardarCache = true) => {
    setCargandoWeather(true);
    try {
      const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
      const objetivo = cfg.objetivoId || objetivoId || 'mantener';
      const scores = perfil || {};
      const allScores = [
        { nombre: 'actividad física',    val: scores.efh_score },
        { nombre: 'composición corporal', val: scores.eco_score },
        { nombre: 'nutrición',           val: scores.nut_score },
        { nombre: 'descanso',            val: scores.des_score },
        { nombre: 'vitalidad',           val: scores.vit_score },
      ];
      const peorBloque = allScores.reduce((a, b) => (a.val || 0) < (b.val || 0) ? a : b).nombre;

      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin: { energia: e, sueno: s, estres: st },
          perfil: { icm: scores.icm_total, peor_bloque: peorBloque },
          objetivo,
        }),
      });
      const weatherData = await res.json();
      setWeather(weatherData);
      if (onWeatherUpdate) onWeatherUpdate(weatherData);

      // Guardar weather en cache local (no va a BD — es efímero)
      if (guardarCache) {
        try {
          localStorage.setItem(`checkin_${email}_${hoy()}`, JSON.stringify({
            energia: e, sueno: s, estres: st, weather: weatherData,
          }));
        } catch (err) { console.error(err); }
      }
    } catch (e) {
      console.error('generarWeather error:', e);
      setWeather({ estado: 'Día Estable 🌤️', consejo: 'Mantén tu rutina de hoy.' });
    }
    setCargandoWeather(false);
  };

  const guardar = async () => {
    if (!email || guardando) return;
    setGuardando(true);

    // Guardar en Supabase (fuente de verdad)
    await upsertCheckIn(email, energia, sueno, estres, completedTasksHoy || {});

    // Generar weather
    await generarWeather(energia, sueno, estres, true);

    setGuardando(false);
    setYaHizoCheckIn(true);
  };

  const sliders = [
    { label: 'Energía', val: energia, set: setEnergia, getColor: getColorEnergia, emoji: '⚡', desc: ['Agotado', 'Bajo', 'Normal', 'Activo', 'Excelente'] },
    { label: 'Sueño',   val: sueno,   set: setSueno,   getColor: getColorSueno,   emoji: '😴', desc: ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Perfecto'] },
    { label: 'Estrés',  val: estres,  set: setEstres,  getColor: getColorEstres,  emoji: '🧠', desc: ['Nulo', 'Leve', 'Moderado', 'Alto', 'Máximo'] },
  ];
  const getDesc = (v, arr) => arr[Math.min(4, Math.floor((v - 1) / 2))];

  if (inicializando) {
    return (
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.mid }}>Cargando tu estado de hoy...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Weather card */}
      {weather && (
        <div style={{ background: `linear-gradient(135deg, ${C.green}, #3B6D11)`, borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tu estado metabólico hoy</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.white, marginBottom: 8 }}>{weather.estado}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, maxWidth: 340 }}>{weather.consejo}</div>
          </div>
          <div style={{ fontSize: 48, flexShrink: 0, marginLeft: 12 }}>{weather.estado?.split(' ').pop()}</div>
        </div>
      )}

      {/* Check-in card */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
        <div style={{ background: C.orange, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: C.white }}>Check-in diario</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          {yaHizoCheckIn && (
            <div style={{ background: 'rgba(255,255,255,0.2)', color: C.white, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
              ✓ Completado
            </div>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          {sliders.map((s, i) => (
            <div key={i} style={{ marginBottom: i < sliders.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.mid }}>{getDesc(s.val, s.desc)}</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: s.getColor(s.val), fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{s.val}</span>
                </div>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                value={s.val}
                onChange={e => { if (!yaHizoCheckIn) s.set(+e.target.value); }}
                disabled={yaHizoCheckIn}
                style={{ width: '100%', accentColor: s.getColor(s.val), cursor: yaHizoCheckIn ? 'default' : 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#C0B8B0', marginTop: 2 }}>
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>
          ))}

          {!yaHizoCheckIn && (
            <button onClick={guardar} disabled={guardando} style={{
              width: '100%', marginTop: 20,
              background: guardando ? '#C8E8B0' : C.green,
              color: C.white, border: 'none',
              padding: '13px', borderRadius: 100,
              fontSize: 13, fontWeight: 600,
              cursor: guardando ? 'not-allowed' : 'pointer',
              fontFamily: font,
            }}>
              {guardando ? 'Analizando tu estado...' : 'Ver mi estado metabólico de hoy'}
            </button>
          )}

          {cargandoWeather && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.mid }}>
              Calculando Metabolic Weather...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}