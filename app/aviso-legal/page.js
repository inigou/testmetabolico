"use client";
const C = { bg: "#F7F4EE", green: "#5B9B3C", orange: "#E8621A", white: "#FFFFFF", dark: "#1A1A1A", mid: "#6B6B6B", light: "#E8E4DC", greenLight: "#EAF3DE", greenPale: "#EBF5E4", orangePale: "#FDF0E8" };
const font = "'Trebuchet MS', Verdana, sans-serif";

export default function AvisoLegal() {
  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: C.green, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: C.white, textDecoration: "none" }}>🌿 my<span style={{ color: C.greenLight }}>metaboliq</span></a>
        <a href="/" style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textDecoration: "none" }}>← Volver</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: C.orange, borderRadius: 16, padding: "32px 28px", marginBottom: 24, color: C.white }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Información legal</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0 }}>Aviso Legal</h1>
        </div>

        {[
          {
            titulo: "1. Datos identificativos del titular",
            contenido: `En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se informa:

Titular: Iñigo Fábregas Unzurrunzaga
Domicilio: Carrer Raset 47B, 5º 1ª, Barcelona 08021
Email de contacto: tutestmetabolico@gmail.com
Sitio web: mymetaboliq.com`
          },
          {
            titulo: "2. Objeto y ámbito de aplicación",
            contenido: `El presente Aviso Legal regula el acceso y uso del sitio web mymetaboliq.com, cuya titularidad corresponde a Iñigo Fábregas Unzurrunzaga.

El acceso al sitio web implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal, así como en la Política de Privacidad y la Política de Cookies.`
          },
          {
            titulo: "3. Propiedad intelectual e industrial",
            contenido: `Todos los contenidos del sitio web —incluyendo textos, imágenes, diseño gráfico, código fuente, logos, marcas, nombres comerciales y cualquier otro signo distintivo— son propiedad del titular o de terceros que han autorizado su uso, y están protegidos por las leyes de propiedad intelectual e industrial vigentes.

Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de dichos contenidos sin autorización expresa y por escrito del titular.`
          },
          {
            titulo: "4. Responsabilidad",
            contenido: `El titular no se hace responsable de los daños o perjuicios que pudieran derivarse del acceso o uso del sitio web, incluyendo los daños producidos en los sistemas informáticos o los introducidos por virus informáticos.

El titular se reserva el derecho a modificar, suspender, cancelar o restringir el contenido del sitio web, los vínculos o la información obtenida a través de él, sin necesidad de previo aviso.`
          },
          {
            titulo: "5. Legislación aplicable y jurisdicción",
            contenido: `Las relaciones entre el titular y los usuarios del sitio web se rigen por lo dispuesto en la normativa española vigente. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de la ciudad de Barcelona, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.`
          },
        ].map((s, i) => (
          <div key={i} style={{ background: i % 2 === 0 ? C.white : C.greenPale, borderRadius: 14, padding: "24px 28px", marginBottom: 16, border: `1px solid ${i % 2 === 0 ? C.light : "#C8E8B0"}` }}>
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