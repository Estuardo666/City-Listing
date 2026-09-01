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

El baseline de CP0 mantenía avisos de Next 15.5.25/PostCSS y evitaba `npm audit fix --force` porque podía cambiar el contrato de la aplicación. En CP9 se ejecutó una actualización explícita y revisada a Next `16.3.4`, con la migración requerida de `middleware` a `proxy` y el script Webpack fijado para conservar el pipeline existente. El toolchain de lint quedó alineado con `eslint-config-next@16.3.4` usando ESLint 9 y flat config; las reglas específicas del React Compiler se mantienen desactivadas hasta una migración intencional del código React 18. Los overrides fijan Browserslist y `postcss-selector-parser` en versiones parcheadas. El endpoint AASA se genera sólo cuando hosting aporta `APPLE_TEAM_ID` y responde 404 de forma segura en caso contrario. El gate local y de GitHub Actions confirma audit completo y `npm audit --omit=dev` sin vulnerabilidades, además de typecheck, integración móvil, OpenAPI y build verdes (push `33543411921`, PR `33543415488`). La rama candidata permanece en PR hasta revisión y validación del despliegue Vercel.
