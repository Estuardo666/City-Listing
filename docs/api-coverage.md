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
| Deep links | `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` desde `lib/canonical-urls` | mismas rutas canónicas | `DeepLinkRouter` + `ShareableKind` | Fase 0 |
| Itinerarios | `/rutas`, `/rutas/[slug]` con pestañas por día y JSON-LD TouristTrip | `/api/mobile/v1/routes`, `/routes/{slug}` (paradas agrupadas por día) | `RouteDetailView` | Fase 2 |
| Reclamo de negocio | `api/claims/*`, `admin/reclamos`, `lib/claims/service` | `/me/claims`, `/me/claims/{id}/verify`, `/me/claims/{id}/evidence` | `OwnerClaimView` | Fase 3 |
| Respuestas del dueño | `replyToReviewAction` + dashboard | `PATCH /me/reviews/{id}/reply` | `OwnerReplyComposerView` | Fase 3 |
| Métricas de negocio | `dashboard/locales/[slug]/analytics` | `/me/venues/{slug}/insights` | `BusinessDashboardView` | Fase 3 |
| Popular ahora | `actions/views` escribe `ViewEvent` | `POST /views`, `GET /popular`, `home.popularNow` | carrusel en `HomeView` | Fase 4 |
| Colecciones públicas | `/colecciones/[slug]` + `opengraph-image` | `GET /collections/{slug}`, favoritos de colección | `PublicCollectionView` | Fase 5 |
| Notificaciones push | `manifest.ts` + `public/sw.js` + Web Push (VAPID) | `/api/mobile/v1/me/devices`, `/me/notification-preferences`, cron `/api/cron/notifications` | `PushService` (APNs) + `NotificationSettingsView` | Fase 1 |

## Notas de interconexión

- Las URL públicas de todo lo compartible se definen una sola vez en
  `src/lib/canonical-urls.ts` y se replican en `ShareableKind` (iOS). El archivo
  AASA se genera de esa misma lista, así que la app nunca reclama una ruta que
  el sitio no publique.
- Una notificación se entrega desde `src/lib/notifications/send.ts`
  (`notifyUser`), que aplica las preferencias del usuario y despacha a APNs y a
  Web Push con el mismo título, cuerpo y deep link. Tocar una notificación en
  iOS o en la PWA lleva a la misma página.
- `NotificationPreference` es una sola fila editada por el dashboard web y por
  la pantalla de Cuenta en iOS.
- Un reclamo de negocio se procesa en `src/lib/claims/service.ts`, invocado tanto
  por la Server Action web como por la API móvil, así que el código de
  verificación, su caducidad y el presupuesto de intentos son idénticos en
  ambas superficies.
- Las vistas se registran en `src/lib/views.ts` desde la web y desde la app, con
  deduplicación de 30 minutos, y alimentan un único ranking de "Popular ahora".
