'use client';
import { useState } from 'react';

const preguntas = [
  {
    id: 'bienvenida',
    mensaje: '¡Hola! 👋 Soy tu asistente metabólico. Voy a ayudarte a descubrir tu edad metabólica real en solo 4 minutos. ¿Empezamos?',
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
  {
    id: 'grasa',
    mensaje: '¿Cuál es tu porcentaje de grasa corporal?',
    tipo: 'numero',
    campo: 'C5',
    placeholder: 'Ej: 22',
    opcional: true,
  },
  {
    id: 'musculo',
    mensaje: '¿Cuál es tu porcentaje de masa muscular?',
    tipo: 'numero',
    campo: 'C6',
    placeholder: 'Ej: 38',
    opcional: true,
  },
  {
    id: 'grasa_visible',
    mensaje: '¿Notas grasa acumulada visible en tu cuerpo?',
    tipo: 'opciones',
    campo: 'E_grasa_visible',
    opciones: ['Nada', 'Algo', 'Bastante', 'Mucha'],
  },
  {
    id: 'abdomen_actual',
    mensaje: '¿Cómo ves tu abdomen ahora mismo?',
    tipo: 'opciones',
    campo: 'E_abdomen',
    opciones: ['Plano', 'Suave', 'Redondo', 'Prominente'],
  },
  {
    id: 'barriga_visible',
    mensaje: '¿Tienes barriga o michelines visibles?',
    tipo: 'opciones',
    campo: 'E_barriga',
    opciones: ['No', 'Leve', 'Moderada', 'Bastante'],
  },
  {
    id: 'fuerza_percibida',
    mensaje: '¿Cómo de fuerte te sientes comparado con la mayoría de personas de tu edad? (1 muy débil — 10 muy fuerte)',
    tipo: 'escala',
    campo: 'E6',
  },
  {
    id: 'musculo_definido',
    mensaje: '¿Notas músculo definido en brazos o piernas?',
    tipo: 'opciones',
    campo: 'E_musculo',
    opciones: ['Sí, bien definido', 'Algo de definición', 'Poco', 'Nada'],
  },
  {
    id: 'ropa_año',
    mensaje: '¿Tu ropa de hace 1 año te queda igual?',
    tipo: 'opciones',
    campo: 'E5',
    opciones: ['Más suelta', 'Igual', 'Más ajustada', 'Muy ajustada'],
  },
  {
    id: 'cansancio_esfuerzo',
    mensaje: '¿Te cansas haciendo esfuerzos cortos como subir escaleras?',
    tipo: 'opciones',
    campo: 'E_cansancio',
    opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre'],
  },
  {
    id: 'distribucion_grasa',
    mensaje: '¿Dónde tiendes a acumular más grasa?',
    tipo: 'opciones',
    campo: 'C12',
    opciones: ['Abdomen', 'Caderas y piernas', 'Distribución uniforme'],
  },
  {
    id: 'retencion',
    mensaje: '¿Notas retención de líquidos o hinchazón?',
    tipo: 'opciones',
    campo: 'C13',
    opciones: ['Nunca', 'A veces', 'Frecuentemente'],
  },
  {
    id: 'actividad_dias',
    mensaje: '¿Cuántos días a la semana haces actividad física de más de 30 minutos?',
    tipo: 'opciones',
    campo: 'F1',
    opciones: ['0', '1-2', '3-4', '5+'],
  },
  {
    id: 'actividad_tipo',
    mensaje: '¿Qué tipo de actividad haces principalmente?',
    tipo: 'opciones',
    campo: 'F2',
    opciones: ['Ninguna', 'Caminata-Yoga', 'Fuerza-Cardio', 'Intenso'],
  },
  {
    id: 'sedentarismo',
    mensaje: '¿Cuántas horas al día pasas sentado?',
    tipo: 'opciones',
    campo: 'F3',
    opciones: ['<4h', '4-8h', '>8h'],
  },
  {
    id: 'energia',
    mensaje: '¿Cómo valorarías tu nivel de energía diaria? (1 muy bajo — 10 excelente)',
    tipo: 'escala',
    campo: 'F4',
  },
  {
    id: 'tiempo_rutina',
    mensaje: '¿Cuánto tiempo llevas con tu rutina de ejercicio actual?',
    tipo: 'opciones',
    campo: 'F_tiempo_rutina',
    opciones: ['Menos de 1 mes', '1-3 meses', '3-6 meses', 'Más de 6 meses'],
  },
  {
    id: 'recuperacion',
    mensaje: '¿Cómo te recuperas después de entrenar?',
    tipo: 'opciones',
    campo: 'F_recuperacion',
    opciones: ['Muy bien, sin agujetas', 'Bien, agujetas leves', 'Regular, tardo en recuperar', 'Mal, siempre con agujetas'],
  },
  {
    id: 'calentamiento',
    mensaje: '¿Haces calentamiento y estiramientos en tus entrenamientos?',
    tipo: 'opciones',
    campo: 'F_calentamiento',
    opciones: ['Siempre', 'A veces', 'Casi nunca', 'Nunca'],
  },
  {
    id: 'cambio_cuerpo',
    mensaje: '¿Con tu entrenamiento actual has notado cambios en tu cuerpo?',
    tipo: 'opciones',
    campo: 'F_cambio_cuerpo',
    opciones: ['Sí, muchos cambios', 'Sí, algo', 'Poco cambio', 'Ningún cambio'],
  },
  {
    id: 'comidas',
    mensaje: '¿Cuántas comidas completas haces al día?',
    tipo: 'opciones',
    campo: 'N1',
    opciones: ['1-2', '3', '4-5', '>5'],
  },
  {
    id: 'proteina',
    mensaje: '¿Incluyes proteínas en cada comida principal?',
    tipo: 'opciones',
    campo: 'N2',
    opciones: ['Nunca', 'A veces', 'Casi siempre', 'Siempre'],
  },
  {
    id: 'ultraprocesados',
    mensaje: '¿Con qué frecuencia consumes ultraprocesados?',
    tipo: 'opciones',
    campo: 'N4',
    opciones: ['Diario', '3-4sem', '1-2sem', 'Rara vez'],
  },
  {
    id: 'alcohol',
    mensaje: '¿Con qué frecuencia consumes alcohol?',
    tipo: 'opciones',
    campo: 'N5',
    opciones: ['Varias/sem', '1sem', 'Ocasional', 'Nunca'],
  },
  {
    id: 'agua',
    mensaje: '¿Cuántos litros de agua bebes al día?',
    tipo: 'opciones',
    campo: 'N6',
    opciones: ['<1', '1-1.5', '1.5-2', '>2'],
  },
  {
    id: 'objetivo',
    mensaje: '¿Cuál es tu objetivo principal ahora mismo?',
    tipo: 'opciones',
    campo: 'N7',
    opciones: ['Definir', 'Masa muscular', 'Mantener', 'Rendimiento', 'Ninguno'],
  },
  {
    id: 'sueno',
    mensaje: '¿Cuántas horas duermes de media?',
    tipo: 'opciones',
    campo: 'D1',
    opciones: ['<5', '5-6', '7-8', '>8'],
  },
  {
    id: 'calidad_sueno',
    mensaje: '¿Cómo de descansado te despiertas? (1 muy mal — 10 perfecto)',
    tipo: 'escala',
    campo: 'D2',
  },
  {
    id: 'hora_acostarse',
    mensaje: '¿A qué hora te sueles acostar habitualmente?',
    tipo: 'opciones',
    campo: 'D_hora_acostarse',
    opciones: ['Antes de las 22h', '22h-23h', '23h-00h', 'Después de las 00h'],
  },
  {
    id: 'movil_antes_dormir',
    mensaje: '¿Usas el móvil o pantallas justo antes de dormir?',
    tipo: 'opciones',
    campo: 'D_movil',
    opciones: ['Nunca', 'A veces', 'Casi siempre', 'Siempre'],
  },
  {
    id: 'cafeina_tarde',
    mensaje: '¿Tomas cafeína (café, té, refrescos) después de las 15h?',
    tipo: 'opciones',
    campo: 'D_cafeina',
    opciones: ['Nunca', 'A veces', 'Frecuentemente', 'A diario'],
  },
  {
    id: 'estres',
    mensaje: '¿Cómo valorarías tu nivel de estrés diario? (1 muy bajo — 10 muy alto)',
    tipo: 'escala',
    campo: 'D4',
  },
  {
    id: 'concentracion',
    mensaje: '¿Cómo describirías tu nivel de concentración durante el día?',
    tipo: 'opciones',
    campo: 'V_concentracion',
    opciones: ['Excelente', 'Buena', 'Regular', 'Mala'],
  },
  {
    id: 'ansiedad',
    mensaje: '¿Tienes momentos de ansiedad o preocupación frecuente?',
    tipo: 'opciones',
    campo: 'V_ansiedad',
    opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Casi siempre'],
  },
  {
    id: 'vitalidad',
    mensaje: '¿Tu cuerpo responde igual que hace unos años? (1 mucho peor — 10 igual o mejor)',
    tipo: 'escala',
    campo: 'V1',
  },
  {
    id: 'claridad',
    mensaje: '¿Cómo valorarías tu claridad mental diaria? (1 muy baja — 10 excelente)',
    tipo: 'escala',
    campo: 'V2',
  },
  {
    id: 'digestion',
    mensaje: '¿Cómo es tu digestión habitualmente?',
    tipo: 'opciones',
    campo: 'V3',
    opciones: ['Pesada', 'Normal', 'Ligera', 'Muy ligera'],
  },
  {
    id: 'motivacion',
    mensaje: '¿Cómo valorarías tu motivación diaria? (1 muy baja — 10 excelente)',
    tipo: 'escala',
    campo: 'V4',
  },
  {
    id: 'email',
    mensaje: '¡Casi terminamos! 🎉 ¿A qué email te enviamos tu resultado completo?',
    tipo: 'email',
    campo: 'email',
    placeholder: 'tu@email.com',
  },
];

const microfeedbacks = [
  { despues: 'actividad_dias', mensaje: '💪 Perfecto, ya tengo tu perfil de actividad.' },
  { despues: 'ultraprocesados', mensaje: '🥗 Genial, casi hemos terminado con nutrición.' },
  { despues: 'sueno', mensaje: '😴 Bien, ahora el bloque de descanso.' },
  { despues: 'vitalidad', mensaje: '🧠 Último bloque, ya casi lo tenemos.' },
];

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

export default function ChatBot() {
  const [mensajes, setMensajes] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [inputValor, setInputValor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [mostrarTC, setMostrarTC] = useState(false);
  const [tcAceptado, setTcAceptado] = useState(false);
  const [respuestasFinalesTemp, setRespuestasFinalesTemp] = useState(null);

  const agregarMensaje = (texto, tipo) => {
    setMensajes(prev => [...prev, { texto, tipo, id: Date.now() }]);
  };

  const iniciarChat = () => {
    setIniciado(true);
    setTimeout(() => {
      agregarMensaje(preguntas[0].mensaje, 'bot');
    }, 300);
  };

  const procesarRespuesta = (valor, campoOverride) => {
    const pregunta = preguntas[preguntaActual];
    const campo = campoOverride || pregunta.campo;

    agregarMensaje(valor, 'usuario');

    const nuevasRespuestas = campo ? { ...respuestas, [campo]: valor } : { ...respuestas };
    setRespuestas(nuevasRespuestas);
    setInputValor('');

    const feedback = microfeedbacks.find(f => f.despues === pregunta.id);
    const siguienteIndex = preguntaActual + 1;

    setTimeout(() => {
      if (feedback) {
        agregarMensaje(feedback.mensaje, 'bot');
        setTimeout(() => {
          avanzar(siguienteIndex, nuevasRespuestas);
        }, 800);
      } else {
        avanzar(siguienteIndex, nuevasRespuestas);
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

    if (siguiente.id === 'grasa' && respuestasActuales.tiene_bascula === 'No, no tengo') {
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

  const enviarResultados = async (respuestasFinales) => {
    setCargando(true);
    agregarMensaje('Calculando tu perfil metabólico... ⚡', 'bot');

    try {
      const payload = {
        ...respuestasFinales,
        tipo_test: 'completo',
        F4: parseInt(respuestasFinales.F4) || 5,
        D2: parseInt(respuestasFinales.D2) || 5,
        D4: parseInt(respuestasFinales.D4) || 5,
        V1: parseInt(respuestasFinales.V1) || 5,
        V2: parseInt(respuestasFinales.V2) || 5,
        V4: parseInt(respuestasFinales.V4) || 5,
        C1: parseInt(respuestasFinales.C1) || 30,
        C4: parseFloat(respuestasFinales.C4) || 70,
        C5: parseFloat(respuestasFinales.C5) || '',
        C6: parseFloat(respuestasFinales.C6) || '',
      };

      await fetch('https://hook.eu1.make.com/59n8zt2vk9mx0fla857yludehqf3bi4x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setCargando(false);
      setTerminado(true);
      agregarMensaje(`¡Listo ${respuestasFinales.nombre}! 🎉 Tu perfil metabólico está en camino. Revisa tu email en los próximos segundos.`, 'bot');

    } catch (error) {
      setCargando(false);
      agregarMensaje('Ups, algo salió mal. Inténtalo de nuevo.', 'bot');
    }
  };

  const escalaOpciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  if (!iniciado) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F7F4EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif', padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: '36px',
            color: '#1E1E1A', marginBottom: '12px', lineHeight: '1.1'
          }}>
            Descubre tu edad <span style={{ color: '#E8621A', fontStyle: 'italic' }}>metabólica</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6860', marginBottom: '32px', lineHeight: '1.7' }}>
            4 minutos · 100% gratis · Resultado inmediato
          </p>
          <button onClick={iniciarChat} style={{
            background: '#E8621A', color: '#fff',
            border: 'none', padding: '16px 36px',
            borderRadius: '100px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer',
            fontFamily: 'Trebuchet MS, Verdana, sans-serif',
            boxShadow: '0 6px 24px rgba(232,98,26,0.35)'
          }}>
            Empezar el test →
          </button>
        </div>
      </div>
    );
  }

  const pregunta = preguntas[preguntaActual];

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F4EE',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      display: 'flex', flexDirection: 'column'
    }}>

      {/* POPUP T&C */}
      {mostrarTC && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20,
            maxWidth: 560, width: '100%',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}>
            {/* Header popup */}
            <div style={{
              background: '#5B9B3C', borderRadius: '20px 20px 0 0',
              padding: '20px 24px',
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Antes de continuar</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#fff' }}>
                Términos y Condiciones
              </div>
            </div>

            {/* Resumen visual */}
            <div style={{ padding: '20px 24px', background: '#EBF5E4', borderBottom: '1px solid #E0DBD0' }}>
              <div style={{ fontSize: 13, color: '#3B6D11', lineHeight: 1.7 }}>
                <div style={{ marginBottom: 6 }}>✅ Los resultados son <strong>orientativos</strong>, no diagnósticos médicos.</div>
                <div style={{ marginBottom: 6 }}>✅ Nunca sustituyen la consulta con un profesional de la salud.</div>
                <div style={{ marginBottom: 6 }}>✅ Los profesionales afiliados (como Rocío Fábregas) actúan de forma independiente.</div>
                <div>✅ Tus datos se tratan conforme al RGPD y no se ceden a terceros.</div>
              </div>
            </div>

            {/* Texto legal completo scrollable */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '20px 24px',
              fontSize: 11, color: '#6B6860', lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}>
              {TC_TEXTO}
            </div>

            {/* Checkbox + botones */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E0DBD0' }}>
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 13, color: '#1E1E1A', cursor: 'pointer',
                marginBottom: 16,
              }}>
                <input
                  type="checkbox"
                  checked={tcAceptado}
                  onChange={e => setTcAceptado(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#5B9B3C', width: 16, height: 16, flexShrink: 0 }}
                />
                He leído y acepto los Términos y Condiciones y la Política de Privacidad de mymetaboliq.com
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setMostrarTC(false)}
                  style={{
                    flex: 1, background: '#F7F4EE', color: '#6B6860',
                    border: '1px solid #E0DBD0', padding: '12px',
                    borderRadius: 100, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={aceptarTCyEnviar}
                  disabled={!tcAceptado}
                  style={{
                    flex: 2,
                    background: tcAceptado ? '#5B9B3C' : '#C8E8B0',
                    color: '#fff', border: 'none', padding: '12px',
                    borderRadius: 100, fontSize: 13, fontWeight: 700,
                    cursor: tcAceptado ? 'pointer' : 'not-allowed',
                    fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                    transition: 'background 0.2s',
                  }}
                >
                  Acepto y ver mi resultado →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: '#E8621A', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px'
        }}>🧬</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Test Metabólico</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>● En línea</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
          {Math.round((preguntaActual / preguntas.length) * 100)}% completado
        </div>
      </div>

      {/* Barra progreso */}
      <div style={{ height: '4px', background: '#EDE9E0' }}>
        <div style={{
          height: '100%', background: '#5B9B3C',
          width: `${Math.round((preguntaActual / preguntas.length) * 100)}%`,
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Mensajes */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        maxWidth: '640px', width: '100%', margin: '0 auto'
      }}>
        {mensajes.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px',
              borderRadius: msg.tipo === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.tipo === 'usuario' ? '#E8621A' : '#fff',
              color: msg.tipo === 'usuario' ? '#fff' : '#1E1E1A',
              fontSize: '14px', lineHeight: '1.6',
              boxShadow: '0 2px 8px rgba(30,30,26,0.08)',
              border: msg.tipo === 'bot' ? '1px solid #E0DBD0' : 'none'
            }}>
              {msg.texto}
            </div>
          </div>
        ))}

        {cargando && (
          <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: '#fff', borderRadius: '16px 16px 16px 4px', width: 'fit-content', border: '1px solid #E0DBD0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#5B9B3C', opacity: 0.6,
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      {!terminado && !cargando && (
        <div style={{
          padding: '16px', background: '#fff',
          borderTop: '1px solid #E0DBD0',
          maxWidth: '640px', width: '100%', margin: '0 auto'
        }}>

          {pregunta?.tipo === 'opciones' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {pregunta.opciones.map(op => (
                <button key={op} onClick={() => procesarRespuesta(op)} style={{
                  background: '#F7F4EE', border: '1.5px solid #5B9B3C',
                  color: '#5B9B3C', padding: '10px 18px',
                  borderRadius: '100px', fontSize: '13px',
                  fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.target.style.background = '#5B9B3C'; e.target.style.color = '#fff'; }}
                  onMouseLeave={e => { e.target.style.background = '#F7F4EE'; e.target.style.color = '#5B9B3C'; }}
                >
                  {op}
                </button>
              ))}
            </div>
          )}

          {pregunta?.tipo === 'escala' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {escalaOpciones.map(n => (
                <button key={n} onClick={() => procesarRespuesta(String(n))} style={{
                  width: '40px', height: '40px',
                  background: '#F7F4EE', border: '1.5px solid #E0DBD0',
                  color: '#1E1E1A', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                }}
                  onMouseEnter={e => { e.target.style.background = '#E8621A'; e.target.style.color = '#fff'; e.target.style.borderColor = '#E8621A'; }}
                  onMouseLeave={e => { e.target.style.background = '#F7F4EE'; e.target.style.color = '#1E1E1A'; e.target.style.borderColor = '#E0DBD0'; }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {(pregunta?.tipo === 'texto' || pregunta?.tipo === 'numero' || pregunta?.tipo === 'email') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={pregunta.tipo === 'numero' ? 'number' : pregunta.tipo === 'email' ? 'email' : 'text'}
                value={inputValor}
                onChange={e => setInputValor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inputValor.trim() && procesarRespuesta(inputValor.trim())}
                placeholder={pregunta.placeholder}
                style={{
                  flex: 1, padding: '12px 16px',
                  border: '1.5px solid #E0DBD0', borderRadius: '100px',
                  fontSize: '14px', fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  background: '#F7F4EE', color: '#1E1E1A', outline: 'none'
                }}
              />
              <button
                onClick={() => inputValor.trim() && procesarRespuesta(inputValor.trim())}
                style={{
                  background: '#E8621A', color: '#fff',
                  border: 'none', padding: '12px 20px',
                  borderRadius: '100px', fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'Trebuchet MS, Verdana, sans-serif'
                }}
              >→</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}