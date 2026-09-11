import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
export const metadata: Metadata = { title: 'Política de cookies — Vive Loja', alternates: { canonical: 'https://viveloja.com/cookies' } }
export default function CookiesPage() { return <LegalPage eyebrow="Tecnologías locales" title="Política de cookies" summary="Detalla las tecnologías que mantienen tu sesión, preferencias y seguridad en Vive Loja.">
  <section><h2>Qué utilizamos</h2><p>Usamos cookies y almacenamiento local estrictamente necesarios para iniciar sesión, proteger formularios, recordar tema o preferencias y mantener funciones esenciales.</p></section>
  <section><h2>Medición y terceros</h2><p>Podemos utilizar medición de rendimiento y servicios técnicos como mapas, alojamiento o protección contra abuso. Estos proveedores pueden procesar identificadores técnicos conforme a sus propias políticas y a nuestros acuerdos.</p></section>
  <section><h2>Tus opciones</h2><p>Puedes bloquear o eliminar cookies desde el navegador. Las cookies esenciales no pueden desactivarse desde la plataforma porque sin ellas la autenticación y otras funciones seguras podrían dejar de operar.</p></section>
</LegalPage> }
