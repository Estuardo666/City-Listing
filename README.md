# Vive Loja

Plataforma de eventos, locales y noticias para Loja, Ecuador.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **DB**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Maps**: Mapbox
- **Deploy**: Vercel / Railway

## MVP Features

- 📅 Eventos (listado + detalle + mapa)
- 🍽️ Locales (bares, restaurantes + categorías + mapa)
- 📰 Blog/Noticias
- 👤 Registro/Login usuarios
- ✅ Aprobación admin de publicaciones
- 🗺️ Mapa interactivo
- 🔍 Búsqueda y filtros

## SEO

- [Plan SEO de 90 días](docs/seo-plan-90-days.md): análisis de intención, arquitectura de keywords, cadencia editorial, KPI y checklist de publicación.
- [Análisis SEO de competidores](docs/seo-competitor-analysis.md): resultados observados, brechas de búsqueda y estrategia por tipo de competidor.
- `npm run content:seed:seo`: publica o actualiza los artículos SEO aprobados de la base editorial.

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
