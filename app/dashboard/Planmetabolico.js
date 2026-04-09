'use client';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg: '#F7F4EE',
  green: '#5B9B3C',
  orange: '#E8621A',
  white: '#FFFFFF',
  dark: '#1A1A1A',
  mid: '#6B6B6B',
  light: '#E8E4DC',
  greenLight: '#EAF3DE',
  greenPale: '#EBF5E4',
  orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const OBJETIVOS = [
  { id: 'slow_aging', emoji: '🌿', nombre: 'Slow aging', ajuste: 600, macros: { p: 28, c: 47, g: 25 } },
  { id: 'mantener', emoji: '⚖️', nombre: 'Mantener peso', ajuste: 0, macros: { p: 25, c: 50, g: 25 } },
  { id: 'definicion_suave', emoji: '🔥', nombre: 'Definición suave', ajuste: -300, macros: { p: 35, c: 40, g: 25 } },
  { id: 'definicion_agresiva', emoji: '💪', nombre: 'Definición agresiva', ajuste: -500, macros: { p: 40, c: 35, g: 25 } },
  { id: 'hipertrofia', emoji: '🏋️', nombre: 'Hipertrofia moderada', ajuste: 300, macros: { p: 32, c: 48, g: 20 } },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva', ajuste: 500, macros: { p: 35, c: 45, g: 20 } },
  { id: 'perdida_rapida', emoji: '⚡', nombre: 'Pérdida rápida', ajuste: -800, macros: { p: 45, c: 30, g: 25 } },
];

const METS = [
  { id: 'caminar', label: 'Caminar', met: 3.5, emoji: '🚶' },
  { id: 'correr', label: 'Correr', met: 7.0, emoji: '🏃' },
  { id: 'bici', label: 'Bici', met: 5.0, emoji: '🚴' },
  { id: 'pesas', label: 'Pesas', met: 6.0, emoji: '🏋️' },
  { id: 'hiit', label: 'HIIT', met: 8.5, emoji: '🔥' },
  { id: 'natacion', label: 'Natación', met: 7.0, emoji: '🏊' },
  { id: 'yoga', label: 'Yoga', met: 3.0, emoji: '🧘' },
  { id: 'equipo', label: 'Deporte equipo', met: 6.5, emoji: '⚽' },
  { id: 'padel', label: 'Pádel', met: 4.5, emoji: '🎾' },
  { id: 'senderismo', label: 'Senderismo', met: 5.5, emoji: '🏔️' },
];

