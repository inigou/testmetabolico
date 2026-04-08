"use client";
const C = { bg: "#F7F4EE", green: "#5B9B3C", orange: "#E8621A", white: "#FFFFFF", dark: "#1A1A1A", mid: "#6B6B6B", light: "#E8E4DC", greenLight: "#EAF3DE", greenPale: "#EBF5E4", orangePale: "#FDF0E8" };
const font = "'Trebuchet MS', Verdana, sans-serif";

export default function Privacidad() {
  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: C.green, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: C.white, textDecoration: "none" }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></a>
        <a href="/" style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textDecoration: "none" }}>← Volver</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: C.green, borderRadius: 16, padding: "32px 28px", marginBottom: 24, color: C.white }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Protección de datos</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0 }}>Política de Privacidad</h1>
        </div>

        {[
          {
            titulo: "1. Responsable del tratamiento",
            contenido: `Titular: Iñigo Fábregas Unzurrunzaga
Domicilio: Carrer Raset 47B, 5º 1ª, Barcelona 08021
Email: tutestmetabolico@gmail.com
Sitio web: mymetaboliq.com`,
            color: false
          },
          {
            titulo: "2. Datos que recogemos y finalidad",
            contenido: `Recogemos los siguientes datos personales con las finalidades indicadas:

- Email: para enviar el informe de resultados del test ICM y, con tu consentimiento, recordatorios periódicos de seguimiento.
- Nombre: para personalizar el informe y las comunicaciones.
- Datos de hábitos de salud (actividad física, nutrición, descanso, etc.): para calcular tu Índice de Calidad Metabólica (ICM) y tu edad metabólica estimada. Estos datos tienen carácter orientativo y no constituyen diagnóstico médico.
- Datos de composición corporal (opcionales): para mejorar la precisión del cálculo del ICM cuando el usuario dispone de ellos.`,
            color: true
          },
          {
            titulo: "3. Base legal del tratamiento",
            contenido: `El tratamiento de tus datos se basa en:
- Tu consentimiento explícito al aceptar los Términos y Condiciones antes de enviar el test.
- La ejecución de la relación contractual para la prestación del servicio.
- El interés legítimo del titular para el mantenimiento y mejora del servicio.`,
            color: false
          },
          {
            titulo: "4. Conservación de los datos",
            contenido: `Conservamos tus datos mientras mantengas una relación activa con el servicio o hasta que solicites su supresión. Los datos de tests históricos se conservan para permitirte ver tu evolución mensual, que es la funcionalidad principal del servicio.`,
            color: true
          },
          {
            titulo: "5. Cesión de datos a terceros",
            contenido: `No cedemos tus datos personales a terceros con fines comerciales. Podemos compartir datos con:
- Proveedores tecnológicos necesarios para el funcionamiento del servicio (Supabase para almacenamiento, Brevo para envío de emails), todos ellos con las garantías adecuadas conforme al RGPD.
- Rocío Fábregas Unzurrunzaga (Nº colegiada CAT001384), nutricionista afiliada, únicamente si el usuario solicita expresamente una consulta profesional.`,
            color: false
          },
          {
            titulo: "6. Tus derechos",
            contenido: `Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos enviando un email a tutestmetabolico@gmail.com con el asunto "Protección de datos".

Si consideras que el tratamiento no es conforme al RGPD, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).`,
            color: true
          },
          {
            titulo: "7. Seguridad",
            contenido: `Aplicamos medidas técnicas y organizativas adecuadas para garantizar la seguridad de tus datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado. Los datos se almacenan en servidores con cifrado en tránsito (HTTPS) y en reposo.`,
            color: false
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