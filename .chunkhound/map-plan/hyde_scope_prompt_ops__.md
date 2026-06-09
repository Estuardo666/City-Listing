You are generating a hypothetical, best-effort research plan for a software project.

Workspace commit context (if available):
- created_from_sha: cf82e122eca44e1790dd80c199b7b73484c76c99

In-scope project (relative to the workspace root):
- /

Within this scope, the following files and directories currently exist (sampled and capped):
- check-categories.ts
- create-additional-categories.ts
- create-business-categories.ts
- create-restaurant-categories.ts
- dev-log.txt
- import-additional-businesses.ts
- import-businesses.ts
- import-hotels-script.ts
- import-restaurants.ts
- next-env.d.ts
- next.config.mjs
- package.json
- postcss.config.js
- README.md
- SETUP.md
- tailwind.config.ts
- tsconfig.json
- update-category-icons.ts
- .github/skills/1/SKILL.md
- .github/skills/advanced-map-performance-optimization/SKILL.md
- .github/skills/advanced-s3-storage-architecture/SKILL.md
- .github/skills/modern-macos-ui-design-rule/SKILL.md
- .github/skills/production-backend-architect/SKILL.md
- .github/skills/web-performance-optimization/SKILL.md
- .opencode/plans/osm-import-module.md
- .opencode/plans/structured-modules-plan.md
- .opencode/plans/transactional-emails-plan.md
- docs/google-places-import.md
- prisma/check-categories.ts
- prisma/cleanup-old-categories.ts
- prisma/migrate-categories-v2.ts
- prisma/seed-categories-v2.ts
- prisma/seed-google-place-types.ts
- prisma/seed.ts
- prisma/migrations/add_search_indexes.sql
- public/mapbox-gl-csp-worker.js
- public/robots.txt
- scripts/check-user.ts
- scripts/clear-users.ts
- scripts/set-password.ts
- scripts/sync-google-hours.ts
- src/middleware.ts
- src/actions/business-hours/manage-hours.ts
- src/actions/categories/update-category.ts
- src/actions/checkins/create-checkin.ts
- src/actions/checkins/index.ts
- src/actions/collections/index.ts
- src/actions/collections/manage-collections.ts
- src/actions/comments/create-comment.ts
- src/actions/comments/index.ts
- src/actions/events/bulk-delete-events.ts
- src/actions/events/create-event.ts
- src/actions/events/delete-event.ts
- src/actions/events/get-events.ts
- src/actions/events/get-upcoming-event-notifications.ts
- src/actions/events/index.ts
- src/actions/events/update-event-status.ts
- src/actions/events/update-event.ts
- src/actions/favorites/index.ts
- src/actions/favorites/toggle-favorite.ts
- src/actions/gamification/award-points.ts
- src/actions/gamification/check-badges.ts
- src/actions/gamification/index.ts
- src/actions/media/index.ts
- src/actions/media/manage-media.ts
- src/actions/media/upload-media.ts
- src/actions/menu/index.ts
- src/actions/menu/manage-menu.ts
- src/actions/messaging/blocked-users.ts
- src/actions/messaging/messages.ts
- src/actions/messaging/quick-replies.ts
- src/actions/newsletter/index.ts
- src/actions/newsletter/subscribe.ts
- src/actions/notifications/get-notification-preferences.ts
- src/actions/notifications/index.ts
- src/actions/notifications/pull-comment-notifications.ts
- src/actions/notifications/pull-upcoming-event-notifications.ts
- src/actions/notifications/update-notification-preferences.ts
- src/actions/operating-hours/index.ts
- src/actions/operating-hours/upsert-operating-hours.ts
- src/actions/osm-imports/index.ts
- src/actions/posts/create-post.ts
- src/actions/posts/delete-post.ts
- src/actions/posts/increment-view.ts
- src/actions/posts/index.ts
- src/actions/posts/update-post-status.ts
- src/actions/posts/update-post.ts
- src/actions/promotions/create-promotion.ts
- src/actions/promotions/index.ts
- src/actions/push/index.ts
- src/actions/push/subscribe-push.ts
- src/actions/questions/create-question.ts
- src/actions/questions/index.ts
- src/actions/recurrence/index.ts
- src/actions/recurrence/upsert-recurrence.ts
- src/actions/reservations/create-reservation.ts
- src/actions/reservations/index.ts
- src/actions/reviews/create-review.ts
- src/actions/reviews/index.ts
- src/actions/reviews/reply-review.ts
- src/actions/reviews/update-review-status.ts
- src/actions/routes/create-route.ts
- src/actions/routes/index.ts
- src/actions/search-console/sync-snapshots.ts
- src/actions/services/manage-services.ts
- src/actions/special-hours/index.ts
- src/actions/special-hours/upsert-special-hours.ts
- src/actions/user/admin-update-user.ts
- src/actions/user/update-profile.ts
- src/actions/venue-claims/create-claim.ts
- src/actions/venue-claims/index.ts
- src/actions/venue-claims/update-claim.ts
- src/actions/venues/branches.ts
- src/actions/venues/bulk-delete-venues.ts
- src/actions/venues/bulk-toggle-active.ts
- src/actions/venues/bulk-update-venue-status.ts
- src/actions/venues/create-venue-complete.ts
- src/actions/venues/create-venue.ts
- src/actions/venues/delete-venue.ts
- src/actions/venues/index.ts
- src/actions/venues/toggle-venue-active.ts
- src/actions/venues/update-venue-status.ts
- src/actions/venues/update-venue.ts
- src/actions/views/increment-view.ts
- src/actions/views/index.ts
- src/app/globals.css
- src/app/layout.tsx
- src/app/not-found.tsx
- src/app/page.tsx
- src/app/sitemap.ts
- src/app/about/page.tsx
- src/app/admin/layout.tsx
- src/app/admin/page.tsx
- src/app/admin/blog/page.tsx
- src/app/admin/blog/[id]/editar/page.tsx
- src/app/admin/categorias/category-edit-form.tsx
- src/app/admin/categorias/page.tsx
- src/app/admin/eventos/page.tsx
- src/app/admin/eventos/[id]/editar/page.tsx
- src/app/admin/google-types/google-types-manager.tsx
- src/app/admin/google-types/page.tsx
- src/app/admin/import/page.tsx
- src/app/admin/imports/google/page.tsx
- src/app/admin/imports/google/drafts/page.tsx
- src/app/admin/imports/google/jobs/jobs-list.tsx
- src/app/admin/imports/google/jobs/page.tsx
- src/app/admin/imports/google/jobs/[id]/page.tsx
- src/app/admin/imports/google/slow/page.tsx
- src/app/admin/imports/google/sync/page.tsx
- src/app/admin/locales/page.tsx
- src/app/admin/locales/[id]/editar/page.tsx
- src/app/admin/ofertas/offer-actions.tsx
- src/app/admin/ofertas/page.tsx
- src/app/admin/osm-imports/osm-tabs.tsx
- src/app/admin/osm-imports/page.tsx
- src/app/admin/osm-imports/cola/page.tsx
- src/app/admin/osm-imports/configuracion/page.tsx
- src/app/admin/osm-imports/historial/page.tsx
- src/app/admin/osm-imports/nueva-importacion/page.tsx
- src/app/admin/reclamos/claim-actions.tsx
- src/app/admin/reclamos/page.tsx
- src/app/admin/resenas/page.tsx
- src/app/admin/search-console/page.tsx
- src/app/admin/usuarios/page.tsx
- src/app/admin/usuarios/[id]/editar/page.tsx
- src/app/api/admin/google-types/route.ts
- src/app/api/admin/imports/google/drafts/route.ts
- src/app/api/admin/imports/google/geocode/route.ts
- src/app/api/admin/imports/google/import/route.ts
- src/app/api/admin/imports/google/jobs/route.ts
- src/app/api/admin/imports/google/jobs/[id]/route.ts
- src/app/api/admin/imports/google/quality/route.ts
- src/app/api/admin/imports/google/search/route.ts
- src/app/api/admin/imports/google/slow/jobs/route.ts
- src/app/api/admin/imports/google/slow/jobs/[id]/route.ts
- src/app/api/admin/imports/google/sync/route.ts
- src/app/api/admin/osm-import/bulk-import/route.ts
- src/app/api/admin/osm-import/config/route.ts
- src/app/api/admin/osm-import/history/route.ts
- src/app/api/admin/osm-import/import/route.ts
- src/app/api/admin/osm-import/search/route.ts
- src/app/api/admin/osm-import/stats/route.ts
- src/app/api/admin/osm-import/sync/route.ts
- src/app/api/admin/search-console/callback/route.ts
- src/app/api/admin/search-console/setup/route.ts
- src/app/api/admin/search-console/sync/route.ts
- src/app/api/admin/sync-search/route.ts
- src/app/api/admin/test-search/route.ts
- src/app/api/auth/signup/route.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/claims/submit/route.ts
- src/app/api/claims/verify/route.ts
- src/app/api/claims/[id]/upload/route.ts
- src/app/api/dashboard/events/route.ts
- src/app/api/dashboard/posts/route.ts
- src/app/api/dashboard/tags/route.ts
- src/app/api/dashboard/venues/route.ts
- src/app/api/debug/auth-test/route.ts
- src/app/api/debug/cache/route.ts
- src/app/api/events/search/route.ts
- src/app/api/explore/search/route.ts
- src/app/api/messages/conversations/route.ts
- src/app/api/messages/conversations/[id]/route.ts
- src/app/api/notifications/preferences/route.ts
- src/app/api/notifications/stream/route.ts
- src/app/api/notifications/upcoming/route.ts
- src/app/api/search/global/route.ts
- src/app/api/uploads/media/route.ts
- src/app/api/venues/search/route.ts
- src/app/api/venues/[slug]/conversations/route.ts
- src/app/auth/signin/page.tsx
- src/app/auth/signup/page.tsx
- src/app/blog/page.tsx
- src/app/blog/crear/page.tsx
- src/app/blog/[slug]/page.tsx
- src/app/colecciones/page.tsx
- src/app/colecciones/[slug]/page.tsx
- src/app/contact/page.tsx
- src/app/dashboard/error.tsx
- src/app/dashboard/layout.tsx
- src/app/dashboard/loading.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/analytics/page.tsx
- src/app/dashboard/blog/page.tsx
- src/app/dashboard/blog/crear/page.tsx
- src/app/dashboard/blog/[id]/editar/page.tsx
- src/app/dashboard/colecciones/collection-create-form.tsx
- src/app/dashboard/colecciones/delete-collection-button.tsx
- src/app/dashboard/colecciones/page.tsx
- src/app/dashboard/colecciones/[id]/collection-edit-form.tsx
- src/app/dashboard/colecciones/[id]/page.tsx
- src/app/dashboard/colecciones/[id]/remove-item-button.tsx
- src/app/dashboard/colecciones/[id]/reorder-buttons.tsx
- src/app/dashboard/configuracion/page.tsx
- src/app/dashboard/eventos/page.tsx
- src/app/dashboard/eventos/crear/page.tsx
- src/app/dashboard/eventos/[slug]/editar/page.tsx
- src/app/dashboard/favoritos/page.tsx
- src/app/dashboard/locales/page.tsx
- src/app/dashboard/locales/crear/page.tsx
- src/app/dashboard/locales/[slug]/analytics/page.tsx
- src/app/dashboard/locales/[slug]/editar/page.tsx
- src/app/dashboard/locales/[slug]/horarios/page.tsx
- src/app/dashboard/locales/[slug]/medios/page.tsx
- src/app/dashboard/locales/[slug]/mensajes/page.tsx
- src/app/dashboard/locales/[slug]/menu/page.tsx
- src/app/dashboard/locales/[slug]/qr-kit/page.tsx
- src/app/dashboard/locales/[slug]/servicios/page.tsx
- src/app/dashboard/locales/[slug]/sucursales/page.tsx
- src/app/dashboard/mensajes/page.tsx
- src/app/dashboard/notificaciones/page.tsx
- src/app/dashboard/reservas/page.tsx
- src/app/eventos/error.tsx
- src/app/eventos/page.tsx
- src/app/eventos/crear/page.tsx
- src/app/eventos/[slug]/page.tsx
- src/app/eventos/[slug]/editar/page.tsx
- src/app/explorar/error.tsx
- src/app/explorar/page.tsx
- src/app/locales/error.tsx
- src/app/locales/page.tsx
- src/app/locales/crear/page.tsx
- src/app/locales/[slug]/page.tsx
- src/app/locales/[slug]/editar/page.tsx
- src/app/mejores/[categorySlug]/page.tsx
- src/app/ofertas/page.tsx
- src/app/perfil/[id]/page.tsx
- src/app/privacy/page.tsx
- src/app/rutas/page.tsx
- src/app/rutas/crear/page.tsx
- src/app/rutas/[slug]/page.tsx
- src/app/sitemaps/blog/route.ts
- src/app/sitemaps/categorias/route.ts
- src/app/sitemaps/colecciones/route.ts
- src/app/sitemaps/eventos/route.ts
- src/app/sitemaps/locales/route.ts
- src/app/sitemaps/static/route.ts
- src/app/[categorySlug]/page.tsx
- src/components/json-ld.tsx
- src/components/auth/auth-provider.tsx
- src/components/auth/user-menu.tsx
- src/components/branches/branch-manager.tsx
- src/components/business-hours/business-hours-display.tsx
- src/components/business-hours/business-hours-editor.tsx
- src/components/checkin/checkin-button.tsx
- src/components/collections/add-to-collection-button.tsx
- src/components/debug/mapbox-token-test.tsx
- src/components/event/event-calendar.tsx
- src/components/event/recurrence-form.tsx
- src/components/features/admin/admin-user-edit-form.tsx
- src/components/features/admin/admin-users-list.tsx
- src/components/features/admin/google-import/bulk-import-confirm.tsx
- src/components/features/admin/google-import/draft-manager.tsx
- src/components/features/admin/google-import/google-import-form.tsx
- src/components/features/admin/google-import/google-import-preview.tsx
- src/components/features/admin/google-import/google-import-results.tsx
- src/components/features/admin/google-import/google-import-tabs.tsx
- src/components/features/admin/google-import/google-places-import.tsx
- src/components/features/admin/google-import/job-progress.tsx
- src/components/features/admin/google-import/log-feed.tsx
- src/components/features/admin/google-import/map-preview.tsx
- src/components/features/admin/google-import/slow-import-wizard.tsx
- src/components/features/admin/google-import/slow-job-progress.tsx
- src/components/features/admin/google-import/sync-dashboard.tsx
- src/components/features/admin/google-import/wizard-address.tsx
- src/components/features/admin/google-import/wizard-categories.tsx
- src/components/features/admin/google-import/wizard-radius.tsx
- src/components/features/admin/google-import/wizard-results.tsx
- src/components/features/admin/osm/osm-config-form.tsx
- src/components/features/admin/osm/osm-history-table.tsx
- src/components/features/admin/osm/osm-import-form.tsx
- src/components/features/admin/osm/osm-imports-dashboard.tsx
- src/components/features/admin/osm/osm-preview-table.tsx
- src/components/features/admin/osm/osm-queue-table.tsx
- src/components/features/admin/search-console/actions-tab.tsx
- src/components/features/admin/search-console/content-ideas-tab.tsx
- src/components/features/admin/search-console/keyword-gaps-tab.tsx
- src/components/features/admin/search-console/opportunities-tab.tsx
- src/components/features/admin/search-console/search-console-charts.tsx
- src/components/features/admin/search-console/search-console-dashboard.tsx
- src/components/features/admin/search-console/search-console-tabs.tsx
- src/components/features/admin/search-console/top-blog-pages-tab.tsx
- src/components/features/admin/search-console/top-business-pages-tab.tsx
- src/components/features/admin/search-console/top-event-pages-tab.tsx
- src/components/features/admin/search-console/top-local-queries-tab.tsx
- src/components/features/admin/search-console/top-pages-table.tsx
- src/components/features/admin/search-console/top-queries-table.tsx
- src/components/features/blog/admin-blog-moderation.tsx
- src/components/features/blog/blog-card.tsx
- src/components/features/blog/blog-detail.tsx
- src/components/features/blog/blog-form.tsx
- src/components/features/blog/index.ts
- src/components/features/blog/popular-badge.tsx
- src/components/features/blog/post-edit-form.tsx
- src/components/features/blog/tag-input.tsx
- src/components/features/blog/trending-section.tsx
- src/components/features/blog/user-posts-list.tsx
- src/components/features/comments/comment-section.tsx
- src/components/features/dashboard/analytics-charts.tsx
- src/components/features/dashboard/analytics-dashboard.tsx
- src/components/features/dashboard/engagement-stats.tsx
- src/components/features/dashboard/gamification-widget.tsx
- src/components/features/dashboard/user-events-list.tsx
- src/components/features/dashboard/user-venues-list.tsx
- src/components/features/events/admin-event-moderation.tsx
- src/components/features/events/event-card.tsx
- src/components/features/events/event-content.tsx
- src/components/features/events/event-detail.tsx
- src/components/features/events/event-edit-form.tsx
- src/components/features/events/event-empty-state.tsx
- src/components/features/events/event-filters-client.tsx
- src/components/features/events/event-filters.tsx
- src/components/features/events/event-form.tsx
- src/components/features/events/event-grid-animated.tsx
- src/components/features/events/event-grid.tsx
- src/components/features/events/event-related.tsx
- src/components/features/events/event-share-button.tsx
- src/components/features/events/event-wizard.tsx
- src/components/features/events/events-map.tsx
- src/components/features/events/events-venues-map.tsx
- src/components/features/events/index.ts
- src/components/features/events/upcoming-event-notifications.tsx
- src/components/features/explore/category-searcher.tsx
- src/components/features/explore/explore-card.tsx
- src/components/features/explore/explore-client.tsx
- src/components/features/explore/explore-filter-drawer.tsx
- src/components/features/explore/explore-filters.tsx
- src/components/features/explore/explore-map-panel.tsx
- src/components/features/favorites/favorite-button.tsx
- src/components/features/home/home-blog-section.tsx
- src/components/features/home/home-blog-skeleton.tsx
- src/components/features/home/home-categories-grid-section.tsx
- src/components/features/home/home-categories-grid-skeleton.tsx
- src/components/features/home/home-categories-grid.tsx
- src/components/features/home/home-featured-events-section.tsx
- src/components/features/home/home-featured-events-skeleton.tsx
- src/components/features/home/home-featured-events.tsx
- src/components/features/home/home-featured-venues-section.tsx
- src/components/features/home/home-featured-venues-skeleton.tsx
- src/components/features/home/home-featured-venues.tsx
- src/components/features/home/home-hero-map-section.tsx
- src/components/features/home/home-hero-map-skeleton.tsx
- src/components/features/home/home-hero-map.tsx
- src/components/features/home/home-latest-venues-section.tsx
- src/components/features/home/home-latest-venues-skeleton.tsx
- src/components/features/home/home-latest-venues.tsx
- src/components/features/home/home-promo-grid-section.tsx
- src/components/features/home/home-promo-grid-skeleton.tsx
- src/components/features/home/home-promo-grid.tsx
- src/components/features/home/home-related-events-section.tsx
- src/components/features/home/home-related-events-skeleton.tsx
- src/components/features/home/home-related-events.tsx
- src/components/features/listing/listing-cta.tsx
- src/components/features/listing/listing-section.tsx
- src/components/features/listing/near-you-section.tsx
- src/components/features/map/location-picker-map.tsx
- src/components/features/map/mapbox-worker-setup.tsx
- src/components/features/media/media-url-input-simple.tsx
- src/components/features/media/media-url-input.tsx
- src/components/features/notifications/notification-center.tsx
- src/components/features/notifications/notification-preferences-form.tsx
- src/components/features/qr/door-sticker-template.tsx
- src/components/features/qr/qr-kit-generator.tsx
- src/components/features/rankings/ranking-card.tsx
- src/components/features/rankings/ranking-list.tsx
- src/components/features/rankings/venue-badge.tsx
- src/components/features/reviews/admin-review-moderation.tsx
- src/components/features/reviews/index.ts
- src/components/features/search/command-palette.tsx
- src/components/features/search/search-chips.tsx
- src/components/features/settings/profile-form.tsx
- src/components/features/venues/admin-venue-moderation.tsx
- src/components/features/venues/amenities-section.tsx
- src/components/features/venues/index.ts
- src/components/features/venues/location-hours-section.tsx
- src/components/features/venues/products-display.tsx
- src/components/features/venues/venue-card.tsx
- src/components/features/venues/venue-content.tsx
- src/components/features/venues/venue-detail.tsx
- src/components/features/venues/venue-edit-form.tsx
- src/components/features/venues/venue-empty-state.tsx
- src/components/features/venues/venue-filters-client.tsx
- src/components/features/venues/venue-filters.tsx
- src/components/features/venues/venue-form-text-sections.tsx
- src/components/features/venues/venue-form.tsx
- src/components/features/venues/venue-grid-animated.tsx
- src/components/features/venues/venue-grid.tsx
- src/components/features/venues/venue-share-button.tsx
- src/components/features/venues/venue-wizard.tsx
- src/components/features/venues/venues-map.tsx
- src/components/layout/app-sidebar.tsx
- src/components/layout/index.ts
- src/components/layout/page-transition.tsx
- src/components/layout/site-footer.tsx
- src/components/layout/site-header.tsx
- src/components/media/media-gallery.tsx
- src/components/media/media-manager.tsx
- src/components/media/media-uploader.tsx
- src/components/menu/menu-display-v2.tsx
- src/components/menu/menu-display.tsx
- src/components/menu/menu-manager-v2.tsx
- src/components/menu/menu-manager.tsx
- src/components/messaging/inbox.tsx
- src/components/messaging/message-thread.tsx
- src/components/messaging/message-venue-button.tsx
- src/components/newsletter/newsletter-form.tsx
- src/components/operating-hours/operating-hours-display.tsx
- src/components/operating-hours/operating-hours-form.tsx
- src/components/operating-hours/special-hours-manager.tsx
- src/components/promotion/promotion-card.tsx
- src/components/promotion/promotion-form.tsx
- src/components/providers/lazy-globals.tsx
- src/components/providers/query-provider.tsx
- src/components/providers/service-worker-register.tsx
- src/components/qa/question-section.tsx
- src/components/reservation/reservation-form.tsx
- src/components/reservation/reservation-settings-form.tsx
- src/components/review/owner-reply.tsx
- src/components/review/review-form.tsx
- src/components/review/review-list.tsx
- src/components/review/star-rating.tsx
- src/components/route/route-card.tsx
- src/components/route/route-detail.tsx
- src/components/route/route-form.tsx
- src/components/services/services-display.tsx
- src/components/services/services-editor.tsx
- src/components/share/share-button.tsx
- src/components/theme/theme-toggle.tsx
- src/components/theme/use-map-theme-style.ts
- src/components/ui/alert-dialog.tsx
- src/components/ui/alert.tsx
- src/components/ui/avatar.tsx
- src/components/ui/badge.tsx
- src/components/ui/button.tsx
- src/components/ui/calendar.tsx
- src/components/ui/card.tsx
- src/components/ui/category-gradient-bg.tsx
- src/components/ui/category-icon-fallback.tsx
- src/components/ui/checkbox.tsx
- src/components/ui/dialog.tsx
- src/components/ui/dropdown-menu.tsx
- src/components/ui/form.tsx
- src/components/ui/getting-there-section.tsx
- src/components/ui/image-upload.tsx
- src/components/ui/input.tsx
- src/components/ui/label.tsx
- src/components/ui/motion.tsx
- src/components/ui/popover.tsx
- src/components/ui/progress.tsx
- src/components/ui/scroll-lock-fix.tsx
- src/components/ui/select.tsx
- src/components/ui/separator.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/sonner.tsx
- src/components/ui/switch.tsx
- src/components/ui/textarea.tsx
- src/components/ui/time-picker.tsx
- src/components/ui/transport-button.tsx
- src/components/ui/uber-icon.tsx
- src/components/user/user-level-badge.tsx

