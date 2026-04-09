'use client';
import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────
// PREGUNTAS v2 — test ICM optimizado
// Campos nuevos vs v1:
//   ECO: C_cinturon, C_distribucion, C_hinchazón, C_fluctuacion,
//        C_tono, C_fuerza_prehensil, C_sit_to_stand
//   EFH: F_dias, F_tipo, F_sedentarismo, F_talk_test,
//        F_recuperacion, F_avd, F_energia_fisica
//   NUT: N_aove, N_verduras, N_legumbres, N_pescado,
//        N_frutos_secos, N_ultraprocesados, N_proteina,
//        N_alcohol, N_antojo_tarde
//   DES: D_horas, D_calidad, D_somnolencia, D_social_jet_lag,
//        D_pantallas, D_cafeina, D_estres
//   VIT: V_digestion, V_deterioro, V_brain_fog, V_vitalidad
// Datos base sin cambio: C1, C2, C3, C4, C5, C6
// ─────────────────────────────────────────────────────────────────

const preguntas = [

  // ── INICIO ──────────────────────────────────────────────────────
  {
    id: 'bienvenida',
    mensaje: '¡Hola! 👋 Soy tu asistente metabólico. Voy a ayudarte a descubrir tu edad metabólica real en solo 5 minutos. ¿Empezamos?',
    tipo: 'opciones',
    campo: null,
    opciones: ['¡Sí, vamos! 🚀', 'Cuéntame más primero'],
  },
  {
    id: 'datos_bascula',
    mensaje: '¿Tienes datos de composición corporal? (báscula inteligente, gimnasio o análisis DEXA)',
    tipo: 'opciones',
    campo: 'tiene_bascula',
    opciones: ['Sí, tengo datos', 'No, no tengo'],
  },

  // ── DATOS BASE ──────────────────────────────────────────────────
  {
    id: 'nombre',
    mensaje: '¿Cómo te llamas?',
    tipo: 'texto',
    campo: 'nombre',
    placeholder: 'Tu nombre...',
  },
  {
    id: 'edad',
    mensaje: '¿Cuántos años tienes?',
    tipo: 'numero',
    campo: 'C1',
    placeholder: 'Ej: 35',
  },
  {
    id: 'sexo',
    mensaje: '¿Cuál es tu sexo biológico?',
    tipo: 'opciones',
    campo: 'C2',
    opciones: ['Hombre', 'Mujer'],
  },
  {
    id: 'altura',
    mensaje: '¿Cuánto mides? (cm)',
    tipo: 'numero',
    campo: 'C3',
    placeholder: 'Ej: 175',
  },
  {
    id: 'peso',
    mensaje: '¿Cuánto pesas? (kg)',
    tipo: 'numero',
    campo: 'C4',
    placeholder: 'Ej: 72',
  },
  // Solo si tiene_bascula === 'Sí, tengo datos'
  // tipo 'numero_opcional': muestra input numérico + botón "No tengo este dato"
  {
    id: 'grasa',
    mensaje: '¿Cuál es tu porcentaje de grasa corporal? Si no lo tienes exacto, pulsa "No lo sé".',
    tipo: 'numero_opcional',
    campo: 'C5',
    placeholder: 'Ej: 22',
  },
  {
    id: 'musculo',
    mensaje: '¿Cuál es tu porcentaje de masa muscular? Si no lo tienes, pulsa "No lo sé".',
    tipo: 'numero_opcional',
    campo: 'C6',
    placeholder: 'Ej: 38',
  },

  // ── BLOQUE ECO — Composición corporal ───────────────────────────
  {
    id: 'eco_cinturon',
    mensaje: '¿Al abrocharte el cinturón, usas el mismo agujero que hace 2 años?',
    tipo: 'opciones',
    campo: 'C_cinturon',
    opciones: ['Más suelto que antes', 'El mismo agujero', '1-2 agujeros más apretado', 'Mucho más apretado'],
  },
  {
    id: 'eco_distribucion',
    mensaje: 'Cuando te sientas, ¿el pantalón aprieta más en la cintura que en las caderas?',
    tipo: 'opciones',
    campo: 'C_distribucion',
    opciones: ['Me queda bien en ambos sitios', 'Aprieta igual en cintura y caderas', 'Aprieta claramente más en cintura', 'Mucho más en cintura, caderas holgadas'],
  },
  {
    id: 'eco_hinchazón',
    mensaje: '¿Notas hinchazón o pesadez en el abdomen tras las comidas?',
    tipo: 'opciones',
    campo: 'C_hinchazón',
    opciones: ['Nunca o casi nunca', 'Ocasionalmente (1-2 veces/sem)', 'Frecuentemente (3-4 veces/sem)', 'Casi siempre tras comer'],
  },
  {
    id: 'eco_fluctuacion',
    mensaje: '¿Tu peso ha variado más de 3 kg en los últimos 6 meses sin que lo hayas buscado?',
    tipo: 'opciones',
    campo: 'C_fluctuacion',
    opciones: ['No, mi peso es estable', 'He bajado más de 3 kg sin buscarlo', 'He subido más de 3 kg sin buscarlo', 'Fluctúa constantemente sin control'],
  },
  {
    id: 'eco_tono',
    mensaje: '¿Cómo describirías el tono muscular visible en brazos y piernas?',
    tipo: 'opciones',
    campo: 'C_tono',
    opciones: ['Músculos visibles y bien definidos', 'Algo de definición muscular', 'Poco tono, músculo poco visible', 'Sin tono aparente'],
  },
  {
    id: 'eco_fuerza',
    mensaje: '¿Puedes abrir un bote de cristal nuevo y apretado sin ayuda?',
    tipo: 'opciones',
    campo: 'C_fuerza_prehensil',
    opciones: ['Sí, sin dificultad', 'Sí, con algo de esfuerzo', 'Me cuesta, a veces no puedo', 'No, necesito ayuda o herramienta'],
  },
  {
    id: 'eco_sit_stand',
    mensaje: '¿Puedes levantarte del suelo desde posición sentada sin apoyar las manos?',
    tipo: 'opciones',
    campo: 'C_sit_to_stand',
    opciones: ['Sí, fácilmente y con control', 'Sí, pero necesito un pequeño impulso', 'Con dificultad, apoyo una mano', 'No puedo sin apoyar ambas manos'],
  },

  // ── BLOQUE EFH — Actividad física ───────────────────────────────
  {
    id: 'efh_dias',
    mensaje: '¿Cuántos días a la semana haces actividad física de más de 30 minutos?',
    tipo: 'opciones',
    campo: 'F_dias',
    opciones: ['0 días', '1-2 días', '3-4 días', '5 días o más'],
  },
  {
    id: 'efh_tipo',
    mensaje: '¿Qué tipo de actividad física haces principalmente?',
    tipo: 'opciones',
    campo: 'F_tipo',
    opciones: ['Ninguna', 'Caminar suave, movilidad o estiramientos', 'Cardio moderado o fuerza ligera', 'Fuerza progresiva, HIIT o deporte de competición'],
  },
  {
    id: 'efh_sedentarismo',
    mensaje: '¿Cuántas horas al día pasas sentado o con actividad sedentaria?',
    tipo: 'opciones',
    campo: 'F_sedentarismo',
    opciones: ['Menos de 4 horas', '4-6 horas', '6-8 horas', 'Más de 8 horas'],
  },
  {
    id: 'efh_talk_test',
    mensaje: '¿Puedes mantener una conversación normal caminando a paso rápido sin quedarte sin aliento?',
    tipo: 'opciones',
    campo: 'F_talk_test',
    opciones: ['Sí, sin ningún problema', 'Con algo de dificultad', 'Me cuesta bastante', 'No puedo, me falta el aire'],
  },
  {
    id: 'efh_recuperacion',
    mensaje: 'Tras subir escaleras o un esfuerzo breve, ¿en cuánto tiempo recuperas la respiración normal?',
    tipo: 'opciones',
    campo: 'F_recuperacion',
    opciones: ['Menos de 1 minuto', '1-3 minutos', '3-5 minutos', 'Más de 5 minutos'],
  },
  {
    id: 'efh_avd',
    mensaje: '¿Con qué facilidad realizas tareas físicas cotidianas como llevar bolsas, agacharte o levantarte del suelo?',
    tipo: 'opciones',
    campo: 'F_avd',
    opciones: ['Sin ninguna dificultad', 'Con dificultad leve', 'Con dificultad moderada', 'Con mucha dificultad'],
  },
  {
    id: 'efh_energia',
    mensaje: '¿Cómo valoras tu nivel de energía durante el ejercicio o el esfuerzo físico? (1-10)',
    tipo: 'escala',
    campo: 'F_energia_fisica',
  },

  // ── BLOQUE NUT — Nutrición ───────────────────────────────────────
  {
    id: 'nut_aove',
    mensaje: '¿Usas aceite de oliva virgen extra como grasa principal para cocinar y aliñar?',
    tipo: 'opciones',
    campo: 'N_aove',
    opciones: ['Siempre, es mi única grasa de cocina', 'Casi siempre', 'A veces, alterno con otras grasas', 'Rara vez o nunca'],
  },
  {
    id: 'nut_verduras',
    mensaje: '¿Consumes verduras o ensalada en al menos 2 comidas al día?',
    tipo: 'opciones',
    campo: 'N_verduras',
    opciones: ['Sí, todos los días', '4-5 días a la semana', '2-3 días a la semana', 'Menos de 2 días'],
  },
  {
    id: 'nut_legumbres',
    mensaje: '¿Consumes legumbres (lentejas, garbanzos, alubias) al menos 2 veces por semana?',
    tipo: 'opciones',
    campo: 'N_legumbres',
    opciones: ['Sí, 2 o más veces por semana', 'Una vez por semana', 'Ocasionalmente', 'Casi nunca o nunca'],
  },
  {
    id: 'nut_pescado',
    mensaje: '¿Comes pescado azul (sardinas, caballa, salmón, boquerón) al menos 2 veces por semana?',
    tipo: 'opciones',
    campo: 'N_pescado',
    opciones: ['Sí, 2 o más veces por semana', 'Una vez por semana', 'Ocasionalmente', 'Casi nunca o nunca'],
  },
  {
    id: 'nut_frutos_secos',
    mensaje: '¿Consumes un puñado de frutos secos (nueces, almendras) al menos 4 veces por semana?',
    tipo: 'opciones',
    campo: 'N_frutos_secos',
    opciones: ['Sí, 4 o más veces por semana', '2-3 veces por semana', 'Una vez por semana', 'Casi nunca o nunca'],
  },
  {
    id: 'nut_ultraprocesados',
    mensaje: '¿Con qué frecuencia consumes ultraprocesados (bollería, snacks, comida rápida, refrescos azucarados)?',
    tipo: 'opciones',
    campo: 'N_ultraprocesados',
    opciones: ['Rara vez o nunca', '1-2 veces por semana', '3-4 veces por semana', 'A diario'],
  },
  {
    id: 'nut_proteina',
    mensaje: '¿Incluyes una fuente de proteína en cada comida principal?',
    tipo: 'opciones',
    campo: 'N_proteina',
    opciones: ['Siempre', 'Casi siempre', 'A veces', 'Rara vez'],
  },
  {
    id: 'nut_alcohol',
    mensaje: '¿Con qué frecuencia consumes alcohol?',
    tipo: 'opciones',
    campo: 'N_alcohol',
    opciones: ['Nunca', 'Ocasional (menos de 1 vez/semana)', '1-2 veces por semana', '3 o más veces por semana'],
  },
  {
    id: 'nut_antojo',
    mensaje: '¿Tienes antojos intensos de azúcar o carbohidratos a media tarde (entre las 16h y las 18h)?',
    tipo: 'opciones',
    campo: 'N_antojo_tarde',
    opciones: ['Nunca o casi nunca', 'Ocasionalmente', 'Frecuentemente', 'Casi siempre, necesito algo dulce'],
  },

  // ── BLOQUE DES — Descanso y estrés ──────────────────────────────
  {
    id: 'des_horas',
    mensaje: '¿Cuántas horas duermes de media por noche?',
    tipo: 'opciones',
    campo: 'D_horas',
    opciones: ['Menos de 5 horas', '5-6 horas', '7-8 horas', 'Más de 8 horas'],
  },
  {
    id: 'des_calidad',
    mensaje: '¿Cómo de descansado/a te despiertas habitualmente? (1 agotado/a — 10 completamente recuperado/a)',
    tipo: 'escala',
    campo: 'D_calidad',
  },
  {
    id: 'des_somnolencia',
    mensaje: '¿Te quedas dormido/a involuntariamente en situaciones pasivas (TV, leyendo, reuniones tranquilas)?',
    tipo: 'opciones',
    campo: 'D_somnolencia',
    opciones: ['Nunca', 'Raramente', 'Con cierta frecuencia', 'Frecuentemente'],
  },
  {
    id: 'des_jet_lag',
    mensaje: 'Los fines de semana, ¿duermes más de 2 horas extra respecto a los días laborables?',
    tipo: 'opciones',
    campo: 'D_social_jet_lag',
    opciones: ['No, duermo lo mismo que entre semana', 'Duermo 1-2 horas más', 'Duermo más de 2 horas más', 'Recupero toda la semana los fines de semana'],
  },
  {
    id: 'des_pantallas',
    mensaje: '¿Usas el móvil, tablet o TV en los 30 minutos antes de dormir?',
    tipo: 'opciones',
    campo: 'D_pantallas',
    opciones: ['Nunca', 'A veces', 'Casi siempre', 'Siempre'],
  },
  {
    id: 'des_cafeina',
    mensaje: '¿Tomas cafeína (café, té, refrescos) después de las 15h?',
    tipo: 'opciones',
    campo: 'D_cafeina',
    opciones: ['Nunca', 'Ocasionalmente', 'Frecuentemente', 'A diario'],
  },
  {
    id: 'des_estres',
    mensaje: '¿Cómo valoras tu nivel de estrés sostenido en las últimas 4 semanas? (1 muy bajo — 10 muy alto)',
    tipo: 'escala',
    campo: 'D_estres',
  },

  // ── BLOQUE VIT — Vitalidad ───────────────────────────────────────
  {
    id: 'vit_digestion',
    mensaje: '¿Con qué frecuencia tienes hinchazón abdominal o gases tras las comidas?',
    tipo: 'opciones',
    campo: 'V_digestion',
    opciones: ['Nunca o casi nunca', 'Ocasionalmente', 'Frecuentemente', 'Casi siempre'],
  },
  {
    id: 'vit_deterioro',
    mensaje: '¿Tu rendimiento físico o mental ha empeorado en los últimos 6 meses sin causa aparente?',
    tipo: 'opciones',
    campo: 'V_deterioro',
    opciones: ['No, igual o mejor que hace 6 meses', 'Leve empeoramiento', 'Empeoramiento moderado y sostenido', 'Empeoramiento notable, me preocupa'],
  },
  {
    id: 'vit_brain_fog',
    mensaje: '¿Tienes con frecuencia sensación de niebla mental (dificultad para concentrarte, pensamientos lentos)?',
    tipo: 'opciones',
    campo: 'V_brain_fog',
    opciones: ['Nunca', 'Ocasionalmente', 'Frecuentemente', 'Casi siempre'],
  },
  {
    id: 'vit_vitalidad',
    mensaje: '¿Cómo valoras tu vitalidad general comparada con personas de tu misma edad? (1 mucho peor — 10 igual o mejor)',
    tipo: 'escala',
    campo: 'V_vitalidad',
  },
  {
    id: 'objetivo',
    mensaje: '¿Cuál es tu objetivo principal ahora mismo?',
    tipo: 'opciones',
    campo: 'N_objetivo',
    opciones: ['Perder grasa', 'Ganar músculo', 'Más energía', 'Mejorar descanso', 'Rendimiento deportivo', 'Envejecer mejor'],
  },

  // ── FINAL ────────────────────────────────────────────────────────
  {
    id: 'email',
    mensaje: '¡Casi terminamos! 🎉 ¿A qué email te enviamos tu resultado completo?',
    tipo: 'email',
    campo: 'email',
    placeholder: 'tu@email.com',
  },
];

