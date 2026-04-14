"use client";
const C = { bg: "#F7F4EE", green: "#5B9B3C", orange: "#E8621A", white: "#FFFFFF", dark: "#1A1A1A", mid: "#6B6B6B", light: "#E8E4DC", greenLight: "#EAF3DE", greenPale: "#EBF5E4", orangePale: "#FDF0E8" };
const font = "'Trebuchet MS', Verdana, sans-serif";

export default function Terminos() {
  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: C.green, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: C.white, textDecoration: "none" }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></a>
        <a href="/" style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textDecoration: "none" }}>← Volver</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: C.green, borderRadius: 16, padding: "32px 28px", marginBottom: 24, color: C.white }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Condiciones de uso</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0 }}>Términos y Condiciones</h1>
        </div>

        {[
          {
            titulo: "1. Naturaleza del servicio y carácter orientativo",
            contenido: `mymetaboliq.com ofrece un test de evaluación metabólica basado en datos autodeclarados por el usuario. Los resultados —incluyendo el Índice de Calidad Metabólica (ICM), la edad metabólica estimada y las recomendaciones derivadas— tienen exclusivamente carácter orientativo e informativo.

Los cálculos se realizan mediante algoritmos que ponderan respuestas subjetivas del usuario. Por tanto, los resultados son aproximaciones estadísticas y en ningún caso constituyen un diagnóstico médico, nutricional o psicológico clínico.

La base informativa del servicio se nutre de artículos con evidencia científica contrastada (RCTs, revisiones sistemáticas y metaanálisis), validados por Rocío Fábregas Unzurrunzaga (Nº colegiada CAT001384), nutricionista clínica. Cuando se cite evidencia procedente de estudios en animales, se indicará expresamente que dicha evidencia tiene menor traslación directa al ser humano.`,
            color: false
          },
          {
            titulo: "2. Ausencia de relación médico-paciente",
            contenido: `El uso de este servicio no establece ningún tipo de relación médico-paciente, ni entre el usuario y el titular del sitio, ni entre el usuario y los profesionales de salud mencionados o enlazados en la plataforma.

Las recomendaciones generadas —tanto por el algoritmo ICM como por el coach de inteligencia artificial— son pautas generales de bienestar y no sustituyen bajo ningún concepto la valoración individualizada por parte de un profesional sanitario colegiado.`,
            color: true
          },
          {
            titulo: "3. Limitación de responsabilidad",
            contenido: `El titular de mymetaboliq.com no asume responsabilidad alguna por las decisiones que el usuario adopte basándose, total o parcialmente, en los resultados del test o en las recomendaciones del coach. El usuario reconoce y acepta que:

(a) Los resultados dependen de la veracidad y precisión de los datos introducidos.
(b) Factores individuales de salud no contemplados en el test pueden alterar significativamente los resultados reales.
(c) Cualquier cambio en la dieta, rutina de ejercicio o hábitos de vida debe ser supervisado por un profesional de la salud cualificado.
(d) Las respuestas del coach de IA son orientativas y generadas automáticamente — no reemplazan el criterio de un profesional sanitario.`,
            color: false
          },
          {
            titulo: "4. Profesionales afiliados",
            contenido: `mymetaboliq.com puede mostrar o recomendar profesionales de la salud, entre ellos nutricionistas como Rocío Fábregas Unzurrunzaga (Nº colegiada CAT001384).

Dichos profesionales actúan de forma independiente y su mención en la plataforma no implica que el titular del sitio avale, garantice ni sea responsable de los servicios que estos presten. La relación contractual y profesional se establece directamente entre el usuario y el profesional elegido.`,
            color: true
          },
          {
            titulo: "5. Coach de inteligencia artificial",
            contenido: `mymetaboliq.com incorpora un asistente de inteligencia artificial para responder consultas sobre nutrición, ejercicio y bienestar metabólico. Este servicio:

- Está basado en modelos de lenguaje de Anthropic (Claude).
- Utiliza el perfil ICM del usuario para personalizar las respuestas.
- No tiene acceso a historial médico ni realiza diagnósticos.
- Puede cometer errores o generar información desactualizada.

El usuario debe contrastar cualquier recomendación con un profesional sanitario antes de aplicarla.`,
            color: false
          },
          {
            titulo: "6. Suscripción y pagos",
            contenido: `El acceso al test ICM es gratuito. El servicio de seguimiento mensual (historial de evolución, coach ilimitado y plan semanal personalizado) está sujeto a una suscripción de 19,90€/mes.

El usuario puede cancelar la suscripción en cualquier momento. No se realizan reembolsos por períodos ya facturados. Los precios pueden modificarse con previo aviso de 30 días.`,
            color: true
          },
          {
            titulo: "7. Protección de datos",
            contenido: `Los datos personales facilitados son tratados conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Consulta nuestra Política de Privacidad para información completa sobre el tratamiento de tus datos.`,
            color: false
          },
          {
            titulo: "8. Modificaciones y legislación aplicable",
            contenido: `El titular se reserva el derecho a modificar estos Términos y Condiciones. Los cambios serán comunicados con antelación razonable. El uso continuado del servicio implica la aceptación de los nuevos términos.

Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Barcelona.`,
            color: true
          },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color ? C.greenPale : C.white, borderRadius: 14, padding: "24px 28px", marginBottom: 16, border: `1px solid ${s.color ? "#C8E8B0" : C.light}` }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.green, marginBottom: 14 }}>{s.titulo}</h2>
            <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>{s.contenido}</p>
          </div>
        ))}

        <div style={{ background: C.orangePale, borderRadius: 14, padding: "20px 28px", border: "1px solid #F9CFA8", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#9A6040", margin: 0 }}>Última actualización: abril 2026 · <a href="mailto:tutestmetabolico@gmail.com" style={{ color: C.orange }}>tutestmetabolico@gmail.com</a></p>
        </div>
      </div>
      <footer style={{ background: C.green, padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[["Política de privacidad", "/privacidad"], ["Cookies", "/cookies"], ["Términos y condiciones", "/terminos"], ["Aviso legal", "/aviso-legal"]].map(([t, h]) => (
            <a key={t} href={h} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}