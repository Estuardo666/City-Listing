# Vive Loja

Plataforma de eventos, locales y noticias para Loja, Ecuador.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **DB**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Maps**: Mapbox
- **Deploy**: Google Cloud Run (producción) / Vercel (respaldo temporal)

## MVP Features

- 📅 Eventos (listado + detalle + mapa)
- 🍽️ Locales (bares, restaurantes + categorías + mapa)
- 📰 Blog/Noticias
- 👤 Registro/Login usuarios
- ✅ Aprobación admin de publicaciones
- 🗺️ Mapa interactivo
- 🧭 Rutas turísticas temáticas con paradas y mapa
- 🔍 Búsqueda y filtros

## SEO

- [Plan SEO de 90 días](docs/seo-plan-90-days.md): análisis de intención, arquitectura de keywords, cadencia editorial, KPI y checklist de publicación.
- [Análisis SEO de competidores](docs/seo-competitor-analysis.md): resultados observados, brechas de búsqueda y estrategia por tipo de competidor.
- `npm run content:seed:seo`: publica o actualiza los artículos SEO aprobados de la base editorial.

## Rutas y exploración

- `/explorar`: mapa y filtros para descubrir locales y eventos aprobados.
- `/rutas`: catálogo de rutas turísticas publicadas.
- `/rutas/[slug]`: detalle de una ruta, sus paradas y mapa.
- `/rutas/crear`: formulario para proponer una ruta.
- `npm run content:seed:coffee`: carga o actualiza la Ruta del Café y sus artículos editoriales en la base de datos configurada.

La guía de [despliegue en Google Cloud](docs/google-cloud-production-plan.md) describe el runtime de producción en Cloud Run, el dominio y el procedimiento de validación.

## Roles

- **Visitante**: Ver contenido público
- **Usuario**: Crear eventos/locales (pendientes de aprobación)
- **Admin**: Aprobar/rechazar publicaciones

## Roadmap (6 semanas)

1. Setup base (auth, Prisma, UI)
2. CRUD Eventos + aprobación
3. CRUD Locales + categorías + mapa
4. Blog/Noticias + SEO
5. Dashboards + métricas
6. Optimización + lanzamiento