// ─────────────────────────────────────────────────────────────────
// MICROFEEDBACKS
// ─────────────────────────────────────────────────────────────────
const microfeedbacks = [
  { despues: 'eco_sit_stand', mensaje: '💪 Perfecto, ya tengo tu perfil de composición corporal.' },
  { despues: 'efh_energia',   mensaje: '🏃 Genial, tu bloque de actividad completado.' },
  { despues: 'nut_antojo',    mensaje: '🥗 Muy bien, nutrición lista.' },
  { despues: 'des_estres',    mensaje: '😴 Descanso registrado. Último bloque, ya casi lo tenemos.' },
];

// ─────────────────────────────────────────────────────────────────
// TÉRMINOS Y CONDICIONES
// ─────────────────────────────────────────────────────────────────
const TC_TEXTO = `TÉRMINOS Y CONDICIONES DE USO — mymetaboliq.com
Última actualización: abril 2025
Titular: Iñigo Fábregas Unzurrunzaga · contacto: tutestmetabolico@gmail.com

1. NATURALEZA DEL SERVICIO Y CARÁCTER ORIENTATIVO
mymetaboliq.com ofrece un test de evaluación metabólica basado en datos autodeclarados por el usuario. Los resultados obtenidos — incluyendo el Índice de Calidad Metabólica (ICM), la edad metabólica estimada y las recomendaciones derivadas — tienen exclusivamente carácter orientativo e informativo.

Los cálculos se realizan mediante algoritmos que ponderan respuestas subjetivas del usuario. Por tanto, los resultados son aproximaciones estadísticas y en ningún caso constituyen un diagnóstico médico, nutricional o psicológico clínico.

2. AUSENCIA DE RELACIÓN MÉDICO-PACIENTE
El uso de este servicio no establece ningún tipo de relación médico-paciente, ni entre el usuario y el titular del sitio, ni entre el usuario y los profesionales de salud mencionados o enlazados en la plataforma. Las recomendaciones generadas son pautas generales de bienestar y no sustituyen bajo ningún concepto la valoración individualizada por parte de un profesional sanitario colegiado.

3. LIMITACIÓN DE RESPONSABILIDAD
El titular de mymetaboliq.com no asume responsabilidad alguna por las decisiones que el usuario adopte basándose, total o parcialmente, en los resultados del test. El usuario reconoce y acepta que:

(a) Los resultados dependen de la veracidad y precisión de los datos introducidos.
(b) Factores individuales de salud no contemplados en el test pueden alterar significativamente los resultados reales.
(c) Cualquier cambio en la dieta, rutina de ejercicio o hábitos de vida debe ser supervisado por un profesional de la salud cualificado.

4. PROFESIONALES AFILIADOS
mymetaboliq.com puede mostrar o recomendar profesionales de la salud, entre ellos nutricionistas, como Rocío Fábregas. Dichos profesionales actúan de forma independiente y su mención en la plataforma no implica que el titular del sitio avale, garantice ni sea responsable de los servicios que estos presten. La relación contractual y profesional se establece directamente entre el usuario y el profesional elegido.

5. PROTECCIÓN DE DATOS
Los datos personales facilitados — incluyendo el email y las respuestas al test — son tratados conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Se utilizan exclusivamente para generar el informe metabólico personalizado y, con el consentimiento del usuario, para el envío de recordatorios periódicos de seguimiento. No se ceden a terceros con fines comerciales.

6. ACEPTACIÓN
Al pulsar el botón de envío, el usuario declara haber leído, comprendido y aceptado íntegramente los presentes Términos y Condiciones, así como la Política de Privacidad de mymetaboliq.com.`;

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function ChatBot() {
  const [mensajes, setMensajes]                           = useState([]);
  const [preguntaActual, setPreguntaActual]               = useState(0);
  const [respuestas, setRespuestas]                       = useState({});
  const [inputValor, setInputValor]                       = useState('');
  const [cargando, setCargando]                           = useState(false);
  const [terminado, setTerminado]                         = useState(false);
  const [iniciado, setIniciado]                           = useState(false);
  const [mostrarTC, setMostrarTC]                         = useState(false);
  const [tcAceptado, setTcAceptado]                       = useState(false);
  const [respuestasFinalesTemp, setRespuestasFinalesTemp] = useState(null);

  // ── Autoscroll ──────────────────────────────────────────────────
  const mensajesEndRef     = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // Pequeño delay para que el DOM pinte el nuevo bubble antes de scrollear
    const t = setTimeout(() => {
      const el = scrollContainerRef.current; if (el) el.scrollTop = el.scrollHeight;
    }, 80);
    return () => clearTimeout(t);
  }, [mensajes]);

  // ── Helpers ─────────────────────────────────────────────────────
  const agregarMensaje = (texto, tipo) => {
    setMensajes(prev => [...prev, { texto, tipo, id: Date.now() + Math.random() }]);
  };

  const iniciarChat = () => {
    setIniciado(true);
    setTimeout(() => agregarMensaje(preguntas[0].mensaje, 'bot'), 300);
  };

  const procesarRespuesta = (valor, campoOverride) => {
    const pregunta = preguntas[preguntaActual];
    const campo    = campoOverride || pregunta.campo;

    agregarMensaje(valor, 'usuario');

    const nuevasRespuestas = campo
      ? { ...respuestas, [campo]: valor }
      : { ...respuestas };
    setRespuestas(nuevasRespuestas);
    setInputValor('');

    const feedback      = microfeedbacks.find(f => f.despues === pregunta.id);
    const siguienteIdx  = preguntaActual + 1;

    setTimeout(() => {
      if (feedback) {
        agregarMensaje(feedback.mensaje, 'bot');
        setTimeout(() => avanzar(siguienteIdx, nuevasRespuestas), 800);
      } else {
        avanzar(siguienteIdx, nuevasRespuestas);
      }
    }, 400);
  };

  const avanzar = (index, respuestasActuales) => {
    if (index >= preguntas.length) {
      setRespuestasFinalesTemp(respuestasActuales);
      setMostrarTC(true);
      return;
    }
    const siguiente = preguntas[index];

    // Saltar preguntas de báscula si el usuario no tiene datos
    if (siguiente.id === 'grasa'  && respuestasActuales.tiene_bascula === 'No, no tengo') {
      avanzar(index + 1, respuestasActuales);
      return;
    }
    if (siguiente.id === 'musculo' && respuestasActuales.tiene_bascula === 'No, no tengo') {
      avanzar(index + 1, respuestasActuales);
      return;
    }

    setPreguntaActual(index);
    agregarMensaje(siguiente.mensaje, 'bot');
  };

  const aceptarTCyEnviar = () => {
    setMostrarTC(false);
    enviarResultados(respuestasFinalesTemp);
  };

  // ── Envío a Make.com ────────────────────────────────────────────
  const enviarResultados = async (r) => {
    setCargando(true);
    agregarMensaje('Calculando tu perfil metabólico... ⚡', 'bot');

    try {
      const payload = {
        // Datos base
        nombre:        r.nombre      || '',
        email:         r.email       || '',
        tiene_bascula: r.tiene_bascula || '',
        tipo_test:     'v2',
        C1: parseInt(r.C1)     || 30,
        C2: r.C2               || '',
        C3: parseFloat(r.C3)   || 170,
        C4: parseFloat(r.C4)   || 70,
        C5: parseFloat(r.C5)   || '',   // vacío si no tiene báscula
        C6: parseFloat(r.C6)   || '',   // vacío si no tiene báscula

        // ECO
        C_cinturon:         r.C_cinturon         || '',
        C_distribucion:     r.C_distribucion     || '',
        C_hinchazón:        r.C_hinchazón        || '',
        C_fluctuacion:      r.C_fluctuacion      || '',
        C_tono:             r.C_tono             || '',
        C_fuerza_prehensil: r.C_fuerza_prehensil || '',
        C_sit_to_stand:     r.C_sit_to_stand     || '',

        // EFH
        F_dias:           r.F_dias           || '',
        F_tipo:           r.F_tipo           || '',
        F_sedentarismo:   r.F_sedentarismo   || '',
        F_talk_test:      r.F_talk_test      || '',
        F_recuperacion:   r.F_recuperacion   || '',
        F_avd:            r.F_avd            || '',
        F_energia_fisica: parseInt(r.F_energia_fisica) || 5,

        // NUT
        N_aove:            r.N_aove            || '',
        N_verduras:        r.N_verduras        || '',
        N_legumbres:       r.N_legumbres       || '',
        N_pescado:         r.N_pescado         || '',
        N_frutos_secos:    r.N_frutos_secos    || '',
        N_ultraprocesados: r.N_ultraprocesados || '',
        N_proteina:        r.N_proteina        || '',
        N_alcohol:         r.N_alcohol         || '',
        N_antojo_tarde:    r.N_antojo_tarde    || '',

        // DES
        D_horas:          r.D_horas          || '',
        D_calidad:        parseInt(r.D_calidad)   || 5,
        D_somnolencia:    r.D_somnolencia    || '',
        D_social_jet_lag: r.D_social_jet_lag || '',
        D_pantallas:      r.D_pantallas      || '',
        D_cafeina:        r.D_cafeina        || '',
        D_estres:         parseInt(r.D_estres)    || 5,

        // VIT
        V_digestion:  r.V_digestion  || '',
        V_deterioro:  r.V_deterioro  || '',
        V_brain_fog:  r.V_brain_fog  || '',
        V_vitalidad:  parseInt(r.V_vitalidad) || 5,
      };

      await fetch('https://hook.eu1.make.com/59n8zt2vk9mx0fla857yludehqf3bi4x', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      setCargando(false);
      setTerminado(true);
      agregarMensaje(
        `¡Listo ${r.nombre}! 🎉 Tu perfil metabólico está en camino. Revisa tu email en los próximos segundos.`,
        'bot'
      );
    } catch {
      setCargando(false);
      agregarMensaje('Ups, algo salió mal. Inténtalo de nuevo.', 'bot');
    }
  };

  const escalaOpciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const progreso       = Math.round((preguntaActual / preguntas.length) * 100);

  // ── Pantalla de inicio ──────────────────────────────────────────
  if (!iniciado) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F7F4EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif', padding: '20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(28px, 6vw, 36px)',
            color: '#1E1E1A', marginBottom: '12px', lineHeight: '1.1',
          }}>
            Descubre tu edad{' '}
            <span style={{ color: '#E8621A', fontStyle: 'italic' }}>metabólica</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6860', marginBottom: '32px', lineHeight: '1.7' }}>
            5 minutos · 100% gratis · Resultado inmediato
          </p>
          <button onClick={iniciarChat} style={{
            background: '#E8621A', color: '#fff',
            border: 'none', padding: '16px 36px',
            borderRadius: '100px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer',
            fontFamily: 'Trebuchet MS, Verdana, sans-serif',
            boxShadow: '0 6px 24px rgba(232,98,26,0.35)',
            width: '100%', maxWidth: '280px',
          }}>
            Empezar el test →
          </button>
        </div>
      </div>
    );
  }

  const pregunta = preguntas[preguntaActual];

  // ── Chat principal ──────────────────────────────────────────────
  return (
    <div style={{
      height: '100dvh',
      background: '#F7F4EE',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── POPUP T&C ──────────────────────────────────────────── */}
      {mostrarTC && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20,
            maxWidth: 560, width: '100%',
            maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}>
            <div style={{ background: '#5B9B3C', borderRadius: '20px 20px 0 0', padding: '18px 24px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Antes de continuar</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#fff' }}>Términos y Condiciones</div>
            </div>
            <div style={{ padding: '16px 24px', background: '#EBF5E4', borderBottom: '1px solid #E0DBD0' }}>
              <div style={{ fontSize: 13, color: '#3B6D11', lineHeight: 1.7 }}>
                <div style={{ marginBottom: 4 }}>✅ Los resultados son <strong>orientativos</strong>, no diagnósticos médicos.</div>
                <div style={{ marginBottom: 4 }}>✅ Nunca sustituyen la consulta con un profesional de la salud.</div>
                <div style={{ marginBottom: 4 }}>✅ Los profesionales afiliados actúan de forma independiente.</div>
                <div>✅ Tus datos se tratan conforme al RGPD y no se ceden a terceros.</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', fontSize: 11, color: '#6B6860', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {TC_TEXTO}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E0DBD0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#1E1E1A', cursor: 'pointer', marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={tcAceptado}
                  onChange={e => setTcAceptado(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#5B9B3C', width: 16, height: 16, flexShrink: 0 }}
                />
                He leído y acepto los Términos y Condiciones y la Política de Privacidad
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMostrarTC(false)} style={{ flex: 1, background: '#F7F4EE', color: '#6B6860', border: '1px solid #E0DBD0', padding: '12px', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif' }}>
                  Cancelar
                </button>
                <button onClick={aceptarTCyEnviar} disabled={!tcAceptado} style={{ flex: 2, background: tcAceptado ? '#5B9B3C' : '#C8E8B0', color: '#fff', border: 'none', padding: '12px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: tcAceptado ? 'pointer' : 'not-allowed', fontFamily: 'Trebuchet MS, Verdana, sans-serif', transition: 'background 0.2s' }}>
                  Acepto y ver mi resultado →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ background: '#E8621A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>🧬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Test Metabólico</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>● En línea</div>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{progreso}% completado</div>
      </div>

      {/* ── BARRA DE PROGRESO ──────────────────────────────────── */}
      <div style={{ height: '4px', background: '#EDE9E0', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#5B9B3C', width: `${progreso}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* ── MENSAJES — zona scrollable ─────────────────────────── */}
      {/* El wrapper exterior ocupa todo el ancho y es el que scrollea.  */}
      {/* El inner centra el contenido a maxWidth sin romper el scroll.  */}
      <div ref={scrollContainerRef} style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div style={{
        flex: 1,
        padding: '16px 12px 8px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxWidth: '640px', width: '100%',
        margin: '0 auto',
      }}>
        {mensajes.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '11px 15px',
              borderRadius: msg.tipo === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.tipo === 'usuario' ? '#E8621A' : '#fff',
              color: msg.tipo === 'usuario' ? '#fff' : '#1E1E1A',
              fontSize: '14px', lineHeight: '1.6',
              boxShadow: '0 2px 8px rgba(30,30,26,0.07)',
              border: msg.tipo === 'bot' ? '1px solid #E0DBD0' : 'none',
              wordBreak: 'break-word',
            }}>
              {msg.texto}
            </div>
          </div>
        ))}

        {/* Animación de carga */}
        {cargando && (
          <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: '#fff', borderRadius: '16px 16px 16px 4px', width: 'fit-content', border: '1px solid #E0DBD0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5B9B3C', opacity: 0.6, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}

        {/* Ancla invisible — el scroll siempre llega aquí */}
        <div ref={mensajesEndRef} style={{ height: 1, flexShrink: 0 }} />
      </div>{/* cierra inner */}
      </div>{/* cierra outer scrollable */}

      {/* ── INPUT — fijo en la parte inferior ──────────────────── */}
      {!terminado && !cargando && (
        <div style={{
          padding: '12px 12px env(safe-area-inset-bottom, 12px)',
          background: '#fff',
          borderTop: '1px solid #E0DBD0',
          maxWidth: '640px', width: '100%',
          margin: '0 auto',
          flexShrink: 0,
        }}>

          {/* Opciones */}
          {pregunta?.tipo === 'opciones' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {pregunta.opciones.map(op => (
                <button key={op} onClick={() => procesarRespuesta(op)} style={{
                  background: '#F7F4EE', border: '1.5px solid #5B9B3C',
                  color: '#5B9B3C', padding: '9px 15px',
                  borderRadius: '100px', fontSize: '13px',
                  fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  lineHeight: '1.35', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#5B9B3C'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F7F4EE'; e.currentTarget.style.color = '#5B9B3C'; }}
                >
                  {op}
                </button>
              ))}
            </div>
          )}

          {/* Escala 1-10 */}
          {pregunta?.tipo === 'escala' && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {escalaOpciones.map(n => (
                <button key={n} onClick={() => procesarRespuesta(String(n))} style={{
                  width: '38px', height: '38px',
                  background: '#F7F4EE', border: '1.5px solid #E0DBD0',
                  color: '#1E1E1A', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8621A'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#E8621A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F7F4EE'; e.currentTarget.style.color = '#1E1E1A'; e.currentTarget.style.borderColor = '#E0DBD0'; }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {/* Número opcional — input + botón de escape */}
          {pregunta?.tipo === 'numero_opcional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={inputValor}
                  onChange={e => setInputValor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputValor.trim() && procesarRespuesta(inputValor.trim())}
                  placeholder={pregunta.placeholder}
                  inputMode="decimal"
                  style={{
                    flex: 1, padding: '12px 16px',
                    border: '1.5px solid #E0DBD0', borderRadius: '100px',
                    fontSize: '16px',
                    fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                    background: '#F7F4EE', color: '#1E1E1A', outline: 'none',
                  }}
                />
                <button
                  onClick={() => inputValor.trim() && procesarRespuesta(inputValor.trim())}
                  style={{
                    background: '#E8621A', color: '#fff',
                    border: 'none', padding: '12px 18px',
                    borderRadius: '100px', fontSize: '16px',
                    cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                    flexShrink: 0,
                  }}
                >→</button>
              </div>
              <button
                onClick={() => procesarRespuesta('', pregunta.campo)}
                style={{
                  background: 'transparent', color: '#9A9790',
                  border: '1px solid #E0DBD0', padding: '8px 16px',
                  borderRadius: '100px', fontSize: '12px',
                  cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  alignSelf: 'flex-start',
                }}
              >
                No lo sé / No tengo este dato
              </button>
            </div>
          )}

          {/* Texto / número / email */}
          {(pregunta?.tipo === 'texto' || pregunta?.tipo === 'numero' || pregunta?.tipo === 'email') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={pregunta.tipo === 'numero' ? 'number' : pregunta.tipo === 'email' ? 'email' : 'text'}
                value={inputValor}
                onChange={e => setInputValor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inputValor.trim() && procesarRespuesta(inputValor.trim())}
                placeholder={pregunta.placeholder}
                autoComplete={pregunta.tipo === 'email' ? 'email' : 'off'}
                inputMode={pregunta.tipo === 'numero' ? 'decimal' : undefined}
                style={{
                  flex: 1, padding: '12px 16px',
                  border: '1.5px solid #E0DBD0', borderRadius: '100px',
                  fontSize: '16px', // 16px evita el zoom automático en iOS
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  background: '#F7F4EE', color: '#1E1E1A', outline: 'none',
                }}
              />
              <button onClick={() => inputValor.trim() && procesarRespuesta(inputValor.trim())} style={{
                background: '#E8621A', color: '#fff',
                border: 'none', padding: '12px 18px',
                borderRadius: '100px', fontSize: '16px',
                cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                flexShrink: 0,
              }}>→</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}