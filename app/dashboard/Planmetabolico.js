'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC', greenLight: '#EAF3DE',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

const OBJETIVOS = [
  { id: 'slow_aging', emoji: '🌿', nombre: 'Slow aging' },
  { id: 'mantener', emoji: '⚖️', nombre: 'Mantener peso' },
  { id: 'definicion_suave', emoji: '🔥', nombre: 'Definición suave' },
  { id: 'definicion_agresiva', emoji: '💪', nombre: 'Definición agresiva' },
  { id: 'hipertrofia', emoji: '🏋️', nombre: 'Hipertrofia moderada' },
  { id: 'hipertrofia_agresiva', emoji: '🚀', nombre: 'Hipertrofia agresiva' },
  { id: 'perdida_rapida', emoji: '⚡', nombre: 'Pérdida rápida' },
];

const DIAS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HABITOS = ['Nutrición', 'Entrenamiento', 'Sueño 7h+', 'Movimiento diario', 'Suplementos'];

const INDICACIONES = {
  slow_aging: [
    { titulo: 'Nutrición antiinflamatoria', texto: 'El patrón mediterráneo con AOVE, pescado azul y vegetales reduce marcadores de inflamación sistémica un 25-35% en 12 semanas.', color: C.greenPale, border: '#C8E8B0' },
    { titulo: 'Fuerza 3 veces por semana', texto: 'Protocolos de medicina del deporte: 3 sesiones semanales de fuerza progresiva preservan masa magra y mejoran sensibilidad a la insulina.', color: C.orangePale, border: '#F9CFA8' },
    { titulo: 'Sueño y recuperación', texto: '7-9h de sueño de calidad reduce marcadores de envejecimiento celular un 40%. La privación crónica equivale metabólicamente a 5 años adicionales.', color: C.greenPale, border: '#C8E8B0' },
    { titulo: 'Suplementación base', texto: 'Evidencia actual respalda Vitamina D3+K2, Omega-3 EPA/DHA y Magnesio glicinato como stack con mayor relación beneficio/riesgo para adultos activos.', color: C.orangePale, border: '#F9CFA8' },
  ],
  definicion_suave: [
    { titulo: 'Déficit moderado', texto: 'Un déficit de 300-400 kcal preserva masa muscular mientras se pierde grasa. Déficits mayores aumentan el catabolismo muscular.', color: C.greenPale, border: '#C8E8B0' },
    { titulo: 'Proteína elevada', texto: '1.6-2.2g/kg en fase de definición minimiza pérdida muscular. Distribuir en 4-5 tomas maximiza la síntesis proteica.', color: C.orangePale, border: '#F9CFA8' },
    { titulo: 'Cardio estratégico', texto: 'HIIT 2x semana + cardio moderado 2x para maximizar oxidación de grasa sin comprometer recuperación muscular.', color: C.greenPale, border: '#C8E8B0' },
    { titulo: 'Ciclado de carbohidratos', texto: 'Mayor ingesta de carbos en días de fuerza, menor en días de descanso para optimizar composición corporal.', color: C.orangePale, border: '#F9CFA8' },
  ],
};

// Convierte getDay() (0=domingo) a índice L-D (0=lunes)
const getDiaHoy = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

