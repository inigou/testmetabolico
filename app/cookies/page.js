"use client";
const C = { bg: "#F7F4EE", green: "#5B9B3C", orange: "#E8621A", white: "#FFFFFF", dark: "#1A1A1A", mid: "#6B6B6B", light: "#E8E4DC", greenLight: "#EAF3DE", greenPale: "#EBF5E4", orangePale: "#FDF0E8" };
const font = "'Trebuchet MS', Verdana, sans-serif";

export default function Cookies() {
  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: C.green, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: C.white, textDecoration: "none" }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></a>
        <a href="/" style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textDecoration: "none" }}>← Volver</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: C.orange, borderRadius: 16, padding: "32px 28px", marginBottom: 24, color: C.white }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Navegación y privacidad</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0 }}>Política de Cookies</h1>
        </div>

        {[
          {
            titulo: "1. ¿Qué son las cookies?",
            contenido: `Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y mejore tu experiencia de navegación.`,
            color: false
          },
          {
            titulo: "2. Cookies que utilizamos",
            contenido: `mymetaboliq.com utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento del servicio:

- Cookies de sesión: permiten mantener la sesión activa durante la navegación. Se eliminan al cerrar el navegador.
- Cookies de preferencias: guardan configuraciones básicas del usuario para mejorar la experiencia.

No utilizamos cookies de seguimiento, publicidad ni analítica de terceros.`,
            color: true
          },
          {
            titulo: "3. Cookies de terceros",
            contenido: `Algunos servicios integrados en mymetaboliq.com pueden instalar sus propias cookies:

- Vercel (proveedor de hosting): puede instalar cookies técnicas relacionadas con el rendimiento y disponibilidad del servicio.

Estas cookies están sujetas a las políticas de privacidad de sus respectivos proveedores.`,
            color: false
          },
          {
            titulo: "4. Cómo gestionar las cookies",
            contenido: `Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que deshabilitar cookies técnicas puede afectar al funcionamiento del servicio.

Instrucciones por navegador:
- Chrome: Configuración → Privacidad y seguridad → Cookies
- Safari: Preferencias → Privacidad
- Firefox: Opciones → Privacidad y seguridad
- Edge: Configuración → Privacidad, búsqueda y servicios`,
            color: true
          },
          {
            titulo: "5. Actualizaciones de esta política",
            contenido: `Podemos actualizar esta Política de Cookies para reflejar cambios en el servicio o en la legislación aplicable. Te recomendamos revisarla periódicamente. La fecha de última actualización aparece al pie de esta página.`,
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