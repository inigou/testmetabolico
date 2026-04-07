'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [objetivoActivo, setObjetivoActivo] = useState(null);
  const [planGenerado, setPlanGenerado] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [tabActivo, setTabActivo] = useState('dieta');
  const [consultaLibre, setConsultaLibre] = useState('');
  const [respuestaConsulta, setRespuestaConsulta] = useState(null);

  const objetivos = [
    { id: 'hipertrofia', emoji: '💪', nombre: 'Hipertrofia', descripcion: 'Ganar músculo y fuerza' },
    { id: 'definicion', emoji: '🔥', nombre: 'Definición', descripcion: 'Perder grasa, mantener músculo' },
    { id: 'perdida_peso', emoji: '⚖️', nombre: 'Pérdida de peso', descripcion: 'Reducir peso de forma saludable' },
    { id: 'descanso', emoji: '😴', nombre: 'Mejorar descanso', descripcion: 'Optimizar sueño y recuperación' },
    { id: 'estres', emoji: '🧘', nombre: 'Reducir estrés', descripcion: 'Equilibrio mental y físico' },
    { id: 'energia', emoji: '⚡', nombre: 'Más energía', descripcion: 'Vitalidad y rendimiento diario' },
    { id: 'rendimiento', emoji: '🏃', nombre: 'Rendimiento', descripcion: 'Mejorar marca y resistencia' },
    { id: 'slow_aging', emoji: '🌿', nombre: 'Salud / Slow aging', descripcion: 'Envejecer mejor desde dentro' },
  ];

  const generarPlan = () => {
    setGenerando(true);
    setTimeout(() => {
      const planes = {
        hipertrofia: {
          dieta: [
            { dia: 'Lunes', desayuno: 'Avena + proteína + plátano', comida: 'Arroz integral + pollo 200g + brócoli', cena: 'Salmón + patata dulce + espinacas', snack: 'Yogur griego + nueces' },
            { dia: 'Martes', desayuno: 'Huevos x3 + tostada integral + aguacate', comida: 'Pasta integral + ternera + tomate', cena: 'Pechuga + quinoa + judías verdes', snack: 'Batido proteína' },
            { dia: 'Miércoles', desayuno: 'Tortitas avena + miel + frutos rojos', comida: 'Lentejas + arroz + ensalada', cena: 'Merluza + boniato + guisantes', snack: 'Requesón + fruta' },
            { dia: 'Jueves', desayuno: 'Avena + leche + plátano + almendras', comida: 'Arroz + pechuga + pimientos', cena: 'Atún + patata + espárragos', snack: 'Batido proteína + plátano' },
            { dia: 'Viernes', desayuno: 'Huevos x2 + jamón + fruta', comida: 'Quinoa + salmón + aguacate', cena: 'Ternera 150g + arroz + verduras', snack: 'Yogur griego + granola' },
            { dia: 'Sábado', desayuno: 'Pancakes proteicos', comida: 'Hamburguesa casera + boniato', cena: 'Pollo al horno + patatas + ensalada', snack: 'Batido proteína' },
            { dia: 'Domingo', desayuno: 'Tostadas + huevos + aguacate', comida: 'Bacalao + arroz + verduras', cena: 'Sopa de verduras + pollo', snack: 'Fruta + nueces' },
          ],
          ejercicios: [
            { dia: 'Lunes — Pecho y tríceps', tipo: 'Fuerza', ejercicios: ['Press banca 4x8', 'Press inclinado 3x10', 'Aperturas 3x12', 'Fondos 3x10', 'Extensiones tríceps 3x12'] },
            { dia: 'Martes — Espalda y bíceps', tipo: 'Fuerza', ejercicios: ['Dominadas 4x6', 'Remo barra 4x8', 'Jalón 3x10', 'Curl bíceps 3x12', 'Martillo 3x12'] },
            { dia: 'Miércoles — Descanso activo', tipo: 'Cardio suave', ejercicios: ['Caminata 30 min', 'Estiramientos 15 min'] },
            { dia: 'Jueves — Hombros', tipo: 'Fuerza', ejercicios: ['Press militar 4x8', 'Elevaciones laterales 3x12', 'Pájaros 3x12', 'Encogimientos 3x15'] },
            { dia: 'Viernes — Pierna', tipo: 'Fuerza', ejercicios: ['Sentadilla 4x8', 'Prensa 3x10', 'Extensiones 3x12', 'Curl femoral 3x12', 'Gemelos 4x15'] },
            { dia: 'Sábado — Full body', tipo: 'Funcional', ejercicios: ['Clean & press 3x8', 'Thrusters 3x10', 'Pull-ups 3x8'] },
            { dia: 'Domingo — Descanso', tipo: 'Recuperación', ejercicios: ['Descanso completo', 'Yoga opcional 20 min'] },
          ],
          compra: {
            'Proteínas': ['Pechugas pollo x6', 'Salmón 500g', 'Atún x4 latas', 'Huevos x12', 'Ternera magra 400g'],
            'Hidratos': ['Arroz integral 1kg', 'Avena 500g', 'Pasta integral 500g', 'Boniato x4'],
            'Verduras': ['Brócoli x2', 'Espinacas', 'Pimientos x3', 'Espárragos', 'Judías verdes'],
            'Grasas': ['Aguacate x4', 'Nueces 200g', 'Almendras 200g', 'Aceite oliva'],
            'Lácteos': ['Yogur griego x6', 'Leche 1L', 'Requesón 500g'],
          },
          suplementos: [
            { nombre: 'Proteína whey', dosis: '1 dosis post-entreno (25-30g)', prioridad: 'Esencial', motivo: 'Recuperación y síntesis muscular.' },
            { nombre: 'Creatina monohidrato', dosis: '5g/día', prioridad: 'Esencial', motivo: 'Aumenta fuerza y volumen. El más estudiado.' },
            { nombre: 'Omega-3', dosis: '2-3g/día con comidas', prioridad: 'Recomendado', motivo: 'Reduce inflamación post-ejercicio.' },
            { nombre: 'Magnesio bisglicinato', dosis: '300mg antes de dormir', prioridad: 'Recomendado', motivo: 'Mejora sueño y recuperación muscular.' },
          ],
        },
        definicion: {
          dieta: [
            { dia: 'Lunes', desayuno: 'Claras x4 + espinacas + café', comida: 'Pollo 150g + ensalada grande', cena: 'Merluza al vapor + verduras', snack: 'Manzana + 10 almendras' },
            { dia: 'Martes', desayuno: 'Yogur griego 0% + frutos rojos', comida: 'Atún + quinoa 60g + tomate', cena: 'Gambas + brócoli', snack: 'Pepino + humus' },
            { dia: 'Miércoles', desayuno: 'Tortilla x2 + champiñones', comida: 'Salmón 150g + espárragos', cena: 'Pavo 130g + judías verdes', snack: 'Batido proteína con agua' },
            { dia: 'Jueves', desayuno: 'Avena 40g + proteína + canela', comida: 'Pollo 150g + arroz 60g + pimientos', cena: 'Bacalao + coliflor', snack: 'Naranja + nueces x6' },
            { dia: 'Viernes', desayuno: 'Claras x3 + aguacate 1/4', comida: 'Ensalada atún + garbanzos', cena: 'Lubina + verduras', snack: 'Yogur griego 0%' },
            { dia: 'Sábado', desayuno: 'Huevos x2 + jamón + café', comida: 'Libre controlado (máx 600kcal)', cena: 'Pechuga + ensalada', snack: 'Proteína + agua' },
            { dia: 'Domingo', desayuno: 'Tortitas avena sin azúcar', comida: 'Salmón + boniato + brócoli', cena: 'Caldo + pollo + verduras', snack: 'Fruta temporada' },
          ],
          ejercicios: [
            { dia: 'Lunes — HIIT', tipo: 'Cardio intenso', ejercicios: ['Calentamiento 5 min', '8 rondas 30seg/30seg', 'Burpees 3x10', 'Mountain climbers 3x20'] },
            { dia: 'Martes — Fuerza superior', tipo: 'Fuerza', ejercicios: ['Press banca 3x12', 'Remo 3x12', 'Hombros 3x15', 'Bíceps 3x15', 'Tríceps 3x15'] },
            { dia: 'Miércoles — Cardio LISS', tipo: 'Cardio suave', ejercicios: ['Caminata rápida 45 min', 'FC objetivo 60-65%'] },
            { dia: 'Jueves — Fuerza inferior', tipo: 'Fuerza', ejercicios: ['Sentadilla 3x12', 'Peso muerto rumano 3x12', 'Zancadas 3x10', 'Hip thrust 3x15'] },
            { dia: 'Viernes — Full body + core', tipo: 'Funcional', ejercicios: ['Circuit 4 rondas', 'Planchas 60 seg', 'Russian twist 3x20'] },
            { dia: 'Sábado — Cardio libre', tipo: 'Cardio', ejercicios: ['Actividad favorita 45-60 min'] },
            { dia: 'Domingo — Descanso', tipo: 'Recuperación', ejercicios: ['Yoga 30 min', 'Estiramientos'] },
          ],
          compra: {
            'Proteínas magras': ['Pechuga x6', 'Merluza 500g', 'Claras cartón', 'Atún x6', 'Gambas 300g'],
            'Verduras': ['Espinacas x2', 'Brócoli x2', 'Pepino x3', 'Tomate x6', 'Coliflor'],
            'Hidratos moderados': ['Avena 500g', 'Arroz integral 500g', 'Boniato x3', 'Garbanzos x2'],
            'Grasas': ['Aguacate x3', 'Nueces 150g', 'Aceite oliva', 'Semillas chía'],
            'Otros': ['Yogur griego 0% x6', 'Limones x4', 'Especias', 'Caldo verduras'],
          },
          suplementos: [
            { nombre: 'Proteína whey isolada', dosis: '1 dosis post-entreno', prioridad: 'Esencial', motivo: 'Preserva músculo en déficit calórico.' },
            { nombre: 'L-Carnitina', dosis: '2g antes del cardio', prioridad: 'Recomendado', motivo: 'Facilita uso de grasa como energía.' },
            { nombre: 'Cafeína', dosis: '200mg 30 min antes entreno', prioridad: 'Recomendado', motivo: 'Aumenta oxidación de grasas.' },
            { nombre: 'Multivitamínico', dosis: '1 cápsula con desayuno', prioridad: 'Recomendado', motivo: 'Cubre micronutrientes en déficit calórico.' },
          ],
        },
        slow_aging: {
          dieta: [
            { dia: 'Lunes', desayuno: 'Té verde + avena + arándanos + lino', comida: 'Salmón + quinoa + espinacas + cúrcuma', cena: 'Sopa miso + tofu + algas', snack: 'Nueces x10 + té matcha' },
            { dia: 'Martes', desayuno: 'Smoothie verde: espinacas + plátano + jengibre', comida: 'Atún + garbanzos + tomate + aceitunas', cena: 'Lubina + verduras + limón', snack: 'Chocolate negro 85% x2' },
            { dia: 'Miércoles', desayuno: 'Huevos x2 + aguacate + tomate + AOVE', comida: 'Lentejas + verduras + cúrcuma', cena: 'Sardinas + ensalada + pan integral', snack: 'Kéfir + frutos rojos' },
            { dia: 'Jueves', desayuno: 'Porridge + miel cruda + frambuesas + canela', comida: 'Pollo ecológico + boniato + brócoli', cena: 'Crema calabaza + semillas', snack: 'Almendras x15 + manzana' },
            { dia: 'Viernes', desayuno: 'Kéfir + granola sin azúcar + kiwi', comida: 'Caballa + arroz integral + rúcula', cena: 'Gazpacho + huevo + aguacate', snack: 'Té verde + nueces brasil x3' },
            { dia: 'Sábado', desayuno: 'Tostadas masa madre + AOVE + tomate', comida: 'Paella de verduras', cena: 'Salmón marinado + pepino + sésamo', snack: 'Smoothie antioxidante' },
            { dia: 'Domingo', desayuno: 'Acai bowl + plátano + coco + semillas', comida: 'Cocido de legumbres', cena: 'Sopa miso + vegetales', snack: 'Fruta temporada' },
          ],
          ejercicios: [
            { dia: 'Lunes — Fuerza suave', tipo: 'Fuerza + movilidad', ejercicios: ['Sentadilla corporal 3x15', 'Flexiones inclinadas 3x10', 'Remo banda 3x12', 'Puente glúteo 3x15'] },
            { dia: 'Martes — Caminata', tipo: 'Cardio suave', ejercicios: ['Caminata naturaleza 45 min', 'Respiración diafragmática 10 min'] },
            { dia: 'Miércoles — Yoga', tipo: 'Movilidad', ejercicios: ['Sesión yoga 40 min', 'Meditación 10 min'] },
            { dia: 'Jueves — Funcional', tipo: 'Fuerza', ejercicios: ['Peso muerto ligero 3x12', 'Press hombros 3x12', 'Zancadas 3x10', 'Plancha 3x45seg'] },
            { dia: 'Viernes — Zona 2', tipo: 'Cardio longevidad', ejercicios: ['Bici suave 30 min', 'FC máx 130 ppm', 'Zona 2 para longevidad'] },
            { dia: 'Sábado — Social', tipo: 'Bienestar', ejercicios: ['Actividad social al aire libre', 'Senderismo / baile / golf'] },
            { dia: 'Domingo — Recuperación', tipo: 'Recuperación', ejercicios: ['Sauna o baño caliente 20 min', 'Automasaje o estiramientos'] },
          ],
          compra: {
            'Superalimentos': ['Arándanos 300g', 'Té verde x20', 'Cúrcuma polvo', 'Jengibre fresco', 'Chocolate 85% x2'],
            'Proteínas': ['Salmón salvaje 500g', 'Sardinas x4', 'Caballa x2', 'Huevos ecológicos x12', 'Tofu 400g'],
            'Verduras y frutas': ['Espinacas x2', 'Brócoli x2', 'Aguacate x4', 'Kiwi x6', 'Frutos rojos'],
            'Fermentados': ['Kéfir 500ml', 'Miso pasta', 'Chucrut 400g', 'Yogur natural x4'],
            'Grasas': ['AOVE 1L', 'Nueces 200g', 'Almendras 200g', 'Semillas lino', 'Semillas chía'],
          },
          suplementos: [
            { nombre: 'NMN o NR (NAD+)', dosis: '250-500mg por la mañana', prioridad: 'Esencial', motivo: 'El suplemento de slow aging más estudiado. Activa sirtuinas.' },
            { nombre: 'Resveratrol', dosis: '500mg con comida grasa', prioridad: 'Esencial', motivo: 'Activa vías de longevidad similares a restricción calórica.' },
            { nombre: 'Omega-3 EPA+DHA', dosis: '2-3g/día', prioridad: 'Esencial', motivo: 'Reduce inflamación crónica, acelerador del envejecimiento.' },
            { nombre: 'Vitamina D3 + K2', dosis: '4000 UI D3 + 100mcg K2', prioridad: 'Esencial', motivo: 'Clave para huesos, inmunidad y longevidad cardiovascular.' },
            { nombre: 'Magnesio glicinato', dosis: '300mg antes de dormir', prioridad: 'Recomendado', motivo: 'Mejora sueño profundo y reparación celular nocturna.' },
            { nombre: 'Colágeno hidrolizado', dosis: '10g en ayunas', prioridad: 'Recomendado', motivo: 'Mantiene piel, articulaciones y tejido conectivo joven.' },
          ],
        },
      };

      const planBase = planes[objetivoActivo] || planes.slow_aging;
      setPlanGenerado(planBase);
      setTabActivo('dieta');
      setGenerando(false);
    }, 2000);
  };

  const responderConsulta = () => {
    if (!consultaLibre.trim()) return;
    const consulta = consultaLibre.toLowerCase();
    let respuesta = '';

    if (consulta.includes('proteína') || consulta.includes('proteina')) {
      respuesta = `<strong>Proteína diaria recomendada:</strong><br><br>Con tu ICM de ${ultimo?.icm_total}/100, te recomiendo entre <strong>1.6-2g por kg de peso corporal</strong> al día.<br><br>Mejores fuentes: pollo, pavo, huevos, pescado azul, legumbres, yogur griego.<br><br>💡 Distribuye en 3-4 comidas para maximizar síntesis muscular.`;
    } else if (consulta.includes('antes de entrenar') || consulta.includes('pre-entreno')) {
      respuesta = `<strong>Nutrición pre-entreno (1-2h antes):</strong><br><br>🥗 Hidratos + proteína moderada. Ej: arroz + pollo, avena + huevos.<br><br>⚡ 30 min antes: fruta + cafeína opcional.<br><br>💧 500ml agua en la hora previa.<br><br>Evita: grasas en exceso y comidas muy copiosas.`;
    } else if (consulta.includes('dormir') || consulta.includes('sueño') || consulta.includes('descanso')) {
      respuesta = `<strong>Protocolo de sueño:</strong><br><br>🌙 Horario fijo siempre, incluso fines de semana.<br><br>📱 Sin pantallas 45 min antes.<br><br>🌡️ Habitación a 18-19°C.<br><br>💊 Magnesio glicinato 300mg + ashwagandha 1h antes.<br><br>Mejorar el sueño puede subir tu ICM entre 4-6 puntos.`;
    } else if (consulta.includes('estrés') || consulta.includes('estres')) {
      respuesta = `<strong>Protocolo antistrés:</strong><br><br>🧘 Respiración 4-7-8: inhala 4s, retén 7s, exhala 8s. 4 ciclos x2/día.<br><br>🚶 Caminata 20-30 min reduce cortisol 15-20%.<br><br>📵 Sin móvil la primera hora de la mañana.<br><br>💊 Ashwagandha KSM-66 300mg, el adaptógeno más estudiado.`;
    } else {
      respuesta = `Basándome en tu perfil (ICM ${ultimo?.icm_total}/100), para <em>"${consultaLibre}"</em> mi recomendación es empezar por los fundamentos: <strong>proteína suficiente, hidratación, sueño de calidad y movimiento diario</strong>.<br><br>💡 Genera tu plan semanal para recomendaciones más específicas a tu objetivo.`;
    }
    setRespuestaConsulta(respuesta);
    setConsultaLibre('');
  };

  const descargarPDF = () => {
    const objetivo = objetivos.find(o => o.id === objetivoActivo);
    const contenido = `PLAN SEMANAL — ${objetivo?.nombre?.toUpperCase()}
Generado: ${new Date().toLocaleDateString('es-ES')}
ICM: ${ultimo?.icm_total}/100 | Edad metabólica: ${ultimo?.edad_metabolica} años

═══════════════════════════════════
DIETA SEMANAL
═══════════════════════════════════
${planGenerado?.dieta?.map(d => `
${d.dia.toUpperCase()}
Desayuno: ${d.desayuno}
Comida: ${d.comida}
Cena: ${d.cena}
Snack: ${d.snack}`).join('\n')}

═══════════════════════════════════
EJERCICIOS
═══════════════════════════════════
${planGenerado?.ejercicios?.map(d => `
${d.dia.toUpperCase()}
${d.ejercicios.map(e => `• ${e}`).join('\n')}`).join('\n')}

═══════════════════════════════════
LISTA DE LA COMPRA
═══════════════════════════════════
${Object.entries(planGenerado?.compra || {}).map(([sec, items]) => `
${sec.toUpperCase()}
${items.map(i => `☐ ${i}`).join('\n')}`).join('\n')}

═══════════════════════════════════
SUPLEMENTOS
═══════════════════════════════════
${planGenerado?.suplementos?.map(s => `
${s.nombre} — ${s.prioridad}
Dosis: ${s.dosis}
${s.motivo}`).join('\n')}

mymetaboliq.com`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${objetivoActivo}-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        setError('No encontramos ningún test con ese email. ¿Has hecho el test antes?');
      } else {
        setDatos(tests);
      }
    } catch {
      setError('Error al conectar. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const ultimo = datos?.[datos.length - 1];
  const anterior = datos?.[datos.length - 2];
  const deltaICM = anterior ? (ultimo?.icm_total - anterior?.icm_total).toFixed(1) : null;

  const categoriaColor = (icm) => {
    if (icm >= 80) return '#5B9B3C';
    if (icm >= 65) return '#8DC96B';
    if (icm >= 50) return '#E8A020';
    return '#E8621A';
  };

  const scoreColor = (score) => {
    if (score >= 70) return '#5B9B3C';
    if (score >= 50) return '#E8A020';
    return '#E8621A';
  };

  const formatFecha = (f) => {
    const d = new Date(f);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calcular posiciones del gráfico
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F4EE',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
    }}>

      {/* Header */}
      <div style={{ background: '#E8621A', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '20px' }}>🧬</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff' }}>
          test<span style={{ color: '#FDF0E8' }}>metabólico</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', textDecoration: 'none' }}>← Hacer nuevo test</a>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Login por email */}
        {!datos && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#1E1E1A', marginBottom: '8px' }}>
              Tu evolución <span style={{ color: '#E8621A', fontStyle: 'italic' }}>metabólica</span>
            </h1>
            <p style={{ fontSize: '14px', color: '#6B6860', marginBottom: '32px', lineHeight: '1.7' }}>
              Introduce el email con el que hiciste el test para ver tu historial completo.
            </p>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarDatos()}
                placeholder="tu@email.com"
                style={{
                  flex: 1, padding: '12px 18px',
                  border: '1.5px solid #E0DBD0', borderRadius: '100px',
                  fontSize: '14px', background: '#fff',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  outline: 'none', color: '#1E1E1A',
                }}
              />
              <button
                onClick={buscarDatos}
                disabled={cargando}
                style={{
                  background: '#E8621A', color: '#fff',
                  border: 'none', padding: '12px 22px',
                  borderRadius: '100px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                }}
              >
                {cargando ? '...' : 'Ver →'}
              </button>
            </div>
            {error && (
              <p style={{ color: '#E8621A', fontSize: '13px', marginTop: '16px' }}>{error}</p>
            )}
          </div>
        )}

        {/* Dashboard con datos */}
        {datos && ultimo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Saludo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9A9790', marginBottom: '2px' }}>
                  {datos.length} test{datos.length > 1 ? 's' : ''} completado{datos.length > 1 ? 's' : ''}
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1E1E1A' }}>
                  Tu evolución metabólica
                </h2>
              </div>
              <button
                onClick={() => { setDatos(null); setEmail(''); }}
                style={{ fontSize: '11px', color: '#9A9790', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cambiar email
              </button>
            </div>

            {/* Banner ICM actual */}
            <div style={{
              background: '#E8621A', borderRadius: '16px', padding: '24px',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>ICM actual</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>{ultimo.icm_total}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>/100</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Edad metabólica</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>{ultimo.edad_metabolica}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>años</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {deltaICM ? 'Evolución' : 'Último test'}
                </div>
                {deltaICM ? (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>
                      {deltaICM > 0 ? '+' : ''}{deltaICM}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>puntos vs anterior</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#fff', lineHeight: '1', marginTop: '14px' }}>{formatFecha(ultimo.fecha)}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '8px' }}>Haz el 2º test para ver evolución</div>
                  </>
                )}
              </div>
            </div>

            {/* Gráfico evolución */}
            {datos.length > 1 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Evolución del ICM</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>
                  Progreso mensual
                </div>
                <svg viewBox="0 0 680 110" style={{ width: '100%', height: '120px' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B9B3C" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#5B9B3C" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[20, 55, 90].map(y => (
                    <line key={y} x1="40" y1={y} x2="660" y2={y} stroke="#E0DBD0" strokeWidth="0.5"/>
                  ))}
                  {/* Area */}
                  {areaD && <path d={areaD} fill="url(#areaGrad)"/>}
                  {/* Línea */}
                  {pathD && <path d={pathD} fill="none" stroke="#5B9B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
                  {/* Puntos */}
                  {chartData.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x * 6.8} cy={p.y * 1.1} r="5" fill={i === chartData.length - 1 ? '#E8621A' : '#5B9B3C'} stroke="#fff" strokeWidth="2"/>
                      <text x={p.x * 6.8} y={p.y * 1.1 - 10} textAnchor="middle" fontSize="10" fill={i === chartData.length - 1 ? '#E8621A' : '#5B9B3C'} fontWeight="600">{p.icm}</text>
                    </g>
                  ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9A9790', marginTop: '4px' }}>
                  {chartData.map((p, i) => (
                    <span key={i} style={{ color: i === chartData.length - 1 ? '#E8621A' : '#9A9790', fontWeight: i === chartData.length - 1 ? '600' : '400' }}>
                      {p.fecha}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scores último test */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
              <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Último test · {formatFecha(ultimo.fecha)}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>Desglose por bloque</div>
              {[
                { nombre: '⚡ Actividad física', valor: ultimo.efh_score, key: 'efh' },
                { nombre: '🏋️ Composición corporal', valor: ultimo.eco_score, key: 'eco' },
                { nombre: '🥗 Nutrición', valor: ultimo.nut_score, key: 'nut' },
                { nombre: '😴 Descanso', valor: ultimo.des_score, key: 'des' },
                { nombre: '🧠 Vitalidad', valor: ultimo.vit_score, key: 'vit' },
              ].map(s => (
                <div key={s.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#1E1E1A' }}>{s.nombre}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: scoreColor(s.valor) }}>{s.valor}/100</span>
                  </div>
                  <div style={{ height: '6px', background: '#EDE9E0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.valor}%`, background: scoreColor(s.valor), borderRadius: '100px', transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Historial de tests */}
            {datos.length > 1 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Historial</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>Todos tus tests</div>
                {[...datos].reverse().map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: i < datos.length - 1 ? '1px solid #EDE9E0' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#1E1E1A', fontWeight: i === 0 ? '600' : '400' }}>
                        {formatFecha(t.fecha)} {i === 0 && <span style={{ fontSize: '10px', background: '#EBF5E4', color: '#5B9B3C', padding: '1px 8px', borderRadius: '100px', marginLeft: '6px' }}>Último</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9A9790', marginTop: '2px' }}>Edad metabólica: {t.edad_metabolica} años</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: categoriaColor(t.icm_total) }}>{t.icm_total}</div>
                      <div style={{ fontSize: '10px', color: '#9A9790' }}>ICM</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA primer test si solo hay uno */}
            {datos.length === 1 && (
              <div style={{ background: '#EBF5E4', border: '1px solid #C8E8B0', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1E1E1A', marginBottom: '6px' }}>Vuelve en 30 días</div>
                <div style={{ fontSize: '13px', color: '#6B6860', lineHeight: '1.6', marginBottom: '16px' }}>
                  Cuando hagas tu segundo test verás aquí tu evolución y el gráfico de progreso del ICM.
                </div>
                <a href="/bot" style={{
                  display: 'inline-block', background: '#5B9B3C', color: '#fff',
                  padding: '10px 24px', borderRadius: '100px', fontSize: '13px',
                  fontWeight: '600', textDecoration: 'none'
                }}>
                  Hacer nuevo test →
                </a>
              </div>
            )}

            {/* CTA suscripción */}
            <div style={{ background: '#E8621A', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff', marginBottom: '4px' }}>
                  Sigue tu evolución cada mes
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>9,90€/mes · Cancela cuando quieras</div>
              </div>
              <a href="#" style={{
                background: '#fff', color: '#E8621A',
                padding: '10px 22px', borderRadius: '100px',
                fontSize: '12px', fontWeight: '600', textDecoration: 'none'
              }}>
                Activar suscripción →
              </a>
            </div>

            {/* ── MÓDULO COACH ── */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ background: '#5B9B3C', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '24px' }}>🤖</div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#fff' }}>Tu coach metabólico</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Tu plan personalizado · Consultas ilimitadas</div>
                </div>
              </div>
            </div>

            {/* Selector de objetivo */}
            {!objetivoActivo && !planGenerado && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>¿En qué quieres enfocarte ahora?</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {objetivos.map(obj => (
                    <button key={obj.id} onClick={() => setObjetivoActivo(obj.id)} style={{
                      background: '#F7F4EE', border: '1.5px solid #E0DBD0',
                      borderRadius: '10px', padding: '12px',
                      textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B9B3C'; e.currentTarget.style.background = '#EBF5E4'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0DBD0'; e.currentTarget.style.background = '#F7F4EE'; }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{obj.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E1E1A' }}>{obj.nombre}</div>
                      <div style={{ fontSize: '10px', color: '#9A9790', marginTop: '2px' }}>{obj.descripcion}</div>
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #EDE9E0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#9A9790', marginBottom: '8px' }}>O hazme una consulta directa:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={consultaLibre}
                      onChange={e => setConsultaLibre(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && consultaLibre.trim() && responderConsulta()}
                      placeholder="Ej: ¿Qué debo comer antes de entrenar?"
                      style={{
                        flex: 1, padding: '10px 16px',
                        border: '1.5px solid #E0DBD0', borderRadius: '100px',
                        fontSize: '13px', background: '#F7F4EE',
                        fontFamily: 'Trebuchet MS, Verdana, sans-serif', outline: 'none'
                      }}
                    />
                    <button onClick={responderConsulta} style={{
                      background: '#5B9B3C', color: '#fff',
                      border: 'none', padding: '10px 18px',
                      borderRadius: '100px', fontSize: '13px',
                      cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                    }}>→</button>
                  </div>
                </div>
              </div>
            )}

            {/* Respuesta consulta libre */}
            {respuestaConsulta && (
              <div style={{ background: '#EBF5E4', border: '1px solid #C8E8B0', borderRadius: '14px', padding: '18px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#5B9B3C', fontWeight: '600' }}>🤖 Tu coach responde</div>
                  <button onClick={() => { setRespuestaConsulta(null); setConsultaLibre(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#9A9790' }}>✕</button>
                </div>
                <div style={{ fontSize: '13px', color: '#1E1E1A', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: respuestaConsulta }} />
              </div>
            )}

            {/* Plan generado */}
            {planGenerado && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E0DBD0', overflow: 'hidden' }}>
                <div style={{ background: '#5B9B3C', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                      {objetivos.find(o => o.id === objetivoActivo)?.emoji} Plan {objetivos.find(o => o.id === objetivoActivo)?.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Semana del {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>
                  </div>
                  <button onClick={() => { setPlanGenerado(null); setObjetivoActivo(null); }} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: '#fff', padding: '6px 12px', borderRadius: '100px',
                    fontSize: '11px', cursor: 'pointer'
                  }}>Nuevo plan</button>
                </div>

                {/* Tabs del plan */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E0DBD0', background: '#F7F4EE' }}>
                  {['dieta', 'ejercicios', 'compra', 'suplementos'].map(tab => (
                    <button key={tab} onClick={() => setTabActivo(tab)} style={{
                      flex: 1, padding: '10px 4px',
                      background: tabActivo === tab ? '#fff' : 'transparent',
                      border: 'none', borderBottom: tabActivo === tab ? '2px solid #E8621A' : '2px solid transparent',
                      fontSize: '10px', fontWeight: '600', color: tabActivo === tab ? '#E8621A' : '#9A9790',
                      cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
                      fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                    }}>
                      {tab === 'dieta' ? '🥗 Dieta' : tab === 'ejercicios' ? '🏋️ Ejercicios' : tab === 'compra' ? '🛒 Compra' : '💊 Suplementos'}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {tabActivo === 'dieta' && (
                    <div>
                      {planGenerado.dieta.map((dia, i) => (
                        <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < planGenerado.dieta.length - 1 ? '1px solid #EDE9E0' : 'none' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#E8621A', marginBottom: '6px' }}>{dia.dia}</div>
                          {['desayuno', 'comida', 'cena', 'snack'].map(comida => (
                            <div key={comida} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '10px', color: '#9A9790', minWidth: '60px', textTransform: 'capitalize' }}>{comida}:</span>
                              <span style={{ fontSize: '11px', color: '#1E1E1A' }}>{dia[comida]}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {tabActivo === 'ejercicios' && (
                    <div>
                      {planGenerado.ejercicios.map((dia, i) => (
                        <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i < planGenerado.ejercicios.length - 1 ? '1px solid #EDE9E0' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#E8621A' }}>{dia.dia}</span>
                            <span style={{ fontSize: '10px', color: '#9A9790' }}>{dia.tipo}</span>
                          </div>
                          {dia.ejercicios.map((ej, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#5B9B3C', flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', color: '#1E1E1A' }}>{ej}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {tabActivo === 'compra' && (
                    <div>
                      {Object.entries(planGenerado.compra).map(([seccion, items]) => (
                        <div key={seccion} style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#5B9B3C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{seccion}</div>
                          {items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <div style={{ width: '14px', height: '14px', border: '1.5px solid #C8E8B0', borderRadius: '3px', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#1E1E1A' }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {tabActivo === 'suplementos' && (
                    <div>
                      {planGenerado.suplementos.map((sup, i) => (
                        <div key={i} style={{ background: '#F7F4EE', borderRadius: '10px', padding: '12px', marginBottom: '8px', border: '1px solid #E0DBD0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E1E1A' }}>💊 {sup.nombre}</div>
                            <div style={{ fontSize: '10px', background: '#EBF5E4', color: '#5B9B3C', padding: '2px 8px', borderRadius: '100px', border: '1px solid #C8E8B0' }}>{sup.prioridad}</div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B6860', marginBottom: '2px' }}>{sup.dosis}</div>
                          <div style={{ fontSize: '11px', color: '#9A9790' }}>{sup.motivo}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón PDF */}
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #EDE9E0', display: 'flex', gap: '8px' }}>
                    <button onClick={descargarPDF} style={{
                      flex: 1, background: '#E8621A', color: '#fff',
                      border: 'none', padding: '11px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                    }}>📄 Descargar PDF completo</button>
                    <button onClick={() => { setPlanGenerado(null); setObjetivoActivo(null); }} style={{
                      background: '#F7F4EE', color: '#6B6860',
                      border: '1px solid #E0DBD0', padding: '11px 16px',
                      borderRadius: '100px', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                    }}>Nuevo plan</button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {generando && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', border: '1px solid #E0DBD0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1E1E1A', marginBottom: '6px' }}>Generando tu plan personalizado...</div>
                <div style={{ fontSize: '12px', color: '#9A9790' }}>Analizando tu perfil metabólico</div>
              </div>
            )}

            {/* Botón generar plan */}
            {objetivoActivo && !planGenerado && !generando && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '32px' }}>{objetivos.find(o => o.id === objetivoActivo)?.emoji}</div>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1E1E1A' }}>
                      {objetivos.find(o => o.id === objetivoActivo)?.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9A9790', marginTop: '2px' }}>
                      Plan semanal personalizado para tu ICM de {ultimo?.icm_total}/100
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={generarPlan} style={{
                    flex: 1, background: '#5B9B3C', color: '#fff',
                    border: 'none', padding: '12px', borderRadius: '100px',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                  }}>Generar mi plan semanal →</button>
                  <button onClick={() => setObjetivoActivo(null)} style={{
                    background: '#F7F4EE', color: '#6B6860',
                    border: '1px solid #E0DBD0', padding: '12px 16px',
                    borderRadius: '100px', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                  }}>← Volver</button>
                </div>
              </div>
            )}
          </div>

          </div>
        )}
      </div>
    </div>
  );
}