export default function PlanMetabolico({ ultimo, email, objetivoId, onAbrirConfig, onPlanDiaListo }) {
  const diaHoy = getDiaHoy();
  const [diaActivo, setDiaActivo] = useState(diaHoy);
  const [planSemanal, setPlanSemanal] = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const [tabActivo, setTabActivo] = useState('plan');
  const [verSemana, setVerSemana] = useState(false);
  const [habitosCheck, setHabitosCheck] = useState(
    Array(5).fill(null).map(() => Array(7).fill(false))
  );

  const objetivo = OBJETIVOS.find(o => o.id === objetivoId) || OBJETIVOS[1];
  const indicaciones = INDICACIONES[objetivoId] || INDICACIONES.slow_aging;

  // Cargar plan guardado
  useEffect(() => {
    if (!email) return;
    try {
      const clave = `plan_${email}_${objetivoId}`;
      const guardado = localStorage.getItem(clave);
      if (guardado) {
        const { plan, fecha } = JSON.parse(guardado);
        const diasDesde = Math.floor((Date.now() - fecha) / (1000 * 60 * 60 * 24));
        if (diasDesde < 7) setPlanSemanal(plan);
      }
    } catch (e) { console.error(e); }
  }, [email, objetivoId]);

  // Notificar al padre cuando cambia el plan o el día
  useEffect(() => {
    if (!planSemanal || !onPlanDiaListo) return;
    const diaData = planSemanal.dieta?.[diaActivo];
    const entreno = planSemanal.ejercicios?.[diaActivo];
    if (diaData || entreno) {
      onPlanDiaListo({
        diaNombre: DIAS_FULL[diaActivo],
        comidas: diaData ? {
          desayuno: diaData.desayuno,
          comida: diaData.comida,
          cena: diaData.cena,
          snack: diaData.snack,
        } : null,
        entrenamiento: entreno ? {
          tipo: entreno.tipo,
          ejercicios: entreno.ejercicios,
        } : null,
      });
    }
  }, [planSemanal, diaActivo]);

  // Cargar hábitos guardados
  useEffect(() => {
    if (!email) return;
    try {
      const semana = getISOWeek();
      const guardado = localStorage.getItem(`habitos_${email}_${semana}`);
      if (guardado) setHabitosCheck(JSON.parse(guardado));
    } catch (e) { console.error(e); }
  }, [email]);

  const getISOWeek = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return d.getFullYear() + '-W' + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7 + 1);
  };

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

      let prefTexto = '';
      try {
        const cfg = JSON.parse(localStorage.getItem(`config_${email}`) || '{}');
        if (cfg.excluidos?.length) prefTexto += `ALIMENTOS PROHIBIDOS (nunca incluir): ${cfg.excluidos.join(', ')}. `;
        if (cfg.otrosExcluidos) prefTexto += `También excluye: ${cfg.otrosExcluidos}. `;
        if (cfg.tipoDieta && cfg.tipoDieta !== 'omnivoro') prefTexto += `DIETA ESTRICTA: ${cfg.tipoDieta}. `;
        if (cfg.tipoDieta === 'vegetariano') prefTexto += `SIN carne. Proteína de huevos, lácteos y legumbres. `;
        if (cfg.tipoDieta === 'vegano') prefTexto += `SIN productos animales. Proteína de legumbres, tofu, tempeh, seitán. `;
        if (cfg.nivelCocina === 'rapido') prefTexto += 'Recetas de menos de 20 minutos. ';
        if (cfg.restricciones?.length) prefTexto += `Restricciones: ${cfg.restricciones.join(', ')}. `;
      } catch (e) { console.error(e); }

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'plan',
          perfil: {
            objetivo: objetivo.nombre,
            icm: ultimo?.icm_total,
            categoria: ultimo?.icm_total >= 65 ? 'Metabolismo activo' : 'Metabolismo moderado',
            edad_metabolica: ultimo?.edad_metabolica,
            mejor_bloque: mejor.nombre,
            peor_bloque: peor.nombre,
            eco: ultimo?.eco_score, efh: ultimo?.efh_score,
            nut: ultimo?.nut_score, des: ultimo?.des_score, vit: ultimo?.vit_score,
            preferencias: prefTexto,
          }
        }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlanSemanal(data.plan);
        localStorage.setItem(`plan_${email}_${objetivoId}`, JSON.stringify({ plan: data.plan, fecha: Date.now() }));
      }
    } catch (e) { console.error(e); }
    finally { setCargandoPlan(false); }
  };

  const toggleHabito = (h, d) => {
    const nuevo = habitosCheck.map((row, hi) => hi === h ? row.map((v, di) => di === d ? !v : v) : row);
    setHabitosCheck(nuevo);
    try {
      localStorage.setItem(`habitos_${email}_${getISOWeek()}`, JSON.stringify(nuevo));
    } catch (e) { console.error(e); }
  };

  const totalChecks = habitosCheck.flat().filter(Boolean).length;
  const adherencia = Math.round((totalChecks / (5 * 7)) * 100);
  const racha = (() => {
    let r = 0;
    for (let d = 6; d >= 0; d--) {
      if (habitosCheck.every(row => row[d])) r++; else break;
    }
    return r;
  })();

  const diaData = planSemanal?.dieta?.[diaActivo];
  const entreno = planSemanal?.ejercicios?.[diaActivo];

  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.light}`, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: C.green, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: C.white }}>
            {objetivo.emoji} {objetivo.nombre}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            Plan semanal · ICM {ultimo?.icm_total}/100
          </div>
        </div>
        <button onClick={onAbrirConfig} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, padding: '7px 14px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font }}>
          Cambiar objetivo
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.light}`, background: C.bg }}>
        {[
          { id: 'plan', label: '📅 Plan de hoy' },
          { id: 'habitos', label: '✅ Hábitos' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setTabActivo(tab.id)} style={{
            flex: 1, padding: '11px 4px',
            background: tabActivo === tab.id ? C.white : 'transparent',
            border: 'none', borderBottom: tabActivo === tab.id ? `2px solid ${C.orange}` : '2px solid transparent',
            fontSize: 11, fontWeight: 600,
            color: tabActivo === tab.id ? C.orange : '#9A9790',
            cursor: 'pointer', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px' }}>

        {/* ══ TAB PLAN ══ */}
        {tabActivo === 'plan' && (
          <div>
            {!planSemanal && !cargandoPlan && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: C.dark, marginBottom: 8 }}>
                  Genera tu plan para esta semana
                </div>
                <div style={{ fontSize: 13, color: C.mid, marginBottom: 20, lineHeight: 1.6 }}>
                  Adaptado a tu objetivo de {objetivo.nombre.toLowerCase()} y tu ICM de {ultimo?.icm_total}/100
                </div>
                <button onClick={generarPlan} style={{
                  background: C.green, color: C.white, border: 'none',
                  padding: '13px 32px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: font,
                }}>
                  Generar mi plan semanal
                </button>
              </div>
            )}

            {cargandoPlan && (
              <div style={{ padding: '20px 0' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: '#F0EBE3', borderRadius: 10, height: 56, marginBottom: 8, opacity: 0.6 }} />
                ))}
                <div style={{ textAlign: 'center', fontSize: 12, color: C.mid, marginTop: 8 }}>
                  Generando tu plan personalizado...
                </div>
              </div>
            )}

            {planSemanal && (
              <>
                {/* Cabecera día actual */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Hoy</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.dark }}>{DIAS_FULL[diaHoy]}</div>
                  </div>
                  <button
                    onClick={() => setVerSemana(v => !v)}
                    style={{ background: verSemana ? C.orange : C.bg, color: verSemana ? C.white : C.mid, border: `1.5px solid ${verSemana ? C.orange : C.light}`, padding: '7px 14px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}
                  >
                    {verSemana ? 'Ver hoy' : 'Ver semana'}
                  </button>
                </div>

                {/* Selector día — solo si verSemana */}
                {verSemana && (
                  <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
                    {DIAS_SHORT.map((d, i) => (
                      <button key={i} onClick={() => setDiaActivo(i)} style={{
                        flex: 1, padding: '8px 2px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: font,
                        background: diaActivo === i ? C.orange : i === diaHoy ? C.greenPale : C.bg,
                        color: diaActivo === i ? C.white : i === diaHoy ? C.green : C.mid,
                        border: `1.5px solid ${diaActivo === i ? C.orange : i === diaHoy ? C.green : C.light}`,
                      }}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid comidas + entreno */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {/* Comidas */}
                  <div style={{ background: C.greenPale, borderRadius: 12, padding: 14, border: '1px solid #C8E8B0' }}>
                    <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      🥗 Comidas
                    </div>
                    {diaData && ['desayuno', 'comida', 'cena', 'snack'].map(comida => (
                      <div key={comida} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: C.green, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{comida}</div>
                        <div style={{ fontSize: 11, color: C.dark, lineHeight: 1.4 }}>{diaData[comida]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Entrenamiento */}
                  <div style={{ background: C.orangePale, borderRadius: 12, padding: 14, border: '1px solid #F9CFA8' }}>
                    <div style={{ fontSize: 10, color: '#C05010', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      🏋️ Entrenamiento
                    </div>
                    {entreno && (
                      <>
                        <div style={{ fontSize: 10, color: C.orange, fontWeight: 600, marginBottom: 8 }}>{entreno.tipo}</div>
                        {entreno.ejercicios?.map((ej, j) => (
                          <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.orange, flexShrink: 0, marginTop: 4 }} />
                            <span style={{ fontSize: 11, color: C.dark, lineHeight: 1.4 }}>{ej}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {!entreno && (
                      <div style={{ fontSize: 12, color: C.mid, fontStyle: 'italic' }}>Día de descanso activo</div>
                    )}
                  </div>
                </div>

                {/* Indicaciones */}
                <div style={{ fontSize: 10, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Indicaciones · evidencia clínica
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {indicaciones.map((ind, i) => (
                    <div key={i} style={{ background: ind.color, border: `1px solid ${ind.border}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{ind.titulo}</div>
                      <div style={{ fontSize: 10, color: C.mid, lineHeight: 1.5 }}>{ind.texto}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => {
                  setPlanSemanal(null);
                  localStorage.removeItem(`plan_${email}_${objetivoId}`);
                }} style={{
                  width: '100%', background: C.bg, color: C.mid, border: `1px solid ${C.light}`,
                  padding: '10px', borderRadius: 100, fontSize: 12, cursor: 'pointer', fontFamily: font,
                }}>
                  Regenerar plan
                </button>
              </>
            )}
          </div>
        )}

        {/* ══ TAB HÁBITOS ══ */}
        {tabActivo === 'habitos' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Semana {getISOWeek()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                <div />
                {DIAS_SHORT.map((d, i) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, color: i === diaHoy ? C.orange : '#9A9790', fontWeight: i === diaHoy ? 700 : 400 }}>{d}</div>
                ))}
              </div>
              {HABITOS.map((hab, h) => (
                <div key={h} style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: 4, marginBottom: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: C.dark }}>{hab}</div>
                  {Array(7).fill(null).map((_, d) => (
                    <button key={d} onClick={() => toggleHabito(h, d)} style={{
                      width: '100%', aspectRatio: '1', borderRadius: '50%',
                      border: `1.5px solid ${habitosCheck[h][d] ? C.green : d === diaHoy ? C.orange : C.light}`,
                      background: habitosCheck[h][d] ? C.green : C.white,
                      color: habitosCheck[h][d] ? C.white : 'transparent',
                      cursor: 'pointer', fontSize: 11, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {habitosCheck[h][d] ? '✓' : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: C.greenPale, border: '1px solid #C8E8B0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Adherencia</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: C.green }}>{adherencia}%</div>
                <div style={{ height: 4, background: '#D4EDBE', borderRadius: 100, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${adherencia}%`, background: C.green, borderRadius: 100 }} />
                </div>
              </div>
              <div style={{ background: C.orangePale, border: '1px solid #F9CFA8', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#C05010', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Racha</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: C.orange }}>{racha} días</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 4 }}>consecutivos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}