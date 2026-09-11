import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
export const metadata: Metadata = { title: 'Normas de comunidad — Vive Loja', alternates: { canonical: 'https://viveloja.com/normas-comunidad' } }
export default function CommunityPage() { return <LegalPage eyebrow="Convivencia local" title="Normas de comunidad" summary="Queremos información útil, experiencias auténticas y relaciones respetuosas entre vecinos, visitantes y negocios.">
  <section><h2>Publica experiencias reales</h2><p>Comparte contenido basado en experiencias legítimas. No publiques reseñas compradas, coordinadas, engañosas ni creadas para perjudicar o beneficiar artificialmente a un negocio.</p></section>
  <section><h2>Respeta a las personas</h2><p>No permitimos amenazas, acoso, discriminación, explotación, contenido sexual no consentido ni divulgación de datos personales ajenos.</p></section>
  <section><h2>Respeta la propiedad y la identidad</h2><p>No suplantes personas o negocios, no reclames locales sin autorización y no publiques material que infrinja derechos de autor, marcas u otros derechos.</p></section>
  <section><h2>Contenido comercial</h2><p>Las promociones deben ser claras, verificables y respetar sus condiciones. La publicidad pagada se identifica como patrocinada y no altera las opiniones de la comunidad.</p></section>
  <section><h2>Aplicación</h2><p>Podemos reducir alcance, retirar contenido, solicitar evidencia, suspender funciones o cerrar cuentas según gravedad, reiteración y riesgo. Puedes reportar problemas mediante contacto.</p></section>
</LegalPage> }
