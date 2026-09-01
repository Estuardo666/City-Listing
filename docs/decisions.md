# Decisiones técnicas

## ADR-001 — Backend existente

`City-Listing` continúa siendo la fuente de verdad. La API móvil se añade como `/api/mobile/v1`; no se crea una copia funcional del backend.

## ADR-002 — Neon protegido

Las pruebas usan PostgreSQL efímero. Neon producción sólo se inspecciona en lectura durante desarrollo; las migraciones nuevas se generan y revisan antes de cualquier despliegue.

## ADR-003 — Contrato móvil

Swift consume DTOs OpenAPI versionados, no Server Actions ni modelos Prisma directamente.

## ADR-004 — MapKit

La experiencia nativa usa `MKMapView` dentro de `UIViewRepresentable` para conservar clustering, cámara, anotaciones y delegates completos.

## ADR-005 — Liquid Glass

Liquid Glass se reserva para navegación, toolbars, buscadores, filtros, sheets y controles funcionales. El contenido principal usa superficies sólidas para mantener jerarquía y legibilidad.

## ADR-006 — Auditoría de dependencias

`npm audit --omit=dev` mantiene un aviso moderado asociado a Next 15.5.25 y uno alto en el PostCSS fijado internamente por esa versión de Next. No se ejecuta `npm audit fix --force` porque saltaría a Next 16/React 19 y cambiaría el contrato de la aplicación existente. El gate CI bloquea vulnerabilidades críticas; el upgrade mayor queda planificado para CP9.