Sample code snippets from files (might be a subset, not full content, try to fill in gaps):
File: check-categories.ts
```typescript
i
...
{
...


```

File: create-additional-categories.ts
```typescript
import { Pris
...
e: 'Centros E
...
Categories()

```

File: create-business-categories.ts
```typescript
import { PrismaClient } fro
...
    description: 'Empresas 
...

  }
}

createCategories()

```

File: create-restaurant-categories.ts
```typescript
import { Prism
...
or: '#0891B2',
...
eCategories()

```

File: dev-log.txt
```text
﻿n
...
  
...
.

```

File: import-additional-businesses.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs de las categorías existentes y nuevas
const categoryI
...

    status: 'APPROVED' as const,
    featured: false,
    categoryId: categoryIds.finanzas,
    userId: 'cmlys6wkp00012wj6vicazyzh',
    goog
...

    console.error('❌ Error durante la importación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importAdditionalBusinesses()

```

File: import-businesses.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs de las categorías creadas
const categoryIds = {
...
 de Agosto y Bernardo Valdivieso',
    lat: -3.9968,
    lng: -79.2045,
    address: '10 de Agosto y Bernardo Valdivieso, Loja',
    sta
...
r) {
    console.error('❌ Error durante la importación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importBusinesses()

```

File: import-hotels-script.ts
```typescript
import { PrismaClient } from
...
 },
  {
    name: 'Hostal Lo
...
ect()
  }
}

importHotels()

```

File: import-restaurants.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs de las c
...
os tradicionales',
    phone: '07-257-4455',
    email: null,
    website: 'https://tuttofredo.co
...
la importación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importRestaurants()

```

File: next-env.d.ts
```typescript
/
...
>
...


```

File: next.config.mjs
```javascript
/** @ty
...
     {

...
Config

```

File: package.json
```json
{
  "name":
...
tack/react-
...
"^5"
  }
}

```

File: postcss.config.js
```javascript
w
```

File: README.md
```markdown
# Vi
...
👤 Re
...
nto

```

File: SETUP.md
```markdown
# Setup 
...
a
```

>
...
pes
```

```

File: tailwind.config.ts
```typescript
import ty
...
{
       
...
t config

```

File: tsconfig.json
```json
{
 
...
ser
...

}

```

File: update-category-icons.ts
```typescript
import 
...
 'Comid
...
cons()

```

File: .github/skills/1/SKILL.md
```markdown
---
name: 1
...

5. Never t
...
entations.

```

File: .github/skills/advanced-map-performance-optimization/SKILL.md
```markdown
---
name: advan
...
from map state.
...
range devices.

```

File: .github/skills/advanced-s3-storage-architecture/SKILL.md
```markdown
---
name: advance
...
lived signed GET 
...
 usage attempts.

```

File: .github/skills/modern-macos-ui-design-rule/SKILL.md
```markdown
---
name:
...
ebrow)
  
...
ering in

```

File: .github/skills/production-backend-architect/SKILL.md
```markdown
---
name: produ
...
paths:
    - /u
...
 actors exist.

```

File: .github/skills/web-performance-optimization/SKILL.md
```markdown
---
name: web
...
 Avoid waterf
...
nge devices.

```

File: .opencode/plans/osm-import-module.md
```markdown
# Plan: Modulo de Importaciones OSM

## Contexto

El proyecto 
...
' | 'skipped' }`

### 4.3 `POST /api/admin/osm-import/bulk-imp
...
kbox, Badge, Label, Separator, Alert de `src/components/ui/`.

```

File: .opencode/plans/structured-modules-plan.md
```markdown
# Plan de Implementación: Horarios, Servicios y Menú Estructurados

## Resumen Ejecutivo

Transforma
...
─┘
```

### 2.4 Frontend - Visualización Pública

**Componente**: `src/components/services/services-
...
 sistemas de delivery
- Análisis de productos más vistos
- Horarios especiales por fecha (feriados)

```

File: .opencode/plans/transactional-emails-plan.md
```markdown
# Plan de Implementación: Emails Transaccionales con
...
ubject: string
  html: string
  text?: string
}

exp
...
plementar retry con backoff exponencial para fallos

```

File: docs/google-places-import.md
```markdown
# Guía: Integración con Googl
...

- **Place Details**: $17 por
...
opers.google.com/maps/terms)

```

File: prisma/check-categories.ts
```typescript
import
...
_count
...
ct())

```

File: prisma/cleanup-old-categories.ts
```typescript
import 
...
blog
  
...
ect())

```

File: prisma/migrate-categories-v2.ts
```typescript
import { PrismaClient }
...
],
      "confidence" I
...
 prisma.$disconnect())

```

File: prisma/seed-categories-v2.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type CategorySeed =
...
' },
      { name: 'Telecomunicaciones', slug: 'telecomunicaciones', icon: '📱' },
      { name: 'Indu
...
subcategories`)
}

seedCategoriesV2()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

```

File: prisma/seed-google-place-types.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient(
...
bcategorySlugs: ['karaoke'] },
  { googleType: 'live_music_venue', categorySlug
...
glePlaceTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

```

File: prisma/seed.ts
```typescript
﻿import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const IMG = {
  concert:    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  concert2:   'https
...
iption: 'La feria mas importante para emprendedores del sur del Ecuador.', content: 'Mas de 60 stands de emprendimientos locales. Ruedas de negocios, charlas magistrales y concurso de pitch con premios de h
...
ole.log(`${posts.length} posts seeded`)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

```

File: prisma/migrations/add_search_indexes.sql
```sql
-- Ad
...
ops);
...
rgm;

```

File: public/mapbox-gl-csp-worker.js
```javascript
!function(){var t=1e-6,e="undefined"!=typeof Float32Array?Float32Array:Array;function r(t,e){var r=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],l=e[6],u=e[7],c=e[8];return t[0]=o*c-a*u,t[1]=i*u-n*c,t[2]=n*a-i*o,t[3]=a*l-s*c,t[4]=r*c-i*l,t[5]=i*s-r*a,t[6]=s*u-o*l,t[7]=n*l-r*u,t[8]=r*o-n*s,t}function n(t,e,r){var n=e[0],i=e[1],s=e[2],o=e[3],a=e[4],l=e[5],u=e[6],c=e[7],h=e[8],p=r[0],d=r[1],f=r[2],y=r[3],m=r[4],g=r[5],x=r[6],v=r[7],b=r[8];return t[0]=p*n+d*o+f*u,t[1]=p*i+d*a+f*c,t[2]=p*s+d*l+f*h,t[3]=y*n+m*o+g*u,t[4]=y*i+m*a+g*c,t[5]=y*s+m*l+g*h,t[6]=x*n+v*o+b*u,t[7]=x*i+v*a+b*c,t[8]=x*s+v*l+b*h,t}function i(){var t=new e(16);return e!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function s(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function o(t,e){var r=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],l=e[6],u=e[7],c=e[8],h=e[9],p=e[10],d=e[11],f=e[12],y=e[13],m=e[14],g=e[15],x=r*a-n*o,v=r*l-i*o,b=r*u-s*o,w=n*l-i*a,_=n*u-s*a,A=i*u-s*l,I=c*y-h*f,P=c*m-p*f,M=c*g-d*f,D=h*m-p*y,B=h*g-d*y,T=p*g-d*m,E=x*T-v*B+b*D+w*M-_*P+A*I;return E?(t[0]=(a*T-l*B+u*D)*(E=1/E),t[1]=(i*B-n*T-s*D)*E,t[2]=(y*A-m*_+g*w)*E,t[3]=(p*_-h*A-d*w)*E,t[4]=(l*M-o*T-u*P)*E,t[5]=(r*T-i*M+s*P)*E,t[6]=(m*b-f*A-g*v)*E,t[7]=(c*A-p*b+d*v)*E,t[8]=(o*B-a*M+u*I)*E,t[9]=(n*M-r*B-s*I)*E,t[10]=(f*_-y*b+g*x)*E,t[11]=(h*b-c*_-d*x)*E,t[12]=(a*P-o*D-l*I)*E,t[13]=(r*D-n*P+i*I)*E,t[14]=(y*v-f*w-m*x)*E,t[15]=(c*w-h*v+p*x)*E,t):null}function a(t,e,r){var n=e[0],i=e[1],s=e[2],o=e[3],a=e[4],l=e[5],u=e[6],c=e[7],h=e[8],p=e[9],d=e[10],f=e[11],y=e[12],m=e[13],g=e[14],x=e[15],v=r[0],b=r[1],w=r[2],_=r[3];return t[0]=v*n+b*a+w*h+_*y,t[1]=v*i+b*l+w*p+_*m,t[2]=v*s+b*u+w*d+_*g,t[3]=v*o+b*c+w*f+_*x,t[4]=(v=r[4])*n+(b=r[5])*a+(w=r[6])*h+(_=r[7])*y,t[5]=v*i+b*l+w*p+_*m,t[6]=v*s+b*u+w*d+_*g,t[7]=v*o+b*c+w*f+_*x,t[8]=(v=r[8])*n+(b=r[9])*a+(w=r[10])*h+(_=r[11])*y,t[9]=v*i+b*l+w*p+_*m,t[10]=v*s+b*u+w*d+_*g,t[11]=v*o+b*c+w*f+_*x,t[12]=(v=r[12])*n+(b=r[13])*a+(w=r[14])*h+(_=r[15])*y,t[13]=v*i+b*l+w*p+_*m,t[14]=v*s+b*u+w*d+_*g,t[15]=v*o+b*c+w*f+_*x,t}function l(t,e,r){var n,i,s,o,a,l,u,c,h,p,d,f,y=r[0],m=r[1],g=r[2];return e===t?(t[12]=e[0]*y+e[4]*m+e[8]*g+e[12],t[13]=e[1]*y+e[5]*m+e[9]*g+e[13],t[14]=e[2]*y+e[6]*m+e[10]*g+e[14],t[15]=e[3]*y+e[7]*m+e[11]*g+e[15]):(i=e[1],s=e[2],o=e[3],a=e[4],l=e[5],u=e[6],c=e[7],h=e[8],p=e[9],d=e[10],f=e[11],t[0]=n=e[0],t[1]=i,t[2]=s,t[3]=o,t[4]=a,t[5]=l,t[6]=u,t[7]=c,t[8]=h,t[9]=p,t[10]=d,t[11]=f,t[12]=n*y+a*m+h*g+e[12],t[13]=i*y+l*m+p*g+e[13],t[14]=s*y+u*m+d*g+e[14],t[15]=o*y+c*m+f*g+e[15]),t}function u(t,e,r){var n=r[0],i=r[1],s=r[2];return t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t[3]=e[3]*n,t[4]=e[4]*i,t[5]=e[5]*i,t[6]=e[6]*i,t[7]=e[7]*i,t[8]=e[8]*s,t[9]=e[9]*s,t[10]=e[10]*s,t[11]=e[11]*s,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function c(t,e,r){var n=Math.sin(r),i=Math.cos(r),s=e[4],o=e[5],a=e[6],l=e[7],u=e[8],c=e[9],h=e[10],p=e[11];return e!==t&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[4]=s*i+u*n,t[5]=o*i+c*n,t[6]=a*i+h*n,t[7]=l*i+p*n,t[8]=u*i-s*n,t[9]=c*i-o*n,t[10]=h*i-a*n,t[11]=p*i-l*n,t}function h(t,e,r){var n=Math.sin(r),i=Math.cos(r),s=e[0],o=e[1],a=e[2],l=e[3],u=e[8],c=e[9],h=e[10],p=e[11];return e!==t&&(t[4]=e[4],t[5]=e[
...
esOnBorder.length-1;for(let e=0;e<f.borders.length;e++)f.borders[e][0]!==Number.MAX_VALUE&&this.borderFeatureIndices[e].push(t)}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,e,n,s,o,i,l,void 0,this.worldview),this.groundEffect.addPaintPropertiesData(e,n,s,o,i,l,this.worldview),this.maxHeight=Math.max(this.maxHeight,g)}}sortBorders(){for(let t=0;t<this.borderFeatureIndices.length;t++)this.borderFeatureIndices[t].sort((e,r)=>this.featuresOnBorder[e].borders[t][0]-this.featuresOnBorder[r].borders[t][0])}splitToSubtiles(){const t=[];for(let e=0;e<this.centroidData.length;e++){const r=this.centroidData[e],n=+(r.min.y+r.max.y>Ge),i=2*n+(+(r.min.x+r.max.x>Ge)^n);for(let n=0;n<r.polygonSegLen;n++){const s=r.polygonSegIdx+n;t.push({centroidIdx:e,subtile:i,polygonSegmentIdx:s,triangleSegmentIdx:this.polygonSegments[s].triangleSegIdx})}}const e=new StructArrayLayout3ui6;t.sort((t,e)=>t.triangleSegmentIdx===e.triangleSegmentIdx?t.subtile-e.subtile:t.triangleSegmentIdx-e.triangleSegmentIdx);let r=0,n=0,i=0;for(const e of t){if(e.triangleSegmentIdx!==r)break;i++}const s=t.length;for(;n!==t.length;){r=t[n].triangleSegmentIdx;let o=0,a=n,l=n;for(let e=a;e<i&&t[e].subtile===o;e++)l++;for(;a!==i;){const n=t[a];o=n.subtile;const s=this.centroidData[n.centroidIdx].min.clone(),u=this.centroidData[n.centroidIdx].max.clone(),c={vertexOffset:this.segments.segments[r].vertexOffset,primitiveOffset:e.length,vertexLength:this.segments.segments[r].vertexLength,primitiveLength:0,sortKey:void 0,vaos:{}};for(let r=a;r<l;r++){const n=t[r],i=this.polygonSegments[n.polygonSegmentIdx],o=this.centroidData[n.centroidIdx].min,a=this.centroidData[n.centroidIdx].max,l=this.indexArray.uint16;for(let t=i.triangleArrayOffset;t<i.triangleArrayOffset+i.triangleCount;t++)e.emplaceBack(l[3*t],l[3*t+1],l[3*t+2]);c.primitiveLength+=i.triangleCount,s.x=Math.min(s.x,o.x),s.y=Math.min(s.y,o.y),u.x=Math.max(u.x,a.x),u.y=Math.max(u.y,a.y)}c.primitiveLength>0&&this.triangleSubSegments.push({segment:c,min:s,max:u}),a=l;for(let e=a;e<i&&t[e].subtile===t[a].subtile;e++)l++}n=i;for(let e=n;e<s&&t[e].triangleSegmentIdx===t[n].triangleSegmentIdx;e++)i++}e._trim(),this.indexArray=e}getVisibleSegments(t,e,r){const n=new SegmentVector;if(this.wallMode){for(const t of this.triangleSubSegments)n.segments.push(t.segment);return n}let i=0,s=0;const o=1<<t.canonical.z;if(e){const r=e.getMinMaxForTile(t);r&&(i=r.min,s=r.max)}s+=this.maxHeight;const a=t.toUnwrapped();let l;const u=[a.canonical.x/o+a.wrap,a.canonical.y/o],c=[(a.canonical.x+1)/o+a.wrap,(a.canonical.y+1)/o],h=(t,e,r)=>[t[0]*(1-r[0])+e[0]*r[0],t[1]*(1-r[1])+e[1]*r[1]],p=[],d=[];for(const t of this.triangleSubSegments){p[0]=t.min.x/Ge,p[1]=t.min.y/Ge,d[0]=t.max.x/Ge,d[1]=t.max.y/Ge;const e=h(u,c,p),o=h(u,c,d);if(0===new Aabb([e[0],e[1],i],[o[0],o[1],s]).intersectsPrecise(r)){l&&(n.segments.push(l),l=void 0);continue}const a=t.segment;l&&l.vertexOffset!==a.vertexOffset&&(n.segments.push(l),l=void 0),l?(l.vertexLength+=a.vertexLength,l.primitiveLength+=a.primitiveLength):l={vertexOffset:a.vertexOffset,primitiveLength:a.primitiveLength,vertexLength:a.vertexLength,primitiveOffset:a.primitiveOffset,sortKey:void 0,vaos:{}}}return l&&n.segments.push(l),n}encodeCentroid(t,e){const r=t.centroid(),n=e.span(),i=Math.min(7,Math.round(n.x*this.tileToMeter/10)),s=Math.min(7,Math.round(n.y*this.ti
...
is.workerSources[t]&&this.workerSources[t][e]){for(const n in this.workerSources[t][e]){const i=this.workerSources[t][e][n];for(const t in i)i[t].availableModels=r}n()}else n()}setProjection(t,e){this.projections[t]=Gd(e)}setBrightness(t,e,r){this.brightness=e,r()}setWorldview(t,e,r){this.worldview=e,r()}setLayers(t,e,r){this.getLayerIndex(t,e.scope).replace(e.layers,e.options),r()}updateLayers(t,e,r){this.getLayerIndex(t,e.scope).update(e.layers,e.removedIds,e.options),r()}loadTile(t,e,r){e.projection=this.projections[t]||this.defaultProjection,this.getWorkerSource(t,e.type,e.source,e.scope).loadTile(e,r)}decodeRasterArray(t,e,r){this.getWorkerSource(t,e.type,e.source,e.scope).decodeRasterArray(e,r)}reloadTile(t,e,r){e.projection=this.projections[t]||this.defaultProjection,this.getWorkerSource(t,e.type,e.source,e.scope).reloadTile(e,r)}abortTile(t,e,r){this.getWorkerSource(t,e.type,e.source,e.scope).abortTile(e,r)}removeTile(t,e,r){this.getWorkerSource(t,e.type,e.source,e.scope).removeTile(e,r)}removeSource(t,e,r){if(!(this.workerSources[t]&&this.workerSources[t][e.scope]&&this.workerSources[t][e.scope][e.type]&&this.workerSources[t][e.scope][e.type][e.source]))return;const n=this.workerSources[t][e.scope][e.type][e.source];delete this.workerSources[t][e.scope][e.type][e.source],void 0!==n.removeSource?n.removeSource(e,r):r()}loadWorkerSource(t,e,r){try{this.self.importScripts(e.url),r()}catch(t){r(t)}}syncRTLPluginState(t,e,r){if(Qi.isParsed())r(null,!0);else if(Qi.isParsing())this.rtlPluginParsingListeners.push(r);else try{Qi.setState(e);const t=Qi.getPluginURL();!Qi.isLoaded()||Qi.isParsed()||Qi.isParsing()||null==t||(Qi.setState({pluginStatus:Hi,pluginURL:Qi.getPluginURL()}),this.self.importScripts(t),Qi.isParsed()?r(null,!0):this.rtlPluginParsingListeners.push(r))}catch(t){r(t)}}setDracoUrl(t,e){this.dracoUrl=e}getAvailableImages(t,e){this.availableImages[t]||(this.availableImages[t]={});let r=this.availableImages[t][e];return r||(r=[]),r}getAvailableModels(t,e){this.availableModels[t]||(this.availableModels[t]={});let r=this.availableModels[t][e];return r||(r={}),r}getLayerIndex(t,e){this.layerIndexes[t]||(this.layerIndexes[t]={});let r=this.layerIndexes[t][e];return r||(r=this.layerIndexes[t][e]=new StyleLayerIndex,r.scope=e),r}getWorkerSource(t,e,r,n){const i=this.workerSources;return i[t]||(i[t]={}),i[t][n]||(i[t][n]={}),i[t][n][e]||(i[t][n][e]={}),this.isSpriteLoaded[t]||(this.isSpriteLoaded[t]={}),i[t][n][e][r]||(i[t][n][e][r]=new this.workerSourceTypes[e]({send:(e,r,n,i,s,o)=>this.actor.send(e,r,n,t,s,o),scheduler:this.actor.scheduler},this.getLayerIndex(t,n),this.getAvailableImages(t,n),this.getAvailableModels(t,n),this.isSpriteLoaded[t][n],void 0,this.brightness,this.worldview)),i[t][n][e][r]}rasterizeImagesWorker(t,e,r){const n=new Map;for(const[r,{image:i,imageVariant:s}]of e.tasks.entries()){const o=this.imageRasterizer.rasterize(s,i,e.scope,t);n.set(r,o)}r(void 0,n)}removeRasterizedImages(t,e,r){this.imageRasterizer.removeImagesFromCacheByIds(e.imageIds,e.scope,t),r()}enforceCacheSizeLimit(t,e){!function(t){kn(),null!=En&&En.then(e=>{e.keys().then(r=>{for(let n=0;n<r.length-t;n++)e.delete(r[n]).catch(t=>wt(t.message))}).catch(t=>wt(t.message))}).catch(t=>wt(t.message))}(e)}getWorkerPerformanceMetrics(t,e,r){r(void 0,void 0)}}(self))}();
//# sourceMappingURL=mapbox-gl-csp-worker.js.map

```

File: public/robots.txt
```text
Us
...
oc
...
s

```

File: scripts/check-user.ts
```typescript
im
...
 }
...
)

```

File: scripts/clear-users.ts
```typescript
im
...
ab
...
)

```

File: scripts/set-password.ts
```typescript
imp
...
wai
...
()

```

File: scripts/sync-google-hours.ts
```typescript
imp
...
ord
...
})

```

File: src/middleware.ts
```typescript
im
...
| 
...
}

```

File: src/actions/business-hours/manage-hours.ts
```typescript
'use server'

import { revalidat
...
: false, error: 'No se pudo guar
...
 'No se pudo duplicar.' }
  }
}

```

File: src/actions/categories/update-category.ts
```typescript
'use serv
...
d.success
...
 }
  }
}

```

File: src/actions/checkins/create-checkin.ts
```typescript
'use server'


...
rse(input)
   
...
-in.' }
  }
}

```

File: src/actions/collections/index.ts
```typescript
e
...
i
...


```

File: src/actions/collections/manage-collections.ts
```typescript
'use server'

import { revalidate
...
 parsed.error.issues[0]?.message 
...
 'No se pudo reordenar.' }
  }
}

```

File: src/actions/comments/create-comment.ts
```typescript
'use server'


...
nt.create({
  
...
ario' }
  }
}

```

File: src/actions/comments/index.ts
```typescript

e
```

File: src/actions/events/bulk-delete-events.ts
```typescript
'use serv
...
t.findMan
...
 }
  }
}

```

File: src/actions/events/create-event.ts
```typescript
'use server'

impor
...
rue,
        },
   
...
nte.',
    }
  }
}

```

File: src/actions/events/delete-event.ts
```typescript
'use se
...
stingEv
...

  }
}

```

File: src/actions/events/get-events.ts
```typescript
'u
...
ns
...
}

```

File: src/actions/events/get-upcoming-event-notifications.ts
```typescript
'use
...
<Upc
...
t }

```

File: src/actions/events/index.ts
```typescript
ex
...
en
...
'

```

File: src/actions/events/update-event-status.ts
```typescript
'use serv
...
ed = awai
...
 }
  }
}

```

File: src/actions/events/update-event.ts
```typescript
'use server'

import
...
})

      if (!venue
...
ente.',
    }
  }
}

```

File: src/actions/favorites/toggle-favorite.ts
```typescript
'use serve
...

    const
...
board')
}

```

File: src/actions/gamification/award-points.ts
```typescript
'use ser
...
r awardi
...
}
  }
}

```

File: src/actions/gamification/check-badges.ts
```typescript
'use se
...
er.tota
...

  }
}

```

File: src/actions/gamification/index.ts
```typescript
d
```

File: src/actions/media/index.ts
```typescript
d
```

File: src/actions/media/manage-media.ts
```typescript
'use server'

import { re
...
cess: false, error: 'No e
...
ch {
    return []
  }
}

```

File: src/actions/media/upload-media.ts
```typescript
'use server'

import 
...
t getServerSession(au
...
s archivos.' }
  }
}

```

File: src/actions/menu/index.ts
```typescript
on
```

File: src/actions/menu/manage-menu.ts
```typescript
'use server'

import { revalidatePath } from 'nex
...
izado.' }

    const item = await prisma.menuItem
...
: false, error: 'No se pudo actualizar.' }
  }
}

```

File: src/actions/messaging/blocked-users.ts
```typescript
'use server'

i
...
tions)

    if 
...
rn false
  }
}

```

File: src/actions/messaging/messages.ts
```typescript
'use server'

import { revalidatePath 
...
 session = await getServerSession(auth
...
se pudo reportar el negocio.' }
  }
}

```

File: src/actions/messaging/quick-replies.ts
```typescript
'use server'

impor
...

    const quickRep
...
   return []
  }
}

```

File: src/actions/newsletter/index.ts
```typescript
u
```

File: src/actions/newsletter/subscribe.ts
```typescript
'use server'
...
rmed: false,
...
r.' }
  }
}

```

File: src/actions/notifications/get-notification-preferences.ts
```typescript
'use
...
ess:
...
}
}

```

File: src/actions/notifications/index.ts
```typescript
e
...


...


```

File: src/actions/notifications/pull-comment-notifications.ts
```typescript
'use server'


...
lect: {
      
...
ios.' }
  }
}

```

File: src/actions/notifications/pull-upcoming-event-notifications.ts
```typescript
'use server
...
{
      hou
...
   }
  }
}

```

File: src/actions/notifications/update-notification-preferences.ts
```typescript
'use se
...
{
     
...

  }
}

```

File: src/actions/operating-hours/index.ts
```typescript
a
```

File: src/actions/operating-hours/upsert-operating-hours.ts
```typescript
'use serve
...
tar este l
...
  }
  }
}

```

File: src/actions/osm-imports/index.ts
```typescript
'use server'

impo
...
ada' }
    }

    
...
guración' }
  }
}

```

File: src/actions/posts/create-post.ts
```typescript
'use server'

im
...
wn) => Promise<P
...
mente.' }
  }
}

```

File: src/actions/posts/delete-post.ts
```typescript
'use 
...
,
   
...
 }
}

```

File: src/actions/posts/increment-view.ts
```typescript
'use
...
mber
...
}
}

```

File: src/actions/posts/index.ts
```typescript
e
...
 
...


```

File: src/actions/posts/update-post-status.ts
```typescript
'use ser
...
 'Datos 
...
}
  }
}

```

File: src/actions/posts/update-post.ts
```typescript
'use server'

imp
...
data: {
        t
...
tículo.' }
  }
}

```

File: src/actions/promotions/create-promotion.ts
```typescript
'use server'

imp
...
success: false, e
...
oferta.' }
  }
}

```

File: src/actions/promotions/index.ts
```typescript
e
```

File: src/actions/push/index.ts
```typescript
A
```

File: src/actions/push/subscribe-push.ts
```typescript
'use s
...
n.upse
...
  }
}

```

File: src/actions/questions/create-question.ts
```typescript
'use server'

impor
...
atos inválidos.' }

...
eliminar.' }
  }
}

```

File: src/actions/questions/index.ts
```typescript
Q
```

File: src/actions/recurrence/index.ts
```typescript
t
```

File: src/actions/recurrence/upsert-recurrence.ts
```typescript
'use server'


...
   count: pars
...
cia.' }
  }
}

```

File: src/actions/reservations/create-reservation.ts
```typescript
'use server'

import { revalid
...
sync function updateReservatio
...
guardar los ajustes.' }
  }
}

```

File: src/actions/reservations/index.ts
```typescript
tR
```

File: src/actions/reviews/create-review.ts
```typescript
'use server'

import { revalidat
...
nt,
          userId: session.us
...
do eliminar la reseña.' }
  }
}

```

File: src/actions/reviews/index.ts
```typescript
e
...
n
...


```

File: src/actions/reviews/reply-review.ts
```typescript
'use server'
...
(!review) re
...
a.' }
  }
}

```

File: src/actions/reviews/update-review-status.ts
```typescript
'use server'

import { reval
...
rId, POINTS.REVIEW_PHOTO, 'r
...
lizar las reseñas.' }
  }
}

```

File: src/actions/routes/create-route.ts
```typescript
'use server'

im
...
ption: parsed.da
...
lizar.' }
  }
}

```

File: src/actions/routes/index.ts
```typescript
A
```

File: src/actions/search-console/sync-snapshots.ts
```typescript
'use
...
 { s
...
}
}

```

File: src/actions/services/manage-services.ts
```typescript
'use server'

import { revalidat
...
ss: false, error: 'Ya existe un 
...
'No se pudo reordenar.' }
  }
}

```

File: src/actions/special-hours/index.ts
```typescript
i
```

File: src/actions/special-hours/upsert-special-hours.ts
```typescript
'use server'
...

    const p
...
r.' }
  }
}

```

File: src/actions/user/admin-update-user.ts
```typescript
'use server'

im
...
    if (!session
...
.',
    }
  }
}

```

File: src/actions/user/update-profile.ts
```typescript
'use server'

im
...
t: UpdatePasswor
...
perfil' }
  }
}

```

File: src/actions/venue-claims/create-claim.ts
```typescript
'use server'

...
lse, error: '
...
mo.' }
  }
}

```

File: src/actions/venue-claims/index.ts
```typescript
po
```

File: src/actions/venue-claims/update-claim.ts
```typescript
'use ser
...
Unique({
...
}
  }
}

```

File: src/actions/venues/branches.ts
```typescript
'use server'

import { revalidatePath } f
...
xistingVenueId === parentVenueId) {
     
...
branch
  } catch {
    return null
  }
}

```

File: src/actions/venues/bulk-delete-venues.ts
```typescript
'use serv
...
.findMany
...
 }
  }
}

```

File: src/actions/venues/bulk-toggle-active.ts
```typescript
'use se
...
l estad
...

  }
}

```

File: src/actions/venues/bulk-update-venue-status.ts
```typescript
'use s
...
!venue
...
  }
}

```

File: src/actions/venues/create-venue-complete.ts
```typescript
'use server'

import { revalidatePath 
...
yIds } },
          select: { id: true
...
al. Intenta nuevamente.',
    }
  }
}

```

File: src/actions/venues/create-venue.ts
```typescript
'use server'

import { 
...
.data.priceRange,
     
...
vamente.',
    }
  }
}

```

File: src/actions/venues/delete-venue.ts
```typescript
'use se
...
istingV
...

  }
}

```

File: src/actions/venues/index.ts
```typescript
ex
...
ue
...
'

```

File: src/actions/venues/toggle-venue-active.ts
```typescript
'use se
...
ere: { 
...

  }
}

```

File: src/actions/venues/update-venue-status.ts
```typescript
'use server'


...
y: {
         
...
,
    }
  }
}

```

File: src/actions/venues/update-venue.ts
```typescript
'use server'

import { 
...
       })

        if (
...
vamente.',
    }
  }
}

```

File: src/actions/views/increment-view.ts
```typescript
'us
...
suc
...

}

```

File: src/actions/views/index.ts
```typescript
V
```

File: src/app/globals.css
```css
@import 'mapbox-gl/dist/mapbox-gl.css';

@f
...
ly mx-auto w-full max-w-7xl px-4 sm:px-6 lg
...
top: 0.15rem;
  padding-bottom: 0.15rem;
}

```

File: src/app/layout.tsx
```tsx
import type 
...
ink rel="ico
...
html>
  )
}

```

File: src/app/not-found.tsx
```tsx
imp
...
   
...

}

```

File: src/app/page.tsx
```tsx
import { Suspense } from 're
...
     <main className="space-
...
   </main>
    </div>
  )
}

```

File: src/app/sitemap.ts
```typescript
import
...
ones`,
...
ies
}

```

File: src/app/about/page.tsx
```tsx
import
...
ed-for
...
  )
}

```

File: src/app/admin/layout.tsx
```tsx
imp
...
  i
...

}

```

File: src/app/admin/page.tsx
```tsx
l
```

File: src/app/admin/blog/page.tsx
```tsx
import Link
...
tus.success
...
div>
  )
}

```

File: src/app/admin/blog/[id]/editar/page.tsx
```tsx
import { n
...
me="pb-16 
...
iv>
  )
}

```

File: src/app/admin/categorias/category-edit-form.tsx
```tsx
'use client'

import { useState } from 're
...
ipcion general de la categoria..."
       
...
  </button>
      </div>
    </div>
  )
}

```

File: src/app/admin/categorias/page.tsx
```tsx
import { getS
...
lizarlos.
   
...
</div>
  )
}

```

File: src/app/admin/eventos/page.tsx
```tsx
import {
...
nst reso
...
>
  )
}

```

File: src/app/admin/eventos/[id]/editar/page.tsx
```tsx
import { n
...
minEditarE
...
iv>
  )
}

```

File: src/app/admin/google-types/google-types-manager.tsx
```tsx
'use client'

import { useState } from 'react'
import { Sear
...
          <tbody className="divide-y divide-border/30">
    
...
contraron mappings
        </div>
      )}
    </div>
  )
}

```

File: src/app/admin/google-types/page.tsx
```tsx
import { 
...
s.
      
...
v>
  )
}

```

File: src/app/admin/import/page.tsx
```tsx
c
```

File: src/app/admin/imports/google/page.tsx
```tsx
import
...
 { typ
...
  )
}

```

File: src/app/admin/imports/google/drafts/page.tsx
```tsx
impo
...
auth
...
)
}

```

File: src/app/admin/imports/google/jobs/jobs-list.tsx
```tsx
'use client'

import { useSta
...
      <thead className="bg-mu
...
rdContent>
    </Card>
  )
}

```

File: src/app/admin/imports/google/jobs/page.tsx
```tsx
impo
...
| se
...
)
}

```

File: src/app/admin/imports/google/jobs/[id]/page.tsx
```tsx
import
...
on?.us
...
  )
}

```

File: src/app/admin/imports/google/slow/page.tsx
```tsx
impor
...
f (!s
...
 )
}

```

File: src/app/admin/imports/google/sync/page.tsx
```tsx
impor
...
it au
...
 )
}

```

File: src/app/admin/locales/page.tsx
```tsx
import {
...
nst reso
...
>
  )
}

```

File: src/app/admin/locales/[id]/editar/page.tsx
```tsx
import { not
...
s: {
       
...
/div>
  )
}

```

File: src/app/admin/ofertas/offer-actions.tsx
```tsx
'use 
...
Ofert
...
 )
}

```

File: src/app/admin/ofertas/page.tsx
```tsx
import { ge
...
 ofertas pu
...
div>
  )
}

```

File: src/app/admin/osm-imports/osm-tabs.tsx
```tsx
'use c
...
ame = 
...
  )
}

```

File: src/app/admin/osm-imports/page.tsx
```tsx
impo
...
n?.u
...
)
}

```

File: src/app/admin/osm-imports/cola/page.tsx
```tsx
impo
...
essi
...
)
}

```

File: src/app/admin/osm-imports/configuracion/page.tsx
```tsx
impo
...

  i
...
)
}

```

File: src/app/admin/osm-imports/historial/page.tsx
```tsx
impo
...
sion
...
)
}

```

File: src/app/admin/osm-imports/nueva-importacion/page.tsx
```tsx
impo
...
sess
...
)
}

```

File: src/app/admin/reclamos/claim-actions.tsx
```tsx
'use cli
...
 setLoad
...
>
  )
}

```

File: src/app/admin/reclamos/page.tsx
```tsx
import { getServerSession } from 
...
              </div>
            
...
</div>
      )}
    </div>
  )
}

```

File: src/app/admin/resenas/page.tsx
```tsx
import Link f
...
: getParam(re
...
</div>
  )
}

```

File: src/app/admin/search-console/page.tsx
```tsx
import { Search, AlertCircle, Exte
...
und hover:bg-primary/90 transition
...
 />
      </div>
    </div>
  )
}

```

File: src/app/admin/usuarios/page.tsx
```tsx
import Link
...
 { q, role,
...
div>
  )
}

```

File: src/app/admin/usuarios/[id]/editar/page.tsx
```tsx
import
...
tFound
...
  )
}

```

File: src/app/api/admin/google-types/route.ts
```typescript
import { 
...
 category
...
rue })
}

```

File: src/app/api/admin/imports/google/drafts/route.ts
```typescript
import
...
mit,
 
...
  }
}

```

File: src/app/api/admin/imports/google/geocode/route.ts
```typescript
import
...
No se 
...
  }
}

```

File: src/app/api/admin/imports/google/import/route.ts
```typescript
import { NextRequ
...
oogleImportLog.cr
...
us: 500 })
  }
}

```

File: src/app/api/admin/imports/google/jobs/route.ts
```typescript
import { 
...
lidated =
...
})
  }
}

```

File: src/app/api/admin/imports/google/jobs/[id]/route.ts
```typescript
import
...
rror: 
...
  }
}

```

File: src/app/api/admin/imports/google/quality/route.ts
```typescript
import 
...
     pr
...

  }
}

```

File: src/app/api/admin/imports/google/search/route.ts
```typescript
import { Ne
...
ng}`

    c
...
0 })
  }
}

```

File: src/app/api/admin/imports/google/slow/jobs/route.ts
```typescript
import { N
...
t.startJob
...
 })
  }
}

```

File: src/app/api/admin/imports/google/slow/jobs/[id]/route.ts
```typescript
import {
...
 require
...
)
  }
}

```

File: src/app/api/admin/imports/google/sync/route.ts
```typescript
impor
...
,
   
...
 }
}

```

File: src/app/api/admin/osm-import/bulk-import/route.ts
```typescript
import { 
...
        d
...
})
  }
}

```

File: src/app/api/admin/osm-import/config/route.ts
```typescript
import 
...
t requi
...

  }
}

```

File: src/app/api/admin/osm-import/history/route.ts
```typescript
import {
...
imit,
  
...
)
  }
}

```

File: src/app/api/admin/osm-import/import/route.ts
```typescript
import 
...
st dupC
...

  }
}

```

File: src/app/api/admin/osm-import/search/route.ts
```typescript
import { Next
...
tus: 400 })
 
...
500 })
  }
}

```

File: src/app/api/admin/osm-import/stats/route.ts
```typescript
import { N
...
unt({ wher
...
 })
  }
}

```

File: src/app/api/admin/osm-import/sync/route.ts
```typescript
import { NextR
...
 } catch (erro
...
 500 })
  }
}

```

File: src/app/api/admin/search-console/callback/route.ts
```typescript
impor
...
retur
...
 }
}

```

File: src/app/api/admin/search-console/setup/route.ts
```typescript
im
...
un
...
}

```

File: src/app/api/admin/search-console/sync/route.ts
```typescript
imp
...
dDa
...

}

```

File: src/app/api/admin/sync-search/route.ts
```typescript
import 
...
earch()
...
  })
}

```

File: src/app/api/admin/test-search/route.ts
```typescript
import
...
gth} r
...
  }
}

```

File: src/app/api/auth/signup/route.ts
```typescript
import 
...
 role }
...

  }
}

```

File: src/app/api/auth/[...nextauth]/route.ts
```typescript
ns
```

File: src/app/api/claims/submit/route.ts
```typescript
import { NextRe
...
laim activo (PE
...
},
    )
  }
}

```

File: src/app/api/claims/verify/route.ts
```typescript
import { NextRe
...
Response.json(

...
},
    )
  }
}

```

File: src/app/api/claims/[id]/upload/route.ts
```typescript
import { NextR
...
  return NextR
...
,
    )
  }
}

```

File: src/app/api/dashboard/events/route.ts
```typescript
import
...

    c
...
  }
}

```

File: src/app/api/dashboard/posts/route.ts
```typescript
import
...
? ''
 
...
  }
}

```

File: src/app/api/dashboard/tags/route.ts
```typescript
im
...
se
...
}

```

File: src/app/api/dashboard/venues/route.ts
```typescript
import
...

    c
...
  }
}

```

File: src/app/api/debug/auth-test/route.ts
```typescript
impo
...
ail:
...
)
}

```

File: src/app/api/debug/cache/route.ts
```typescript
import { NextR
...
ed: true },
  
...
 500 })
  }
}

```

File: src/app/api/events/search/route.ts
```typescript
import { Next
...
..(category &
...

    )
  }
}

```

File: src/app/api/explore/search/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma
...
sc' }, { createdAt: 'desc' }],
            skip: venueSkip,
           
...
sponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

```

File: src/app/api/messages/conversations/route.ts
```typescript
import { NextRes
...
 conv.lastMessag
...
s: 500 })
  }
}

```

File: src/app/api/messages/conversations/[id]/route.ts
```typescript
import { 
...
onst mess
...
})
  }
}

```

File: src/app/api/notifications/preferences/route.ts
```typescript
imp
...
se.
...

}

```

File: src/app/api/notifications/stream/route.ts
```typescript
import {
...
        
...

  })
}

```

File: src/app/api/notifications/upcoming/route.ts
```typescript
i
...
i
...


```

File: src/app/api/search/global/route.ts
```typescript
import { NextReq
...
 { in: categoryI
...
: 500 })
  }
}


```

File: src/app/api/uploads/media/route.ts
```typescript
import { ran
...
f (!(maybeFi
...
    )
  }
}

```

File: src/app/api/venues/search/route.ts
```typescript
import { NextR
...
tegory: { slug
...
}
    )
  }
}

```

File: src/app/api/venues/[slug]/conversations/route.ts
```typescript
import { NextR
...
v = conversati
...
 500 })
  }
}

```

File: src/app/auth/signin/page.tsx
```tsx
'use client'

imp
...
              typ
...
    </div>
  )
}

```

File: src/app/auth/signup/page.tsx
```tsx
'use client'

import { us
...
="email"
                
...
ionDiv>
    </div>
  )
}

```

File: src/app/blog/page.tsx
```tsx
import Link from 'next/link'
i
...

                href={`/blog?
...
      </div>
    </div>
  )
}

```

File: src/app/blog/crear/page.tsx
```tsx
n
```

File: src/app/blog/[slug]/page.tsx
```tsx
import { notFound } fr
...
      ? prisma.favorit
...
ull}
    </div>
  )
}

```

File: src/app/colecciones/page.tsx
```tsx
import { ge
...
ns.map((col
...
div>
  )
}

```

File: src/app/colecciones/[slug]/page.tsx
```tsx
import { not
...
 mt-1">{coll
...
/div>
  )
}

```

File: src/app/contact/page.tsx
```tsx
import
...
   <p 
...
  )
}

```

File: src/app/dashboard/error.tsx
```tsx
'use c
...
 bg-de
...
  )
}

```

File: src/app/dashboard/layout.tsx
```tsx
i
...
 
...


```

File: src/app/dashboard/loading.tsx
```tsx
impor
...
 <Ske
...
 )
}

```

File: src/app/dashboard/page.tsx
```tsx
import { redirect } from 'next/navigation'

...
ref="/dashboard/eventos/crear"
            
...
     )}

      </section>
    </div>
  )
}

```

File: src/app/dashboard/analytics/page.tsx
```tsx
impor
...
edire
...
 )
}

```

File: src/app/dashboard/blog/page.tsx
```tsx
import { redirect } f
...
/div>
          <div 
...
on>
    </div>
  )
}

```

File: src/app/dashboard/blog/crear/page.tsx
```tsx
import {
...
"h-9 bor
...
>
  )
}

```

File: src/app/dashboard/blog/[id]/editar/page.tsx
```tsx
import { notFo
...
order/80 bg-ba
...
 </div>
  )
}

```

File: src/app/dashboard/colecciones/collection-create-form.tsx
```tsx
'use cl
...
ult.err
...

  )
}

```

File: src/app/dashboard/colecciones/delete-collection-button.tsx
```tsx
'use 
...
ccess
...
 )
}

```

File: src/app/dashboard/colecciones/page.tsx
```tsx
import { red
...
l items-cent
...
/div>
  )
}

```

File: src/app/dashboard/colecciones/[id]/collection-edit-form.tsx
```tsx
'use client'

impor
...
>
          <X clas
...
>
    </div>
  )
}

```

File: src/app/dashboard/colecciones/[id]/page.tsx
```tsx
import { notFound, redirec
...
-y-3">
          {items.ma
...
section>
    </div>
  )
}

```

File: src/app/dashboard/colecciones/[id]/remove-item-button.tsx
```tsx
'use
...
{
  
...
)
}

```

File: src/app/dashboard/colecciones/[id]/reorder-buttons.tsx
```tsx
'use cl
...
if (new
...

  )
}

```

File: src/app/dashboard/configuracion/page.tsx
```tsx
import 
...
emibold
...

  )
}

```

File: src/app/dashboard/eventos/page.tsx
```tsx
import { redire
...
      Crear eve
...
  </div>
  )
}

```

File: src/app/dashboard/eventos/crear/page.tsx
```tsx
import
...
-auto 
...
  )
}

```

File: src/app/dashboard/eventos/[slug]/editar/page.tsx
```tsx
import Lin
...
iv classNa
...
iv>
  )
}

```

File: src/app/dashboard/favoritos/page.tsx
```tsx
import { redirect
...
text-muted-foregr
...
    </div>
  )
}

```

File: src/app/dashboard/locales/page.tsx
```tsx
import { redire
...
  Registrar loc
...
  </div>
  )
}

```

File: src/app/dashboard/locales/crear/page.tsx
```tsx
impor
...
div c
...
 )
}

```

File: src/app/dashboard/locales/[slug]/analytics/page.tsx
```tsx
import { redirect } from 'next
...
ta._count.reservations}</p>
  
...
  </section>
    </div>
  )
}

```

File: src/app/dashboard/locales/[slug]/editar/page.tsx
```tsx
import Li
...
     <sec
...
v>
  )
}

```

File: src/app/dashboard/locales/[slug]/horarios/page.tsx
```tsx
import 
...
 venue.
...

  )
}

```

File: src/app/dashboard/locales/[slug]/medios/page.tsx
```tsx
import {
...
')

  re
...
>
  )
}

```

File: src/app/dashboard/locales/[slug]/mensajes/page.tsx
```tsx
'use client'

import { use
...
lassName="pb-16 pt-8">
   
...
section>
    </div>
  )
}

```

File: src/app/dashboard/locales/[slug]/menu/page.tsx
```tsx
impor
...
ue.fi
...
 )
}

```

File: src/app/dashboard/locales/[slug]/qr-kit/page.tsx
```tsx
impo
...
rSes
...
)
}

```

File: src/app/dashboard/locales/[slug]/servicios/page.tsx
```tsx
import 
...
: { ven
...

  )
}

```

File: src/app/dashboard/locales/[slug]/sucursales/page.tsx
```tsx
import { red
...
ma.venue.fin
...
/div>
  )
}

```

File: src/app/dashboard/mensajes/page.tsx
```tsx
'use client'

import { us
...
center">
              <M
...
ection>
    </div>
  )
}

```

File: src/app/dashboard/notificaciones/page.tsx
```tsx
im
...

 
...
}

```

File: src/app/dashboard/reservas/page.tsx
```tsx
import { redi
...
sName="text-2
...
</div>
  )
}

```

File: src/app/eventos/error.tsx
```tsx
'use
...
ntos
...
)
}

```

File: src/app/eventos/page.tsx
```tsx
import { CalendarDays, Star, 
...
 mapboxToken =
    process.en
...
     </div>
    </div>
  )
}

```

File: src/app/eventos/crear/page.tsx
```tsx
i
...
e
...


```

File: src/app/eventos/[slug]/page.tsx
```tsx
import Link from 'next/l
...
.resolve(false),
    ses
...
ction>
    </div>
  )
}

```

File: src/app/eventos/[slug]/editar/page.tsx
```tsx
i
...
f
...


```

File: src/app/explorar/error.tsx
```tsx
'use
...
pági
...
)
}

```

File: src/app/explorar/page.tsx
```tsx
import { getV
...
.address,
   
...
</div>
  )
}

```

File: src/app/locales/error.tsx
```tsx
'use
...
ales
...
)
}

```

File: src/app/locales/page.tsx
```tsx
import { MapPin, Star, Sparkle
...
0, ALL_TAKE) as VenueListItem[
...
      </div>
    </div>
  )
}

```

File: src/app/locales/crear/page.tsx
```tsx
i
...
n
...


```

File: src/app/locales/[slug]/page.tsx
```tsx
import Link from 'next/l
...
orite, menu, collections
...
ction>
    </div>
  )
}

```

File: src/app/locales/[slug]/editar/page.tsx
```tsx
i
...
c
...


```

File: src/app/mejores/[categorySlug]/page.tsx
```tsx
import { notFound } from 'next/
...
          <p className="mx-auto
...

      </div>
    </div>
  )
}

```

File: src/app/ofertas/page.tsx
```tsx
import 
...
2xl fon
...

  )
}

```

File: src/app/perfil/[id]/page.tsx
```tsx
import { notFound } from 'next/nav
...
      ? `/locales/${entity.slug}`

...
 )}
      </div>
    </div>
  )
}

```

File: src/app/privacy/page.tsx
```tsx
import {
...
e="space
...
>
  )
}

```

File: src/app/rutas/page.tsx
```tsx
import {
...
</h1>
  
...
>
  )
}

```

File: src/app/rutas/crear/page.tsx
```tsx
impo
...
PPRO
...
)
}

```

File: src/app/rutas/[slug]/page.tsx
```tsx
import Lin
...
,
        
...
iv>
  )
}

```

File: src/app/sitemaps/blog/route.ts
```typescript
impo
...
dAt:
...
)
}

```

File: src/app/sitemaps/categorias/route.ts
```typescript
impo
...
 las
...
)
}

```

File: src/app/sitemaps/colecciones/route.ts
```typescript
imp
...
rls
...

}

```

File: src/app/sitemaps/eventos/route.ts
```typescript
impo
...
At: 
...
)
}

```

File: src/app/sitemaps/locales/route.ts
```typescript
impo
...
upda
...
)
}

```

File: src/app/sitemaps/static/route.ts
```typescript
import
...
ones`,
...
 })
}

```

File: src/app/[categorySlug]/page.tsx
```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
imp
...
-14">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} 
...
      </div>
          </section>
        )}
      </div>
    </div>
  )
}

```

File: src/components/json-ld.tsx
```tsx
type JsonLdP
...
           r
...
 })),
  }
}

```

File: src/components/auth/auth-provider.tsx
```tsx
'
...
e
...


```

File: src/components/auth/user-menu.tsx
```tsx
'use client'

import { useRef, use
...

      <AnimatePresence>
        {
...
AnimatePresence>
    </div>
  )
}

```

File: src/components/branches/branch-manager.tsx
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@
...
e"
                  onClick={() => setDeleteConfirm(branch.id)}
       
...
er>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/business-hours/business-hours-display.tsx
```tsx
'use client'

impo
...
lse {
        cons
...

    </div>
  )
}

```

File: src/components/business-hours/business-hours-editor.tsx
```tsx
'use client'

import { useState } from 'react
...
lt = await duplicateDayScheduleAction(venueId
...

        </Button>
      )}
    </div>
  )
}

```

File: src/components/checkin/checkin-button.tsx
```tsx
'use client'

...
      }
     
...
</div>
  )
}

```

File: src/components/collections/add-to-collection-button.tsx
```tsx
'use client'

import 
...
rado.')
    } finally
...
 )}
    </div>
  )
}

```

File: src/components/debug/mapbox-token-test.tsx
```tsx
'us
...
?ac
...

}

```

File: src/components/event/event-calendar.tsx
```tsx
'use client'

import { useS
...
e="grid grid-cols-7 gap-1 m
...

      )}
    </div>
  )
}

```

File: src/components/event/recurrence-form.tsx
```tsx
'use client'

import { useState
...
    <Label>Frecuencia</Label>
 
...
      </div>
    </form>
  )
}

```

File: src/components/features/admin/admin-user-edit-form.tsx
```tsx
'use client'

import { useState, useTransitio
...
rid grid-cols-2 gap-4 sm:grid-cols-3">
      
...
/CardContent>
      </Card>
    </div>
  )
}

```

File: src/components/features/admin/admin-users-list.tsx
```tsx
'use client'

import { useState, useTransition 
...
 items-center gap-2">
            <div classNam
...
   )
        })}
      </div>
    </div>
  )
}

```

File: src/components/features/admin/google-import/bulk-import-confirm.tsx
```tsx
'use clie
...
 para evi
...
g>
  )
}

```

File: src/components/features/admin/google-import/draft-manager.tsx
```tsx
'use client'

import { useState, useEffec
...
             checked={drafts.length > 0 &
...
}
      </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/google-import-form.tsx
```tsx
'use client'

import { u
...
/>
              {form.f
...
tent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/google-import-preview.tsx
```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Ch
...
ra importar</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 
...
lar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/google-import-results.tsx
```tsx
'use client'

import { useState, useMe
...
Lng</th>
                  <th classNa
...
     </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/google-import-tabs.tsx
```tsx
'use 
...
assNa
...
 )
}

```

File: src/components/features/admin/google-import/google-places-import.tsx
```tsx
'use client'

import { useState, useCallback } from 'react'
...
address: geoResult?.formattedAddress || '',
            cat
...
 )
}

export const GooglePlacesImport = GooglePlacesWizard

```

File: src/components/features/admin/google-import/job-progress.tsx
```tsx
'use client'

import { useEffect
...
d" />
        </CardContent>
   
...
/CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/log-feed.tsx
```tsx
'use cli
...
>}
     
...
,
  }
}

```

File: src/components/features/admin/google-import/map-preview.tsx
```tsx
'use client'

im
...
e={`w-full h-[25
...
},
    })
  }
}

```

File: src/components/features/admin/google-import/slow-import-wizard.tsx
```tsx
'use client'

import { useState, useCallback } from 'react'
import { toast } fro
...
4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
...
ción finalizada. Revisa los borradores.')}
        />
      )}
    </div>
  )
}

```

File: src/components/features/admin/google-import/slow-job-progress.tsx
```tsx
'use client'

import { useEffect, useS
...

          {error}
        </CardConte
...
     </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/sync-dashboard.tsx
```tsx
'use client'

import { use
...
        color="text-orange
...
ontent>
    </Card>
  )
}

```

File: src/components/features/admin/google-import/wizard-address.tsx
```tsx
'use client'

imp
...
(false)
    }
  }
...
    </div>
  )
}

```

File: src/components/features/admin/google-import/wizard-categories.tsx
```tsx
'use client'

i
...
  ? 'Deseleccio
...
  </div>
  )
}

```

File: src/components/features/admin/google-import/wizard-radius.tsx
```tsx
'use clie
...
         
...
v>
  )
}

```

File: src/components/features/admin/google-import/wizard-results.tsx
```tsx
'use client'

import { useState } fro
...
Lng</th>
                <th classNam
...
</div>
      </div>
    </div>
  )
}

```

File: src/components/features/admin/osm/osm-config-form.tsx
```tsx
'use client'

import { useState, u
...
m.formState.errors.overpassUrl && 
...
 </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/osm/osm-history-table.tsx
```tsx
'use client'

import { useState, useEff
...
-foreground" suppressHydrationWarning>{
...
      </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/osm/osm-import-form.tsx
```tsx
'use client'

import { useState } f
...
mit(handleSearch)} className="space
...
      />
      )}
    </div>
  )
}

```

File: src/components/features/admin/osm/osm-imports-dashboard.tsx
```tsx
'use client'

import { 
...
           <CardContent
...
/div>
    </div>
  )
}

```

File: src/components/features/admin/osm/osm-preview-table.tsx
```tsx
'use client'

import { useState } from 'react
...
 <Button
              variant="outline"
    
...
   )}
      </CardContent>
    </Card>
  )
}

```

File: src/components/features/admin/osm/osm-queue-table.tsx
```tsx
'use client'

import { use
...
ound" />
          </div>

...
ontent>
    </Card>
  )
}

```

File: src/components/features/admin/search-console/actions-tab.tsx
```tsx
'use client'

import { Zap, TrendingUp, Trendi
...
            </span>
                    </div>
...
  )}
        </div>
      )}
    </div>
  )
}

```

File: src/components/features/admin/search-console/content-ideas-tab.tsx
```tsx
'use client'

imp
...
-cols-2 lg:grid-c
...
    </div>
  )
}

```

File: src/components/features/admin/search-console/keyword-gaps-tab.tsx
```tsx
'use client'

import { 
...
r/20 last:border-0">
  
...
   )}
    </div>
  )
}

```

File: src/components/features/admin/search-console/opportunities-tab.tsx
```tsx
'use client'

impor
...
lassName="pb-2 text
...
}
    </div>
  )
}

```

File: src/components/features/admin/search-console/search-console-charts.tsx
```tsx
'use client'

import {
...
="100%" height="100%">
...
div>
    </div>
  )
}

```

File: src/components/features/admin/search-console/search-console-dashboard.tsx
```tsx
'use client'

import { useState } from 'reac
...
p>
              <p className="mt-1 text-2xl
...
v>
        </div>
      )}
    </div>
  )
}

```

File: src/components/features/admin/search-console/search-console-tabs.tsx
```tsx
'use client'

import { useS
...
cMessage('Error de conexión
...
Data} />}
    </div>
  )
}

```

File: src/components/features/admin/search-console/top-blog-pages-tab.tsx
```tsx
'use client'


...
    <tbody>
  
...
 </div>
  )
}

```

File: src/components/features/admin/search-console/top-business-pages-tab.tsx
```tsx
'use client'


...
          <tbo
...
 </div>
  )
}

```

File: src/components/features/admin/search-console/top-event-pages-tab.tsx
```tsx
'use client'


...
         <tbod
...
 </div>
  )
}

```

File: src/components/features/admin/search-console/top-local-queries-tab.tsx
```tsx
'use client'

impor
...
             </span
...
}
    </div>
  )
}

```

File: src/components/features/admin/search-console/top-pages-table.tsx
```tsx
'use client'
...
t-medium tex
...
/div>
  )
}

```

File: src/components/features/admin/search-console/top-queries-table.tsx
```tsx
'use clien
...
 font-medi
...
iv>
  )
}

```

File: src/components/features/blog/admin-blog-moderation.tsx
```tsx
'use client'

import { useMemo, useState, useTransi
...
           post.status === 'PENDING' || post.status
...
       )
        })}
      </div>
    </div>
  )
}

```

File: src/components/features/blog/blog-card.tsx
```tsx
import Image from 'nex
...
v className="flex flex
...
iv>
    </Link>
  )
}

```

File: src/components/features/blog/blog-detail.tsx
```tsx
import Image from
...

      {post.tags
...
</article>
  )
}

```

File: src/components/features/blog/blog-form.tsx
```tsx
'use client'

import { useState }
...
             >
                  
...

      </form>
    </Form>
  )
}

```

File: src/components/features/blog/index.ts
```typescript
e
...
o
...


```

File: src/components/features/blog/popular-badge.tsx
```tsx
im
...
tu
...
}

```

File: src/components/features/blog/post-edit-form.tsx
```tsx
'use client'

import { useState }
...
ategories.map((category, i) => (

...

      </form>
    </Form>
  )
}

```

File: src/components/features/blog/tag-input.tsx
```tsx
'use client
...
offset-back
...
div>
  )
}

```

File: src/components/features/blog/trending-section.tsx
```tsx
import
...
}</h2>
...
  )
}

```

File: src/components/features/blog/user-posts-list.tsx
```tsx
'use client'

import { useEffect, useMemo, useRef, useState } 
...
 (
              <button
                key={tag.id}
        
...
 </div>
          )}
        </div>
      )}
    </div>
  )
}

```

File: src/components/features/comments/comment-section.tsx
```tsx
'use client'

import { useMemo, useState, useTr
...
ccent"
            onClick={() => setReplyingTo
...
AnimatePresence>
      </div>
    </div>
  )
}

```

File: src/components/features/dashboard/analytics-charts.tsx
```tsx
'use client'


...
>
        <div
...
 </div>
  )
}

```

File: src/components/features/dashboard/analytics-dashboard.tsx
```tsx
import Link from 'next/link'
import dynamic from 'next/d
...
events.pending}</span>
            </div>
            <d
...
alyticsCharts analytics={analytics} />
    </div>
  )
}

```

File: src/components/features/dashboard/engagement-stats.tsx
```tsx
'use client'

imp
...
   <div className
...
    </div>
  )
}

```

File: src/components/features/dashboard/gamification-widget.tsx
```tsx
'use client'

imp
...
    {levelInfo.ne
...
    </div>
  )
}

```

File: src/components/features/dashboard/user-events-list.tsx
```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useSta
...
line-flex h-4 min-w-4 items-center justify-center rounded-full px-1 te
...
>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/features/dashboard/user-venues-list.tsx
```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useStat
...
de)
    return () => observer.disconnect()
  }, [query.hasNextPage, que
...
r>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/features/events/admin-event-moderation.tsx
```tsx
'use client'

import { useCallback, useMemo, useState, useTransition }
...
push(buildFilterUrl(currentFilters, { category: e.target.value }))}
  
...
>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/features/events/event-card.tsx
```tsx
'use client'

import {
...
urrente
            </
...
iv>
    </Link>
  )
}

```

File: src/components/features/events/event-content.tsx
```tsx
'use cl
...
.toStri
...
} />
}

```

File: src/components/features/events/event-detail.tsx
```tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 
...
        <h2 className="text-lg font-medium text-foreground">Detalles del evento</h2>
              <
...
y.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}

```

File: src/components/features/events/event-edit-form.tsx
```tsx
'use client'

import { useState } from 'react'
import { useFor
...
er>
                <FormMessage />
              </FormItem>

...
     </Button>
        </div>
      </form>
    </Form>
  )
}

```

File: src/components/features/events/event-empty-state.tsx
```tsx
impo
...
assN
...
)
}

```

File: src/components/features/events/event-filters-client.tsx
```tsx
'use client'

import
...
entos, lugares, dire
...
v>
    </div>
  )
}

```

File: src/components/features/events/event-filters.tsx
```tsx
import { Search
...
und transition-
...
 </form>
  )
}

```

File: src/components/features/events/event-form.tsx
```tsx
"use client"

import { useState } from "react"
import { type Field
...
                       field.onChange(next)
                      
...
         </Button>
        </div>
      </form>
    </Form>
  )
}

```

File: src/components/features/events/event-grid-animated.tsx
```tsx
'use 
...
onst

...
 )
}

```

File: src/components/features/events/event-grid.tsx
```tsx
i
...
n
...


```

File: src/components/features/events/event-related.tsx
```tsx
'use client'

imp
...
category.icon, 'e
...
</section>
  )
}

```

File: src/components/features/events/event-share-button.tsx
```tsx
'us
...
   
...

}

```

File: src/components/features/events/event-wizard.tsx
```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
i
...
extends keyof EventWizardData>(key: K, value: EventWizardData[K]) => void
}) {
  return (
    <div cl
...
n>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

```

File: src/components/features/events/events-map.tsx
```tsx
'use client'

impor
...
n}
          mapSty
...
>
    </div>
  )
}

```

File: src/components/features/events/events-venues-map.tsx
```tsx
'use client'

import { useMemo, us
...
={`venue-${venue.id}`} longitude={
...
iv>
      </div>
    </div>
  )
}

```

File: src/components/features/events/index.ts
```typescript
expor
...

expo
...
ons'

```

File: src/components/features/events/upcoming-event-notifications.tsx
```tsx
import Li
...
         
...
d>
  )
}

```

File: src/components/features/explore/category-searcher.tsx
```tsx
'use client'

import { useState, useMemo 
...
sm text-muted-foreground hover:bg-accent"
...
;
        </p>
      )}
    </div>
  )
}

```

File: src/components/features/explore/explore-card.tsx
```tsx
'use client'

import { u
...
{cn(
              'abso
...
    </motion.div>
  )
}

```

File: src/components/features/explore/explore-client.tsx
```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutList,
  Locate,
  
...
el
                      filters={filters}
                      categories={categories}
                      totalResults={items.length}
                      onChange={handleFi
...
le="Quitar ubicacion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

```

File: src/components/features/explore/explore-filter-drawer.tsx
```tsx
'use client'

import {
...
s={{ top: 0, bottom: 0
...
nimatePresence>
  )
}

```

File: src/components/features/explore/explore-filters.tsx
```tsx
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
imp
...
     : 'text-muted-foreground hover:text-foreground'
                  )}
                >
              
...
 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

```

File: src/components/features/explore/explore-map-panel.tsx
```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl'
import type { MapRef, ViewStateChangeEvent } fro
...
s') return
    const map = mapRef.current?.getMap()
    if (!map) return

    const interactiveLayers = [CANVAS_CLUSTER_LAYER_ID, CANVAS_UNCLUSTERED_LAYER_ID].filter((layerId) =>
      Boolean(map.getLayer(layerId))
    )
    
...
bg-border" />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-coral" />
          Eventos
        </span>
      </div>
    </div>
  )
}

```

File: src/components/features/favorites/favorite-button.tsx
```tsx
'use client'
...
ta?.isFavori
...
tton>
  )
}

```

File: src/components/features/home/home-blog-section.tsx
```tsx
import
...
cking-
...
  )
}

```

File: src/components/features/home/home-blog-skeleton.tsx
```tsx
expo
...
gap-
...
)
}

```

File: src/components/features/home/home-categories-grid-section.tsx
```tsx
import
...
onst e
...
 />
}

```

File: src/components/features/home/home-categories-grid-skeleton.tsx
```tsx
ex
...
>

...
}

```

File: src/components/features/home/home-categories-grid.tsx
```tsx
'use client'

import 
...
ibold uppercase track
...
    </section>
  )
}

```

File: src/components/features/home/home-featured-events-section.tsx
```tsx
impo
...
 sta
...
>
}

```

File: src/components/features/home/home-featured-events-skeleton.tsx
```tsx
expo
...
    
...
)
}

```

File: src/components/features/home/home-featured-events.tsx
```tsx
'use client'

import { useState } from
...
h >= 3 ? featured : events.slice(0, 5)
...
nk>
      </div>
    </section>
  )
}

```

File: src/components/features/home/home-featured-venues-section.tsx
```tsx
impo
...
ge: 
...
>
}

```

File: src/components/features/home/home-featured-venues-skeleton.tsx
```tsx
expo
...
-y-3
...
)
}

```

File: src/components/features/home/home-featured-venues.tsx
```tsx
'use client'

impor
...
muted-foreground">

...
  </section>
  )
}

```

File: src/components/features/home/home-hero-map-section.tsx
```tsx
import { g
...
ent[] = ev
...
 />
  )
}

```

File: src/components/features/home/home-hero-map-skeleton.tsx
```tsx
expo
...
</di
...
)
}

```

File: src/components/features/home/home-hero-map.tsx
```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'n
...
                onClick={() => setQ('')}
                  aria-label="Limpiar búsqueda"
        
...
/button>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  )
}

```

File: src/components/features/home/home-latest-venues-section.tsx
```tsx
impo
...
: ve
...
>
}

```

File: src/components/features/home/home-latest-venues-skeleton.tsx
```tsx
exp
...
 cl
...

}

```

File: src/components/features/home/home-latest-venues.tsx
```tsx
'use client'

impor
...
     </div>
      <
...
  </section>
  )
}

```

File: src/components/features/home/home-promo-grid-section.tsx
```tsx
import {
...
e ?? nul
...
s} />
}

```

File: src/components/features/home/home-promo-grid-skeleton.tsx
```tsx
ex
...
ls
...
}

```

File: src/components/features/home/home-promo-grid.tsx
```tsx
'use client'

impor
...
/Link>
      </div>
...
  </section>
  )
}

```

File: src/components/features/home/home-related-events-section.tsx
```tsx
impo
...
star
...
>
}

```

File: src/components/features/home/home-related-events-skeleton.tsx
```tsx
exp
...
   
...

}

```

File: src/components/features/home/home-related-events.tsx
```tsx
'use client'

impor
...
e="flex items-cente
...
  </section>
  )
}

```

File: src/components/features/listing/listing-cta.tsx
```tsx
import Lin
...
parte del 
...
on>
  )
}

```

File: src/components/features/listing/listing-section.tsx
```tsx
'use client'

im
...
ta = await res.j
...
/section>
  )
}

```

File: src/components/features/listing/near-you-section.tsx
```tsx
'use client'

import { useCa
...
t-white transition-opacity h
...
</div>
    </section>
  )
}

```

File: src/components/features/map/location-picker-map.tsx
```tsx
'use client'

import
...
ground"
            
...
p>
    </div>
  )
}

```

File: src/components/features/map/mapbox-worker-setup.tsx
```tsx
'
...
o
...


```

File: src/components/features/media/media-url-input-simple.tsx
```tsx
'use client'

i
...
o subir el arch
...
  </div>
  )
}

```

File: src/components/features/media/media-url-input.tsx
```tsx
'use client'

...
lt.success ||
...
</div>
  )
}

```

File: src/components/features/notifications/notification-center.tsx
```tsx
'use clien
...
tems) {
  
...
rn null
}

```

File: src/components/features/notifications/notification-preferences-form.tsx
```tsx
'use client'

im
...
cias.')
      }

...
  </Form>
  )
}

```

File: src/components/features/qr/door-sticker-template.tsx
```tsx
'use client'
...
ht text-whit
...
/div>
  )
}

```

File: src/components/features/qr/qr-kit-generator.tsx
```tsx
'use client'

import { useC
...
rd p-6">
            <h2 cl
...
   </div>
    </div>
  )
}

```

File: src/components/features/rankings/ranking-card.tsx
```tsx
'use client'

imp
...
  {venue.name.cha
...
   </Link>
  )
}

```

File: src/components/features/rankings/ranking-list.tsx
```tsx
imp
...
xt-
...

}

```

File: src/components/features/rankings/venue-badge.tsx
```tsx
impo
...
 )}

...
)
}

```

File: src/components/features/reviews/admin-review-moderation.tsx
```tsx
'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter 
...
=== opt.value
                          ? 'bg-secondary text-foreground'
                          : 'border border-border/
...
             </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

```

File: src/components/features/search/command-palette.tsx
```tsx
'use client'

import { useEffect, useRef, useState, useCallback } 
...
/}
            <motion.div layout="position" className="max-h-[60v
...
      }
      >
        {badge}
      </span>
    </button>
  )
}

```

File: src/components/features/search/search-chips.tsx
```tsx
'use client'

imp
...
ntro',
    icon: 
...
    </div>
  )
}

```

File: src/components/features/settings/profile-form.tsx
```tsx
'use client'

import { useState, useRef, type ChangeEvent
...
        disabled={imageLoading}
                className
...
         </div>
        )}
      </div>
    </div>
  )
}

```

File: src/components/features/venues/admin-venue-moderation.tsx
```tsx
'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
i
...
       ))}
            </select>
          </div>

          <div className="relative
...
ertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/features/venues/amenities-section.tsx
```tsx
'use client
...
me.toLowerC
...
div>
  )
}

```

File: src/components/features/venues/index.ts
```typescript
expo
...
from
...
rd'

```

File: src/components/features/venues/location-hours-section.tsx
```tsx
'use client'

import { useMemo } from 're
...
         lng: venue.lng,
                
...
    </div>
      </div>
    </div>
  )
}

```

File: src/components/features/venues/products-display.tsx
```tsx
'use client'

...
  <div classN
...
</div>
  )
}

```

File: src/components/features/venues/venue-card.tsx
```tsx
'use client'

import Imag
...
  <div className="flex fl
...
</div>
    </Link>
  )
}

```

File: src/components/features/venues/venue-content.tsx
```tsx
'use cl
...
.toStri
...
} />
}

```

File: src/components/features/venues/venue-detail.tsx
```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays, Edit, ExternalL
...
dium text-foreground">Sobre este local</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-r
...
es[0]?.category.name}</p>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  )
}

```

File: src/components/features/venues/venue-edit-form.tsx
```tsx
'use client'

import { useState } from 're
...
put placeholder="Ej: Centro histórico de L
...
   </div>
      </form>
    </Form>
  )
}

```

File: src/components/features/venues/venue-empty-state.tsx
```tsx
impo
...
lass
...
)
}

```

File: src/components/features/venues/venue-filters-client.tsx
```tsx
'use client'

import
...
holder="Restaurantes
...
v>
    </div>
  )
}

```

File: src/components/features/venues/venue-filters.tsx
```tsx
import { Search
...
ground transiti
...
 </form>
  )
}

```

File: src/components/features/venues/venue-form-text-sections.tsx
```tsx
import 
...
field}

...

  )
}

```

File: src/components/features/venues/venue-form.tsx
```tsx
'use client'

import { useState } from 'react'
i
...
     <SelectItem value="$">$ - Económico</Select
...

        </div>
      </form>
    </Form>
  )
}

```

File: src/components/features/venues/venue-grid-animated.tsx
```tsx
'use 
...
onst

...
 )
}

```

File: src/components/features/venues/venue-grid.tsx
```tsx
i
...
u
...


```

File: src/components/features/venues/venue-share-button.tsx
```tsx
'us
...
)
 
...

}

```

File: src/components/features/venues/venue-wizard.tsx
```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wizard, type WizardStep } from '@/components/wizard'
import { WizardTooltip } 
...
-3">
        <h3 className="text-sm font-semibold">Servicios disponibles</h3>
        <p className="text-xs text-muted-foreground">
          Selecciona los servicios que ofrece tu local.
        </p>
        <div className="flex f
...
           <span className="text-xs font-semibold">${parseFloat(p.price).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```

File: src/components/features/venues/venues-map.tsx
```tsx
'use client'

impo
...
-[360px] overflow-
...

    </div>
  )
}

```

File: src/components/layout/app-sidebar.tsx
```tsx
'use client'

import { useState } from 'react'
import 
...
="relative flex h-full shrink-0 flex-col overflow-hidd
...

        )}
      </button>
    </motion.aside>
  )
}

```

File: src/components/layout/index.ts
```typescript
 
```

File: src/components/layout/page-transition.tsx
```tsx
'u
...
  
...
}

```

File: src/components/layout/site-footer.tsx
```tsx
import Link
...
 <div class
...
ter>
  )
}

```

File: src/components/layout/site-header.tsx
```tsx
'use client'

import { useState, useE
...
ch className="h-3.5 w-3.5" />
       
...
    </AnimatePresence>
    </>
  )
}

```

File: src/components/media/media-gallery.tsx
```tsx
'use client'

import {
...
 top-2 right-2">
     
...
     )}
    </>
  )
}

```

File: src/components/media/media-manager.tsx
```tsx
'use client'

import { useState, useCallback } from 'reac
...
uted-foreground">No hay imagen de portada</p>
           
...
lertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/media/media-uploader.tsx
```tsx
'use client'

import 
...
UrlInput('')
  }

  r
...
/p>
    </div>
  )
}

```

File: src/components/menu/menu-display-v2.tsx
```tsx
'use client'


...
    <div class
...
 </div>
  )
}

```

File: src/components/menu/menu-display.tsx
```tsx
'use cl
...
     <d
...

  )
}

```

File: src/components/menu/menu-manager-v2.tsx
```tsx
'use client'

import { useState } from 'react'
import { Button } from
...
   <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick=
...
-4" /> Agregar categoría
        </Button>
      )}
    </div>
  )
}

```

File: src/components/menu/menu-manager.tsx
```tsx
'use client'

import { useState } f
...
  } catch { toast.error('Error ines
...
/Button>
      )}
    </div>
  )
}

```

File: src/components/messaging/inbox.tsx
```tsx
'use client'

import { useState 
...
 <AvatarImage src={conversation.
...
}
      </div>
    </div>
  )
}

```

File: src/components/messaging/message-thread.tsx
```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
i
...
        Mensaje eliminado
                      </div>
            
...
       </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

File: src/components/messaging/message-venue-button.tsx
```tsx
'use client'

i
...

        <Messa
...

    </>
  )
}

```

File: src/components/newsletter/newsletter-form.tsx
```tsx
'use client
...
<p classNam
...
orm>
  )
}

```

File: src/components/operating-hours/operating-hours-display.tsx
```tsx
'use client'

i
...
ction OpenStatu
...
  </div>
  )
}

```

File: src/components/operating-hours/operating-hours-form.tsx
```tsx
'use client'

i
...
   fri: form.fr
...
 </form>
  )
}

```

File: src/components/operating-hours/special-hours-manager.tsx
```tsx
'use client'

import { u
...
         {showForm ? 'Ca
...
    )}
    </div>
  )
}

```

File: src/components/promotion/promotion-card.tsx
```tsx
'use clie
...
  <div>
 
...
v>
  )
}

```

File: src/components/promotion/promotion-form.tsx
```tsx
'use client'

impo
...
Descripción</Label
...
    </form>
  )
}

```

File: src/components/providers/lazy-globals.tsx
```tsx
'u
...
dy
...
}

```

File: src/components/providers/query-provider.tsx
```tsx
'us
...
ien
...

}

```

File: src/components/providers/service-worker-register.tsx
```tsx
'use cli
...
on = awa
...
 null
}

```

File: src/components/qa/question-section.tsx
```tsx
'use client'

import { useState 
...
  placeholder="¿Tienes una pregu
...
/div>
      )}
    </div>
  )
}

```

File: src/components/reservation/reservation-form.tsx
```tsx
'use client'


...
ing(false)
   
...
</form>
  )
}

```

File: src/components/reservation/reservation-settings-form.tsx
```tsx
'use client'

import
...
<Label>Apertura</Lab
...
>
    </form>
  )
}

```

File: src/components/review/owner-reply.tsx
```tsx
'use client'

...
erald-200 bg-
...
</div>
  )
}

```

File: src/components/review/review-form.tsx
```tsx
'use client'

import { useState, u
...
t} className="space-y-4">
      {/
...
      </Button>
    </form>
  )
}

```

File: src/components/review/review-list.tsx
```tsx
'use client'

import
...
Fallback>{review.use
...
)}
    </div>
  )
}

```

File: src/components/review/star-rating.tsx
```tsx
'use client'


...
 rating: numbe
...
 </div>
  )
}

```

File: src/components/route/route-card.tsx
```tsx
'use client'


...
ull object-cov
...
</Link>
  )
}

```

File: src/components/route/route-detail.tsx
```tsx
'use client'

impor
...
        <div classN
...
>
    </div>
  )
}

```

File: src/components/route/route-form.tsx
```tsx
'use client'

import { useState } fr
...
mLabel>
              <FormControl><
...
iv>
      </form>
    </Form>
  )
}

```

File: src/components/services/services-display.tsx
```tsx
'use
...
iv c
...
)
}

```

File: src/components/services/services-editor.tsx
```tsx
'use client'

import { useState } from 'rea
...
loading}
                />
              <
...
>
        )}
      </div>
    </div>
  )
}

```

File: src/components/share/share-button.tsx
```tsx
'use client'

import { useState
...
item.fb && !item.x && !item.tg)
...
matePresence>
    </div>
  )
}

```

File: src/components/theme/theme-toggle.tsx
```tsx
'use client'
...
eme === 'dar
...
tton>
  )
}

```

File: src/components/theme/use-map-theme-style.ts
```typescript
'use cl
...
  setTh
...
de])
}

```

File: src/components/ui/alert-dialog.tsx
```tsx
"use client"

import
...
t AlertDialogFooter 
...
lertDialogCancel,
}

```

File: src/components/ui/alert.tsx
```tsx
import 
...
<div
  
...
tion }

```

File: src/components/ui/avatar.tsx
```tsx
'use c
...
lassNa
...
ack }

```

File: src/components/ui/badge.tsx
```tsx
impor
...
over:
...
ts }

```

File: src/components/ui/button.tsx
```tsx
import * 
...
        '
...
riants }

```

File: src/components/ui/calendar.tsx
```tsx
"use client
...
t-2",
     
...
Calendar }

```

File: src/components/ui/card.tsx
```tsx
import * 
...
itle.disp
...
ontent }

```

File: src/components/ui/category-gradient-bg.tsx
```tsx
import { cn } from '@/lib/utils'


...
333ea', via: '#7c3aed', to: '#6d28
...
</span>
      )}
    </div>
  )
}

```

File: src/components/ui/category-icon-fallback.tsx
```tsx
imp
...
l',
...

}

```

File: src/components/ui/checkbox.tsx
```tsx
"use
...
none
...
x }

```

File: src/components/ui/dialog.tsx
```tsx
"use client"

imp
...
:outline-none foc
...
ogDescription,
}

```

File: src/components/ui/dropdown-menu.tsx
```tsx
'use client'

import * a
...
r justify-center">
     
...
DropdownMenuShortcut,
}

```

File: src/components/ui/form.tsx
```tsx
"use client"

import
...
mItemContext.Provide
...
age,
  FormField,
}

```

File: src/components/ui/getting-there-section.tsx
```tsx
impor
...
ded-2
...
 )
}

```

File: src/components/ui/image-upload.tsx
```tsx
'use client'

import
...
.startsWith('http'))
...
/>
    </div>
  )
}

```

File: src/components/ui/input.tsx
```tsx
impo
...
65)]
...
t }

```

File: src/components/ui/label.tsx
```tsx
"us
...
 Re
...
 }

```

File: src/components/ui/motion.tsx
```tsx
'use cl
...
city: 0
...
px',
}

```

File: src/components/ui/popover.tsx
```tsx
"use 
...
w-72 
...
nt }

```

File: src/components/ui/progress.tsx
```tsx
'use
...
"
  
...
s }

```

File: src/components/ui/scroll-lock-fix.tsx
```tsx
'u
...
.r
...
}

```

File: src/components/ui/select.tsx
```tsx
"use client"

import * as
...
eground",
        "shadow
...
electScrollDownButton,
}

```

File: src/components/ui/separator.tsx
```tsx
"us
...
 re
...
 }

```

File: src/components/ui/skeleton.tsx
```tsx
im
...
fo
...
}

```

File: src/components/ui/sonner.tsx
```tsx
"u
...
p-
...
}

```

File: src/components/ui/switch.tsx
```tsx
'use c
...
tems-c
...
tch }

```

File: src/components/ui/textarea.tsx
```tsx
imp
...
npu
...
 }

```

File: src/components/ui/time-picker.tsx
```tsx
'use client'

impor
...
    <button
       
...
  )}
    </>
  )
}

```

File: src/components/ui/transport-button.tsx
```tsx
import 
...
(
     
...

  )
}

```

File: src/components/ui/uber-icon.tsx
```tsx
imp
...

  
...

}

```

File: src/components/user/user-level-badge.tsx
```tsx
'use 
...
',
  
...
 )
}

```

HyDE objective:
- Hallucinate a plausible operator/runbook style guide for this in-scope project.

Output format:
- Produce a single markdown document with plausible operational documentation

Guidelines:
- Prefer “how to run this end-to-end” content over API reference:
  - Quickstart / local run path
  - Configuration (env vars, config files) only when strongly suggested by names/content
  - Common workflows / recipes (3–6)
  - Troubleshooting / common failure modes
- Be explicit about uncertainty; don’t invent exact command flags or env var names unless the repo strongly suggests them

HyDE objective (override for Code Mapper):
- Ignore any earlier 'HyDE objective' and 'Output format' instructions in the scope prompt.
- Instead of writing a full documentation, do a concise planning pass for deep code research.
- Identify up to 2 points of interest for this scoped project. Prioritize the most important operational workflows (setup, local run, troubleshooting) first, but you may include slightly less critical topics to use the full budget when appropriate.

Output format:
- Produce ONLY a numbered markdown list (1., 2., 3., ...).
- Each item MUST follow this exact shape:
  - `N. **Short Title** — 1–2 sentences. Key files: `path`, `path` (optional).`
- Requirements for `**Short Title**`:
  - 3–8 words (max 60 characters).
  - MUST be human-readable and general (no file paths, no module names-as-titles).
  - MUST NOT include backticks, parentheses, slashes, or file extensions like `.py`.
- If you include key files:
  - Put them after the 1–2 sentence summary as `Key files: ...`.
  - Use backticks around each path and include at most 3 files.
- Do not include any other sections or prose; just the numbered list.
