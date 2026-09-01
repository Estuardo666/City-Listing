# Cobertura React → API móvil → Swift

| Dominio | React existente | API móvil | Swift | Estado |
|---|---|---|---|---|
| Inicio | Consultas server-side y secciones Home | `/api/mobile/v1/home` | `Home` | CP3 |
| Explore | `/api/explore/search` + Mapbox | `/api/mobile/v1/explore` | `Explore` + MapKit | CP4 |
| Auth | NextAuth y signup | `/api/mobile/v1/auth/*` | `Auth` + Keychain | CP1 |
| Locales/eventos | páginas de detalle y consultas Prisma | `/api/mobile/v1/venues`, `/events` | `Venues`, `Events` | CP3–CP5 |
| Blog/ofertas/rutas | páginas públicas | `/api/mobile/v1/content/*` | módulos públicos | CP3 |
| Guardados | acciones favorites/collections | `/api/mobile/v1/me/*` | `Saved` | CP6 |
| Reseñas/mensajes/reservas | Server Actions/API existentes | endpoints REST versionados | módulos autenticados | CP7 |
| Creación básica | actions de eventos/locales/posts/routes | endpoints de mutación | `Creation` | CP8 |
