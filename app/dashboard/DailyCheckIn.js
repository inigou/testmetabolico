'use client';
import { useState, useEffect } from 'react';
import { guardarCheckInDB } from '../../lib/supabase';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const hoy = () => new Date().toISOString().split('T')[0];
const getColorEnergia = (v) => v >= 7 ? C.green : v >= 4 ? '#F9A825' : C.orange;
const getColorSueno = (v) => v >= 7 ? C.green : v >= 4 ? '#F9A825' : C.orange;
const getColorEstres = (v) => v <= 3 ? C.green : v <= 6 ? '#F9A825' : C.orange;

export default function DailyCheckIn({ email, perfil, objetivoId, onWeatherUpdate, completedTasksHoy }) {
  const [energia, setEnergia] = useState(7);
  const [sueno, setSueno] = useState(7);
  const [estres, setEstres] = useState(4);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [weather, setWeather] = useState(null);
  const [cargandoWeather, setCargandoWeather] = useState(false);
  const [yaHizoCheckIn, setYaHizoCheckIn] = useState(false);

  useEffect(() => {
    if (!email) return;
    const cacheKey = `checkin_${email}_${hoy()}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setEnergia(data.energia); setSueno(data.sueno); setEstres(data.estres);
        setYaHizoCheckIn(true); setGuardado(true);
        if (data.weather) { setWeather(data.weather); if (onWeatherUpdate) onWeatherUpdate(data.weather); }
      }
    } catch (e) { console.error(e); }
  }, [email]);

  const guardar = async () => {
    if (!email || guardando) return;
    setGuardando(true);

    // Guardar en Supabase (incluye completed_tasks si ya hay)
    await guardarCheckInDB(email, hoy(), energia, sueno, estres, completedTasksHoy || {});

    // Generar weather
    setCargandoWeather(true);
    try {
      const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
      const objetivo = cfg.objetivoId || objetivoId || 'mantener';
      const scores = perfil || {};
      const peorBloque = [
        { nombre: 'actividad física', val: scores.efh_score },
        { nombre: 'composición corporal', val: scores.eco_score },
        { nombre: 'nutrición', val: scores.nut_score },
        { nombre: 'descanso', val: scores.des_score },
        { nombre: 'vitalidad', val: scores.vit_score },
      ].reduce((a, b) => (a.val || 0) < (b.val || 0) ? a : b).nombre;

      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin: { energia, sueno, estres },
          perfil: { icm: scores.icm_total, peor_bloque: peorBloque },
          objetivo,
        }),
      });
      const weatherData = await res.json();
      setWeather(weatherData);
      if (onWeatherUpdate) onWeatherUpdate(weatherData);

      localStorage.setItem(`checkin_${email}_${hoy()}`, JSON.stringify({
        energia, sueno, estres, weather: weatherData,
      }));
    } catch (e) {
      console.error(e);
      setWeather({ estado: 'Día Estable 🌤️', consejo: 'Mantén tu rutina de hoy.' });
    }

    setGuardando(false); setCargandoWeather(false);
    setGuardado(true); setYaHizoCheckIn(true);
  };

  const sliders = [
    { label: 'Energía', val: energia, set: setEnergia, getColor: getColorEnergia, emoji: '⚡', desc: ['Agotado','Bajo','Normal','Activo','Excelente'] },
    { label: 'Sueño', val: sueno, set: setSueno, getColor: getColorSueno, emoji: '😴', desc: ['Pésimo','Malo','Regular','Bueno','Perfecto'] },
    { label: 'Estrés', val: estres, set: setEstres, getColor: getColorEstres, emoji: '🧠', desc: ['Nulo','Leve','Moderado','Alto','Máximo'] },
  ];
  const getDesc = (v, arr) => arr[Math.min(4, Math.floor((v-1)/2))];

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
            <div style={{ background: 'rgba(255,255,255,0.2)', color: C.white, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>✓ Completado</div>
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
              <input type="range" min="1" max="10" step="1" value={s.val}
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
            <button onClick={guardar} disabled={guardando} style={{ width: '100%', marginTop: 20, background: guardando ? '#C8E8B0' : C.green, color: C.white, border: 'none', padding: '13px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: font }}>
              {guardando ? 'Analizando tu estado...' : 'Ver mi estado metabólico de hoy'}
            </button>
          )}
          {cargandoWeather && <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.mid }}>Calculando Metabolic Weather...</div>}
        </div>
      </div>
    </div>
  );
}