const ALIMENTOS_EXCLUIR = ['Legumbres', 'Pescado blanco', 'Espinacas', 'Brócoli', 'Lácteos', 'Carne roja', 'Huevo', 'Gluten', 'Frutos secos', 'Marisco', 'Cebolla/ajo', 'Pimientos'];
const EJERCICIOS_PREF = ['Cinta de correr', 'Bicicleta', 'Elíptica', 'Pesas libres', 'Yoga', 'Natación', 'Fútbol/deporte', 'Pádel/Tenis', 'Caminar', 'Senderismo', 'Funcional/crossfit'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HABITOS = ['Nutrición', 'Entrenamiento', 'Sueño 7h+', 'Movimiento diario', 'Suplementos'];

const FUENTES_ALIMENTOS = {
  slow_aging: { p: ['Salmón', 'Huevos', 'Legumbres', 'Sardinas', 'Tofu'], c: ['Avena', 'Boniato', 'Arroz integral', 'Quinoa', 'Frutas del bosque'], g: ['AOVE', 'Aguacate', 'Nueces', 'Almendras', 'Semillas chía'] },
  mantener: { p: ['Pollo', 'Huevos', 'Atún', 'Legumbres', 'Yogur griego'], c: ['Arroz', 'Pasta integral', 'Patata', 'Avena', 'Pan integral'], g: ['AOVE', 'Aguacate', 'Frutos secos', 'Queso curado', 'Aceitunas'] },
  definicion_suave: { p: ['Pechuga pollo', 'Clara huevo', 'Atún al natural', 'Rape', 'Tofu'], c: ['Avena', 'Arroz integral', 'Boniato', 'Verduras', 'Frutas bajas en azúcar'], g: ['AOVE', 'Aguacate', 'Almendras', 'Nueces', 'Semillas'] },
  definicion_agresiva: { p: ['Pechuga pollo', 'Clara huevo', 'Merluza', 'Gambas', 'Proteína whey'], c: ['Avena', 'Arroz blanco post-entreno', 'Verduras de hoja', 'Pepino', 'Tomate'], g: ['AOVE mínimo', 'Aguacate pequeño', 'Almendras 20g', 'Salmón', 'Atún'] },
  hipertrofia: { p: ['Carne roja magra', 'Pollo', 'Huevos', 'Proteína whey', 'Atún'], c: ['Arroz blanco', 'Pasta', 'Pan', 'Plátano', 'Patata'], g: ['AOVE', 'Frutos secos', 'Mantequilla de cacahuete', 'Yema huevo', 'Queso'] },
  hipertrofia_agresiva: { p: ['Carne roja', 'Pollo', 'Huevos enteros', 'Proteína whey', 'Salmón'], c: ['Arroz', 'Pasta', 'Pan blanco', 'Plátano', 'Avena con leche'], g: ['AOVE abundante', 'Frutos secos', 'Mantequilla', 'Queso', 'Aguacate'] },
  perdida_rapida: { p: ['Clara huevo', 'Pechuga pavo', 'Merluza', 'Gambas', 'Cottage cheese'], c: ['Solo verduras', 'Pepino', 'Lechuga', 'Espinacas', 'Tomate cherry'], g: ['AOVE mínimo 1cs', 'Aguacate 50g', 'Almendras 15g'] },
};

export default function PlanMetabolico({ ultimo, nombre }) {
  const [tabActivo, setTabActivo] = useState('plan');
  const [objetivoId, setObjetivoId] = useState('mantener');
  const [diaActivo, setDiaActivo] = useState(0);
  const [planSemanal, setPlanSemanal] = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);

  // Energía
  const [sesiones, setSesiones] = useState(3);
  const [duracion, setDuracion] = useState(45);
  const [metId, setMetId] = useState('pesas');
  const [horasSentado, setHorasSentado] = useState(8);
  const [pasosId, setPasosId] = useState('6000');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Hábitos
  const [habitosCheck, setHabitosCheck] = useState(
    Array(5).fill(null).map(() => Array(7).fill(false))
  );
  const [rachaRecord, setRachaRecord] = useState(7);

  // Preferencias
  const [excluidos, setExcluidos] = useState([]);
  const [ejerciciosPref, setEjerciciosPref] = useState({});
  const [nivelCocina, setNivelCocina] = useState('medio');
  const [tipoDieta, setTipoDieta] = useState('omnivoro');
  const [restricciones, setRestricciones] = useState([]);
  const [otrosExcluidos, setOtrosExcluidos] = useState('');

  const objetivo = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[0];
  const peso = ultimo?.C4 || 75;
  const altura = ultimo?.C3 || 170;
  const edad = ultimo?.C1 || 35;
  const sexo = ultimo?.C2 === 'Mujer' ? 'mujer' : 'hombre';

  // Cálculo energético
  const bmr = sexo === 'hombre'
    ? (10 * peso) + (6.25 * altura) - (5 * edad) + 5
    : (10 * peso) + (6.25 * altura) - (5 * edad) - 161;

  const metActivo = METS.find(m => m.id === metId)?.met || 6;
  const ejercicioKcal = Math.round(metActivo * peso * (duracion / 60) * sesiones / 7);
  const pasos = parseInt(pasosId);
  const neat = Math.round(pasos * 0.04);
  const penalizacion = Math.max(0, (horasSentado - 4) * 20);
  const tdee = Math.round(bmr + ejercicioKcal + neat - penalizacion);
  const kcalObjetivo = tdee + objetivo.ajuste;
  const deficit = objetivo.ajuste;
  const kgPorSemana = Math.abs(deficit * 7 / 7700).toFixed(2);
  const kgPor30dias = Math.abs(deficit * 30 / 7700).toFixed(1);
  const diasPorKg = deficit !== 0 ? Math.round(7700 / Math.abs(deficit)) : 0;

  const protGramos = Math.round((kcalObjetivo * objetivo.macros.p / 100) / 4);
  const carbGramos = Math.round((kcalObjetivo * objetivo.macros.c / 100) / 4);
  const grasaGramos = Math.round((kcalObjetivo * objetivo.macros.g / 100) / 9);

  // Chart.js dona
  useEffect(() => {
    if (tabActivo !== 'energia') return;
    const loadChart = () => {
      if (typeof window === 'undefined' || !chartRef.current) return;
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
      if (window.Chart) {
        chartInstance.current = new window.Chart(chartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Proteína', 'Carbohidratos', 'Grasa'],
            datasets: [{
              data: [objetivo.macros.p, objetivo.macros.c, objetivo.macros.g],
              backgroundColor: ['#1565C0', '#5B9B3C', '#E8621A'],
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            cutout: '65%',
          }
        });
      }
    };
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = loadChart;
      document.head.appendChild(script);
    } else {
      loadChart();
    }
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [tabActivo, objetivoId, sesiones, duracion, metId, horasSentado, pasosId]);

  // Generar plan IA
  const generarPlan = async () => {
    setCargandoPlan(true);
    try {
      const scores = [
        { nombre: 'Actividad física', valor: ultimo?.efh_score },
        { nombre: 'Composición corporal', valor: ultimo?.eco_score },
        { nombre: 'Nutrición', valor: ultimo?.nut_score },
        { nombre: 'Descanso', valor: ultimo?.des_score },
        { nombre: 'Vitalidad', valor: ultimo?.vit_score },
      ];
      const mejor = scores.reduce((a, b) => a.valor > b.valor ? a : b);
      const peor = scores.reduce((a, b) => a.valor < b.valor ? a : b);

      const prefTexto = excluidos.length > 0 ? `Sin: ${excluidos.join(', ')}. ` : '';
      const dietaTexto = tipoDieta !== 'omnivoro' ? `Dieta ${tipoDieta}. ` : '';

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'plan',
          perfil: {
            objetivo: objetivo.nombre,
            icm: ultimo?.icm_total,
            categoria: ultimo?.icm_total >= 80 ? 'Metabolismo óptimo' : ultimo?.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado',
            edad_metabolica: ultimo?.edad_metabolica,
            mejor_bloque: mejor.nombre,
            peor_bloque: peor.nombre,
            eco: ultimo?.eco_score,
            efh: ultimo?.efh_score,
            nut: ultimo?.nut_score,
            des: ultimo?.des_score,
            vit: ultimo?.vit_score,
            preferencias: prefTexto + dietaTexto + (nivelCocina === 'rapido' ? 'Recetas rápidas menos de 20min.' : ''),
          }
        }),
      });
      const data = await res.json();
      if (data.plan) setPlanSemanal(data.plan);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoPlan(false);
    }
  };

  // Hábitos — toggle
  const toggleHabito = (hab, dia) => {
    setHabitosCheck(prev => prev.map((row, h) => h === hab ? row.map((v, d) => d === dia ? !v : v) : row));
  };

  const totalChecks = habitosCheck.flat().filter(Boolean).length;
  const adherencia = Math.round((totalChecks / (5 * 7)) * 100);
  const racha = (() => {
    let r = 0;
    for (let d = 6; d >= 0; d--) {
      const todosHoy = habitosCheck.every(row => row[d]);
      if (todosHoy) r++; else break;
    }
    return r;
  })();

  // Percentil basado en ICM
  const percentil = ultimo?.icm_total >= 80 ? 92 : ultimo?.icm_total >= 65 ? 74 : ultimo?.icm_total >= 50 ? 49 : 28;

  const fuentes = FUENTES_ALIMENTOS[objetivoId] || FUENTES_ALIMENTOS.mantener;

  // Indicaciones según objetivo
  const indicaciones = {
    slow_aging: [
      { titulo: 'Nutrición antiinflamatoria', texto: 'Evidencia clínica consolidada señala que el patrón mediterráneo con abundante AOVE, pescado azul y vegetales de hoja verde reduce marcadores de inflamación sistémica en un 25-35% a las 12 semanas.', color: C.greenPale, border: '#C8E8B0' },
      { titulo: 'Ejercicio de fuerza 3x', texto: 'Los protocolos de medicina del deporte establecen que 3 sesiones semanales de fuerza progresiva preservan la masa magra y mejoran la sensibilidad a la insulina, clave en el envejecimiento metabólico.', color: C.orangePale, border: '#F9CFA8' },
      { titulo: 'Sueño y recuperación', texto: 'El consenso en medicina del sueño vincula 7-9h de sueño de calidad con una reducción del 40% en marcadores de envejecimiento celular. La privación crónica equivale metabólicamente a 5 años adicionales.', color: C.greenPale, border: '#C8E8B0' },
      { titulo: 'Suplementación base', texto: 'La evidencia actual respalda Vitamina D3+K2, Omega-3 EPA/DHA y Magnesio glicinato como el stack con mayor relación beneficio/riesgo para la longevidad metabólica en adultos activos.', color: C.orangePale, border: '#F9CFA8' },
    ],
    definicion_suave: [
      { titulo: 'Déficit calórico moderado', texto: 'Los protocolos de nutrición deportiva recomiendan un déficit de 300-400 kcal para preservar masa muscular mientras se pierde grasa. Déficits mayores aumentan el catabolismo muscular.', color: C.greenPale, border: '#C8E8B0' },
      { titulo: 'Proteína elevada', texto: 'El consenso actual establece 1.6-2.2g/kg de proteína en fase de definición para minimizar pérdida muscular. Distribuir en 4-5 tomas maximiza la síntesis proteica.', color: C.orangePale, border: '#F9CFA8' },
      { titulo: 'Cardio estratégico', texto: 'La evidencia respalda combinar HIIT (2x semana) con cardio moderado (2x) para maximizar la oxidación de grasa sin comprometer la recuperación muscular.', color: C.greenPale, border: '#C8E8B0' },
      { titulo: 'Ciclado de carbohidratos', texto: 'Los protocolos de nutrición deportiva indican mayor ingesta de carbohidratos en días de entrenamiento de fuerza y menor en días de descanso para optimizar la composición corporal.', color: C.orangePale, border: '#F9CFA8' },
    ],
  };
  const indicacionesActivas = indicaciones[objetivoId] || indicaciones.slow_aging;

  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ background: C.green, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.white }}>📋 Tu plan personalizado</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            {objetivo.emoji} {objetivo.nombre} · ICM {ultimo?.icm_total}/100
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Generado por IA</div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.light}`, background: C.bg }}>
        {[
          { id: 'plan', label: '📅 Mi plan' },
          { id: 'energia', label: '⚡ Mi energía' },
          { id: 'habitos', label: '✅ Hábitos' },
          { id: 'preferencias', label: '⚙️ Preferencias' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setTabActivo(tab.id)} style={{
            flex: 1, padding: '11px 4px',
            background: tabActivo === tab.id ? C.white : 'transparent',
            border: 'none', borderBottom: tabActivo === tab.id ? `2px solid ${C.orange}` : '2px solid transparent',
            fontSize: 10, fontWeight: 600,
            color: tabActivo === tab.id ? C.orange : '#9A9790',
            cursor: 'pointer', fontFamily: font,
            textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px' }}>

        {/* ═══════════════ TAB 1: MI PLAN ═══════════════ */}
        {tabActivo === 'plan' && (
          <div>
            {/* Selector objetivo */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Objetivo activo</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {OBJETIVOS.map(obj => (
                  <button key={obj.id} onClick={() => { setObjetivoId(obj.id); setPlanSemanal(null); }} style={{
                    padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                    background: objetivoId === obj.id ? C.orange : C.bg,
                    color: objetivoId === obj.id ? C.white : C.mid,
                    border: `1.5px solid ${objetivoId === obj.id ? C.orange : C.light}`,
                    transition: 'all 0.15s',
                  }}>
                    {obj.emoji} {obj.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Generar plan */}
            {!planSemanal && !cargandoPlan && (
              <button onClick={generarPlan} style={{
                width: '100%', background: C.green, color: C.white, border: 'none',
                padding: '13px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: font, marginBottom: 16,
              }}>
                Generar mi plan semanal con IA
              </button>
            )}

            {/* Skeleton loading */}
            {cargandoPlan && (
              <div style={{ marginBottom: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: '#F0EBE3', borderRadius: 10, height: 60, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                ))}
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
              </div>
            )}

            {/* Plan generado */}
            {planSemanal && (
              <>
                {/* Selector día */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {DIAS.map((d, i) => (
                    <button key={i} onClick={() => setDiaActivo(i)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: font,
                      background: diaActivo === i ? C.orange : C.bg,
                      color: diaActivo === i ? C.white : C.mid,
                      border: `1.5px solid ${diaActivo === i ? C.orange : C.light}`,
                    }}>
                      {d}
                    </button>
                  ))}
                </div>

                {/* Grid comidas + entrenamiento */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {/* Comidas */}
                  <div style={{ background: C.greenPale, borderRadius: 12, padding: 14, border: '1px solid #C8E8B0' }}>
                    <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      🥗 Comidas
                    </div>
                    {planSemanal.dieta?.[diaActivo] && ['desayuno', 'comida', 'cena', 'snack'].map(comida => (
                      <div key={comida} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: C.green, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{comida}</div>
                        <div style={{ fontSize: 11, color: C.dark, lineHeight: 1.4 }}>{planSemanal.dieta[diaActivo][comida]}</div>
                      </div>
                    ))}
                    <button
                      onClick={() => {/* lanza coach */}}
                      style={{ marginTop: 8, background: 'none', border: `1px solid #C8E8B0`, color: C.green, padding: '6px 10px', borderRadius: 100, fontSize: 10, cursor: 'pointer', fontFamily: font, width: '100%' }}
                    >
                      Adaptar a mis preferencias
                    </button>
                  </div>

                  {/* Entrenamiento */}
                  <div style={{ background: C.orangePale, borderRadius: 12, padding: 14, border: '1px solid #F9CFA8' }}>
                    <div style={{ fontSize: 10, color: '#C05010', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      🏋️ Entrenamiento
                    </div>
                    {planSemanal.ejercicios?.[diaActivo] && (
                      <>
                        <div style={{ fontSize: 10, color: C.orange, fontWeight: 600, marginBottom: 8 }}>{planSemanal.ejercicios[diaActivo].tipo}</div>
                        {planSemanal.ejercicios[diaActivo].ejercicios?.map((ej, j) => (
                          <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.orange, flexShrink: 0, marginTop: 4 }} />
                            <span style={{ fontSize: 11, color: C.dark, lineHeight: 1.4 }}>{ej}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <button
                      onClick={() => {/* lanza coach */}}
                      style={{ marginTop: 8, background: 'none', border: `1px solid #F9CFA8`, color: C.orange, padding: '6px 10px', borderRadius: 100, fontSize: 10, cursor: 'pointer', fontFamily: font, width: '100%' }}
                    >
                      Adaptar a mis preferencias
                    </button>
                  </div>
                </div>

                {/* Indicaciones generales */}
                <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Indicaciones generales · basadas en evidencia clínica
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {indicacionesActivas.map((ind, i) => (
                    <div key={i} style={{ background: ind.color, border: `1px solid ${ind.border}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{ind.titulo}</div>
                      <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>{ind.texto}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setPlanSemanal(null)} style={{
                  background: C.bg, color: C.mid, border: `1px solid ${C.light}`, padding: '10px',
                  borderRadius: 100, fontSize: 12, cursor: 'pointer', fontFamily: font, width: '100%',
                }}>
                  Regenerar plan
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ TAB 2: MI ENERGÍA ═══════════════ */}
        {tabActivo === 'energia' && (
          <div>
            {/* Objetivo selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Objetivo</div>
              <select value={objetivoId} onChange={e => setObjetivoId(e.target.value)} style={{
                width: '100%', padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 100,
                fontSize: 13, fontFamily: font, background: C.white, color: C.dark, outline: 'none',
                accentColor: C.orange,
              }}>
                {OBJETIVOS.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.nombre}</option>)}
              </select>
            </div>

            {/* Tipo actividad */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tipo de actividad principal</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {METS.map(m => (
                  <button key={m.id} onClick={() => setMetId(m.id)} style={{
                    padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                    background: metId === m.id ? C.orange : C.bg,
                    color: metId === m.id ? C.white : C.mid,
                    border: `1.5px solid ${metId === m.id ? C.orange : C.light}`,
                  }}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.dark }}>Sesiones/semana</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{sesiones}</span>
                </div>
                <input type="range" min="0" max="14" step="1" value={sesiones} onChange={e => setSesiones(+e.target.value)}
                  style={{ width: '100%', accentColor: C.orange }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.dark }}>Duración (min)</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{duracion}</span>
                </div>
                <input type="range" min="15" max="120" step="5" value={duracion} onChange={e => setDuracion(+e.target.value)}
                  style={{ width: '100%', accentColor: C.orange }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.dark }}>Horas sentado/día</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{horasSentado}h</span>
                </div>
                <input type="range" min="2" max="16" step="1" value={horasSentado} onChange={e => setHorasSentado(+e.target.value)}
                  style={{ width: '100%', accentColor: C.orange }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dark, marginBottom: 6 }}>Pasos diarios</div>
                <select value={pasosId} onChange={e => setPasosId(e.target.value)} style={{
                  width: '100%', padding: '8px 12px', border: `1.5px solid ${C.light}`, borderRadius: 100,
                  fontSize: 12, fontFamily: font, background: C.white, color: C.dark, outline: 'none',
                }}>
                  <option value="1500">Menos de 3.000</option>
                  <option value="3000">3.000 – 6.000</option>
                  <option value="6000">6.000 – 10.000</option>
                  <option value="10000">10.000 – 15.000</option>
                  <option value="15000">Más de 15.000</option>
                </select>
              </div>
            </div>

            {/* Panel resultado oscuro */}
            <div style={{ background: C.dark, borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                {/* Columna izquierda — gasto */}
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Lo que gastas</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: C.white, lineHeight: 1, marginBottom: 12 }}>
                    {tdee}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}> kcal</span>
                  </div>
                  {[
                    { label: 'Metabolismo basal', val: Math.round(bmr), color: 'rgba(255,255,255,0.7)' },
                    { label: 'Ejercicio', val: `+${ejercicioKcal}`, color: '#5B9B3C' },
                    { label: 'NEAT (pasos)', val: `+${neat}`, color: '#7AB648' },
                    { label: 'Sedentarismo', val: `-${penalizacion}`, color: penalizacion > 0 ? '#E8621A' : 'rgba(255,255,255,0.4)' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                      <span style={{ fontSize: 10, color: item.color, fontWeight: 600 }}>{item.val} kcal</span>
                    </div>
                  ))}
                </div>

                {/* Flecha central */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{'→'}</div>
                  <div style={{
                    background: deficit < 0 ? C.orange : C.green,
                    color: C.white, padding: '4px 10px', borderRadius: 100,
                    fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>
                    {deficit < 0 ? `${deficit} kcal` : deficit > 0 ? `+${deficit} kcal` : '= equilibrio'}
                  </div>
                </div>

                {/* Columna derecha — comer */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Lo que debes comer</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: deficit < 0 ? C.orange : C.green, lineHeight: 1, marginBottom: 8 }}>
                    {kcalObjetivo}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}> kcal</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{objetivo.nombre}</div>
                  {deficit !== 0 && (
                    <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {kgPorSemana} kg/semana<br />
                      {kgPor30dias} kg en 30 días<br />
                      1 kg cada {diasPorKg} días
                    </div>
                  )}
                </div>
              </div>

              {/* Aviso déficit */}
              {Math.abs(deficit) > 700 && (
                <div style={{ marginTop: 14, background: 'rgba(232,98,26,0.2)', border: '1px solid rgba(232,98,26,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#F9CFA8' }}>
                  ⚠️ Déficit elevado. Los especialistas en nutrición clínica recomiendan no mantener este nivel más de 6 semanas sin supervisión profesional.
                </div>
              )}
              {Math.abs(deficit) > 400 && Math.abs(deficit) <= 700 && (
                <div style={{ marginTop: 14, background: 'rgba(91,155,60,0.2)', border: '1px solid rgba(91,155,60,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#C8E8B0' }}>
                  ✓ Déficit moderado. Sostenible entre 8-10 semanas. Ideal para preservar masa muscular.
                </div>
              )}
            </div>

            {/* Barra macros */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Distribución de macronutrientes</div>
              <div style={{ height: 12, borderRadius: 100, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                <div style={{ width: `${objetivo.macros.p}%`, background: '#1565C0' }} />
                <div style={{ width: `${objetivo.macros.c}%`, background: C.green }} />
                <div style={{ width: `${objetivo.macros.g}%`, background: C.orange }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                <span style={{ color: '#1565C0', fontWeight: 600 }}>Proteína {objetivo.macros.p}%</span>
                <span style={{ color: C.green, fontWeight: 600 }}>Carbohidratos {objetivo.macros.c}%</span>
                <span style={{ color: C.orange, fontWeight: 600 }}>Grasa {objetivo.macros.g}%</span>
              </div>
            </div>

            {/* Cards macros + dona */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 16, alignItems: 'start' }}>
              {[
                { label: 'Proteína', g: protGramos, pct: objetivo.macros.p, kcal: protGramos * 4, color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Carbohidratos', g: carbGramos, pct: objetivo.macros.c, kcal: carbGramos * 4, color: C.green, bg: C.greenPale },
                { label: 'Grasa', g: grasaGramos, pct: objetivo.macros.g, kcal: grasaGramos * 9, color: C.orange, bg: C.orangePale },
              ].map((m, i) => (
                <div key={i} style={{ background: m.bg, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: m.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: m.color }}>{m.g}g</div>
                  <div style={{ fontSize: 9, color: C.mid, marginTop: 2 }}>{m.pct}% · {m.kcal} kcal</div>
                </div>
              ))}
              <div style={{ width: 80, height: 80 }}>
                <canvas ref={chartRef} width="80" height="80" />
              </div>
            </div>

            {/* Fuentes de alimentos */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Fuentes recomendadas para tu objetivo</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Proteína', items: fuentes.p, color: '#1565C0', bg: '#E3F2FD' },
                  { label: 'Carbohidratos', items: fuentes.c, color: C.green, bg: C.greenPale },
                  { label: 'Grasa', items: fuentes.g, color: C.orange, bg: C.orangePale },
                ].map((col, i) => (
                  <div key={i} style={{ background: col.bg, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 9, color: col.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{col.label}</div>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 11, color: C.dark, marginBottom: 4 }}>• {item}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Explicación BMR */}
            <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B6D11', marginBottom: 6 }}>¿Cómo se calcula tu metabolismo basal?</div>
              <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.7 }}>
                Tu metabolismo basal de <strong>{Math.round(bmr)} kcal</strong> se calcula con la fórmula Mifflin-St Jeor, validada por el consenso de especialistas en nutrición clínica como la más precisa para adultos activos. A esto se suma tu gasto real por ejercicio ({ejercicioKcal} kcal), NEAT o movimiento espontáneo ({neat} kcal) y se descuenta la penalización por sedentarismo ({penalizacion} kcal). Los especialistas en medicina del deporte establecen que para optimizar la longevidad metabólica se necesita el metabolismo basal más al menos 600 kcal de actividad real diaria.
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 3: HÁBITOS ═══════════════ */}
        {tabActivo === 'habitos' && (
          <div>
            {/* Grid semanal */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Tracker semanal</div>

              {/* Header días */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                <div />
                {DIAS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#9A9790', fontWeight: 700 }}>{d}</div>
                ))}
              </div>

              {/* Filas hábitos */}
              {HABITOS.map((hab, h) => (
                <div key={h} style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 4, marginBottom: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: C.dark }}>{hab}</div>
                  {Array(7).fill(null).map((_, d) => (
                    <button key={d} onClick={() => toggleHabito(h, d)} style={{
                      width: '100%', aspectRatio: '1', borderRadius: '50%', border: `1.5px solid ${habitosCheck[h][d] ? C.green : C.light}`,
                      background: habitosCheck[h][d] ? C.green : C.white,
                      color: habitosCheck[h][d] ? C.white : C.light,
                      cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                    }}>
                      {habitosCheck[h][d] ? '✓' : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Adherencia general</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: C.green }}>{adherencia}%</div>
                <div style={{ height: 5, background: '#D4EDBE', borderRadius: 100, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${adherencia}%`, background: C.green, borderRadius: 100 }} />
                </div>
              </div>
              <div style={{ background: C.orangePale, border: '1px solid #F9CFA8', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#C05010', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Racha actual</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: C.orange }}>{racha} días</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 4 }}>Récord: {rachaRecord} días</div>
                <div style={{ height: 5, background: '#F9CFA8', borderRadius: 100, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (racha / rachaRecord) * 100)}%`, background: C.orange, borderRadius: 100 }} />
                </div>
              </div>
            </div>

            {/* Card impacto */}
            <div style={{ background: C.white, border: `1px solid ${C.light}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, marginBottom: 8 }}>📈 Impacto en tu ICM</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.orange }}>{Math.round(totalChecks * 0.15)}</div>
                  <div style={{ fontSize: 10, color: C.mid }}>pts ICM ganados</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.green }}>30</div>
                  <div style={{ fontSize: 10, color: C.mid }}>días para próximo test</div>
                </div>
              </div>
            </div>

            {/* Percentil social */}
            <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B6D11', marginBottom: 8 }}>📊 Tu posición entre usuarios similares</div>
              <div style={{ height: 8, background: '#D4EDBE', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${percentil}%`, background: C.green, borderRadius: 100 }} />
              </div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
                Estás por encima del <strong style={{ color: C.green }}>{percentil}%</strong> de usuarios de tu franja de edad con objetivos similares.
              </div>
            </div>

            {/* Botón análisis coach */}
            <button
              onClick={() => {/* lanza coach con mensaje precargado */}}
              style={{ width: '100%', background: C.orange, color: C.white, border: 'none', padding: '13px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}
            >
              Analizar mis hábitos y darme el ajuste de mayor impacto
            </button>
          </div>
        )}

        {/* ═══════════════ TAB 4: PREFERENCIAS ═══════════════ */}
        {tabActivo === 'preferencias' && (
          <div>
            {/* Alimentos excluidos */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Alimentos que no como</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                {ALIMENTOS_EXCLUIR.map(item => {
                  const excluido = excluidos.includes(item);
                  return (
                    <button key={item} onClick={() => setExcluidos(prev => excluido ? prev.filter(e => e !== item) : [...prev, item])} style={{
                      padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                      background: excluido ? '#FDECEA' : C.bg,
                      color: excluido ? '#C0392B' : C.mid,
                      border: `1.5px solid ${excluido ? '#F1948A' : C.light}`,
                      textDecoration: excluido ? 'line-through' : 'none',
                    }}>
                      {item}
                    </button>
                  );
                })}
              </div>
              <input
                value={otrosExcluidos}
                onChange={e => setOtrosExcluidos(e.target.value)}
                placeholder="Otros alimentos que excluyes..."
                style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.light}`, borderRadius: 100, fontSize: 12, fontFamily: font, background: C.white, color: C.dark, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Ejercicios preferidos */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mis ejercicios</div>
              <div style={{ fontSize: 10, color: C.mid, marginBottom: 10 }}>Toca 1 vez = me encanta ✓ · Toca 2 veces = lo odio ✗ · Toca 3 veces = neutro</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {EJERCICIOS_PREF.map(ej => {
                  const estado = ejerciciosPref[ej] || 0;
                  const siguiente = (estado + 1) % 3;
                  const estilos = [
                    { bg: C.bg, color: C.mid, border: C.light, text: ej },
                    { bg: C.greenPale, color: C.green, border: '#C8E8B0', text: `✓ ${ej}` },
                    { bg: '#FDECEA', color: '#C0392B', border: '#F1948A', text: `✗ ${ej}` },
                  ];
                  const e = estilos[estado];
                  return (
                    <button key={ej} onClick={() => setEjerciciosPref(prev => ({ ...prev, [ej]: siguiente }))} style={{
                      padding: '6px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                      background: e.bg, color: e.color, border: `1.5px solid ${e.border}`,
                    }}>
                      {e.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nivel cocina */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Nivel en la cocina</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'rapido', label: 'Rápido -20min' },
                  { id: 'medio', label: 'Medio' },
                  { id: 'avanzado', label: 'Avanzado' },
                ].map(n => (
                  <button key={n.id} onClick={() => setNivelCocina(n.id)} style={{
                    flex: 1, padding: '9px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                    background: nivelCocina === n.id ? C.green : C.bg,
                    color: nivelCocina === n.id ? C.white : C.mid,
                    border: `1.5px solid ${nivelCocina === n.id ? C.green : C.light}`,
                  }}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo dieta */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tipo de dieta</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { id: 'omnivoro', label: '🍖 Omnívoro' },
                  { id: 'flexitariano', label: '🥗 Flexitariano' },
                  { id: 'vegetariano', label: '🌿 Vegetariano' },
                  { id: 'vegano', label: '🌱 Vegano' },
                ].map(d => (
                  <button key={d.id} onClick={() => setTipoDieta(d.id)} style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                    background: tipoDieta === d.id ? C.orange : C.bg,
                    color: tipoDieta === d.id ? C.white : C.mid,
                    border: `1.5px solid ${tipoDieta === d.id ? C.orange : C.light}`,
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Restricciones */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Restricciones</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Sin gluten', 'Sin lactosa', 'Halal', 'Kosher'].map(r => {
                  const activo = restricciones.includes(r);
                  return (
                    <button key={r} onClick={() => setRestricciones(prev => activo ? prev.filter(x => x !== r) : [...prev, r])} style={{
                      padding: '6px 14px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font,
                      background: activo ? C.orangePale : C.bg,
                      color: activo ? C.orange : C.mid,
                      border: `1.5px solid ${activo ? C.orange : C.light}`,
                    }}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guardar y regenerar */}
            <button onClick={() => { setPlanSemanal(null); setTabActivo('plan'); generarPlan(); }} style={{
              width: '100%', background: C.green, color: C.white, border: 'none',
              padding: '14px', borderRadius: 100, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: font,
            }}>
              Guardar y regenerar mi plan
            </button>
          </div>
        )}

      </div>
    </div>
  );
}