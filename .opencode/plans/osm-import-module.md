# Plan: Modulo de Importaciones OSM

## Contexto

El proyecto **Vive Loja** es una plataforma tipo Yelp/TripAdvisor para la ciudad de Loja, Ecuador. Ya tiene un sistema de importacion desde Google Places (`/admin/import`). Se necesita crear un modulo paralelo para importar lugares desde **OpenStreetMap** via **Overpass API**, accesible desde `/admin/osm-imports`.

**Restricciones**: No modificar frontend publico, no eliminar componentes existentes, no modificar animaciones Framer Motion, mantener sistema de diseno actual.

---

## Fase 1: Base de Datos

### 1.1 Actualizar `prisma/schema.prisma`

Agregar campo `osmId` al modelo `Venue`:
```prisma
osmId String? @unique
```
Agregar indice: `@@index([osmId])`

Agregar relacion en modelo `User`:
```prisma
osmImports OsmImport[]
```

### 1.2 Nuevos modelos

**OsmImport** - Registro de cada importacion realizada:
- `id`, `city`, `country`, `categories` (JSON string), `radius` (Int, metros)
- `status` (PENDING | RUNNING | COMPLETED | FAILED)
- `foundCount`, `importedCount`, `duplicateCount`, `errorCount`
- `queryOverpass` (query ejecutada), `errorMessage`
- `createdBy` (FK -> User), `createdAt`, `updatedAt`
- Relaciones: `logs OsmImportLog[]`, `jobs OsmSyncJob[]`
- Indices: `status`, `createdAt`, `createdBy`

**OsmImportLog** - Logs detallados por importacion:
- `id`, `importId` (FK -> OsmImport), `message`, `level` (INFO | WARNING | ERROR)
- `metadata` (JSON string), `createdAt`
- Indices: `importId`, `level`, `createdAt`

**OsmSyncJob** - Cola de trabajos de sincronizacion:
- `id`, `importId` (FK -> OsmImport, nullable)
- `type` (FULL | INCREMENTAL | UPDATE)
- `status` (PENDING | RUNNING | COMPLETED | FAILED | PAUSED)
- `progress` (Int 0-100), `total`, `processed`
- `startedAt`, `finishedAt`, `errorMessage`
- `createdAt`, `updatedAt`
- Indices: `status`, `importId`, `createdAt`

**OsmConfig** - Configuracion singleton:
- `id`, `overpassUrl` (default: `https://overpass-api.de/api/interpreter`)
- `timeout` (default: 30s), `maxResults` (default: 1000)
- `delayBetween` (default: 1000ms), `userAgent` (default: `ViveLoja/1.0`)
- `syncFrequency` (DAILY | WEEKLY | MONTHLY, nullable)
- `syncEnabled` (Boolean, default: false), `updatedAt`

### 1.3 Migracion

Ejecutar: `npx prisma migrate dev --name add_osm_import_tables`

---

## Fase 2: Tipos y Esquemas

### 2.1 `src/types/osm-import.ts`

```typescript
export interface OsmPlace {
  id: string;           // OSM ID (node/way/relation)
  type: 'node' | 'way' | 'relation';
  name: string;
  category: string;     // Categoria mapeada (restaurant, cafe, etc.)
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OsmImportStats {
  totalImports: number;
  totalVenues: number;
  lastImport?: Date;
  pendingReview: number;
  activeVenues: number;
  disabledVenues: number;
  importsToday: number;
  importsThisWeek: number;
  newPlacesDetected: number;
  duplicatesFound: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingVenue?: { id: string; name: string; slug: string };
  similarity: number;
  matchType: 'osm_id' | 'name_location' | 'website' | 'phone' | 'none';
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
```

### 2.2 `src/schemas/osm-import.ts`

Esquemas Zod para:
- `OsmSearchSchema` (city, country, radius, categories)
- `OsmConfigSchema` (overpassUrl, timeout, maxResults, delayBetween, userAgent, syncFrequency, syncEnabled)
- `OsmBulkImportSchema` (places[], categoryId, options)

---

## Fase 3: Servicios OSM

### 3.1 `src/lib/osm/overpass-service.ts`

Clase singleton `OverpassService`:

| Metodo | Descripcion |
|--------|-------------|
| `buildQuery(params)` | Construye query Overpass QL con area, categorias y radio |
| `searchPlaces(params)` | Ejecuta query y retorna resultados parseados |
| `parseResults(data)` | Convierte elementos Overpass a `OsmPlace[]` |
| `geocodeCity(city, country)` | Obtiene coordenadas de una ciudad via Nominatim |

**Categorias OSM mapeadas**:
```
restaurant  -> amenity=restaurant
cafe        -> amenity=cafe
hotel       -> tourism=hotel
bar         -> amenity=bar
pharmacy    -> amenity=pharmacy
hospital    -> amenity=hospital
gym         -> leisure=fitness_center
bank        -> amenity=bank
supermarket -> shop=supermarket
school      -> amenity=school
mall        -> shop=mall
gas_station -> amenity=fuel
```

**Query Overpass ejemplo**:
```
[out:json][timeout:30];
area["name"="Loja"]["admin_level"="7"]->.searchArea;
(
  node["amenity"="restaurant"](area.searchArea);
  way["amenity"="restaurant"](area.searchArea);
);
out center;
```

### 3.2 `src/lib/osm/import-service.ts`

Clase singleton `ImportService`:

| Metodo | Descripcion |
|--------|-------------|
| `validatePlace(place)` | Valida datos minimos (nombre, coordenadas) |
| `checkDuplicate(place)` | Detecta duplicados por osmId, nombre+coords, website, telefono |
| `createPlace(place, categoryId, userId)` | Crea Venue desde OsmPlace |
| `updatePlace(venueId, place)` | Actualiza Venue existente con datos OSM |
| `mergePlaces(existingId, newPlace)` | Fusiona datos del nuevo con existente |
| `bulkImport(places, categoryId, userId, options)` | Importacion masiva con batch processing |

**Logica de duplicados** (por prioridad):
1. Match por `osmId` exacto -> Duplicado seguro
2. Match por nombre normalizado + distancia < 50m -> Duplicado probable
3. Match por website exacto -> Duplicado probable
4. Match por telefono normalizado -> Duplicado posible

### 3.3 `src/lib/osm/sync-service.ts`

Clase singleton `SyncService`:

| Metodo | Descripcion |
|--------|-------------|
| `syncPlace(venueId)` | Re-descarga lugar desde OSM y compara |
| `syncBatch(venueIds)` | Sincroniza lote de lugares |
| `markRemovedPlaces(importId)` | Marca venues cuyo osmId ya no existe en OSM |
| `createSyncJob(type)` | Crea job en OsmSyncJob |
| `executeSyncJob(jobId)` | Ejecuta job actualizando progreso |
| `pauseJob/resumeJob/cancelJob` | Control de jobs |

---

## Fase 4: API Routes

### 4.1 `POST /api/admin/osm-import/search`
- Recibe: `{ city, country, radius, categories }`
- Geocodifica ciudad -> coordenadas
- Construye y ejecuta query Overpass
- Verifica duplicados contra DB
- Retorna: `{ places[], duplicates[], total }`

### 4.2 `POST /api/admin/osm-import/import`
- Recibe: `{ place, categoryId, importOptions }`
- Verifica auth ADMIN
- Check duplicados
- Crea/actualiza Venue
- Retorna: `{ venue, action: 'created' | 'updated' | 'skipped' }`

### 4.3 `POST /api/admin/osm-import/bulk-import`
- Recibe: `{ places[], categoryId, options, importId }`
- Procesa en lotes (batchSize configurable)
- Actualiza contadores en OsmImport
- Registra logs en OsmImportLog
- Retorna: `{ stats, results[] }`

### 4.4 `GET /api/admin/osm-import/history`
- Query params: `page`, `limit`, `status`
- Retorna lista paginada de OsmImport con relaciones

### 4.5 `DELETE /api/admin/osm-import/history/[id]`
- Elimina registro de importacion (no los venues)

### 4.6 `POST /api/admin/osm-import/sync`
- Recibe: `{ type: 'FULL' | 'INCREMENTAL', importId? }`
- Crea OsmSyncJob
- Ejecuta sincronizacion
- Retorna: `{ jobId, status }`

### 4.7 `GET/PUT /api/admin/osm-import/config`
- GET: Retorna OsmConfig actual (crea si no existe)
- PUT: Actualiza configuracion

### 4.8 `GET /api/admin/osm-import/stats`
- Retorna estadisticas del dashboard (counts, graficos)

---

## Fase 5: Server Actions

Crear `src/actions/osm-imports/`:

| Archivo | Funciones |
|---------|-----------|
| `create-import.ts` | `createOsmImport(data)` - Crea registro OsmImport |
| `update-import.ts` | `updateOsmImport(id, data)` - Actualiza estado/contadores |
| `get-imports.ts` | `getOsmImports(filters)`, `getOsmImportById(id)`, `getOsmImportStats()` |
| `delete-import.ts` | `deleteOsmImport(id)` - Elimina registro |
| `index.ts` | Barrel export |

Todas verifican `session.user.role === 'ADMIN'`.

---

## Fase 6: Componentes UI

Todos en `src/components/features/admin/osm/`.

### 6.1 `osm-imports-dashboard.tsx`
- Grid de stat cards (8 widgets) usando Card/CardHeader/CardContent
- Iconos: lucide-react (MapPin, Download, CheckCircle, XCircle, Clock, TrendingUp)
- Colores: coral para nuevos, emerald para activos, primary para totales
- Badge de estado para cada stat

### 6.2 `osm-import-form.tsx`
- Form con react-hook-form + zodResolver
- Campos: ciudad (input), pais (select), radio (slider 100-10000m)
- Checkboxes de categorias en grid 3 columnas con iconos
- Boton "Buscar lugares" con estado de carga
- Usa: Card, Input, Select, Checkbox, Button, Label

### 6.3 `osm-preview-table.tsx`
- Tabla con columnas: checkbox, nombre, categoria (Badge), direccion, telefono, website, coords, estado (Badge)
- Paginacion (20 items/pagina)
- Botones: "Seleccionar todos", "Importar seleccionados", "Importar todo", "Cancelar"
- Estados: Nuevo (emerald), Duplicado (coral), Error (destructive)
- Barra de progreso durante importacion

### 6.4 `osm-duplicate-modal.tsx`
- Dialog (Radix) con comparacion lado a lado
- Muestra: nombre, direccion, telefono, website, coordenadas
- Porcentaje de similitud
- Botones: "Omitir", "Actualizar", "Fusionar"

### 6.5 `osm-history-table.tsx`
- Tabla con columnas: fecha, ciudad, categorias (badges), encontrados, importados, duplicados, errores, usuario, estado
- Acciones por fila: ver detalle, repetir, eliminar
- Filtros: rango de fechas, estado, ciudad
- Paginacion

### 6.6 `osm-queue-table.tsx`
- Tabla con columnas: ID, tipo, estado (Badge), progreso (progress bar), tiempo, procesados/total
- Acciones: pausar, reanudar, cancelar
- Auto-refresh cada 5 segundos (polling)
- Estados: Pending (muted), Running (primary), Completed (emerald), Failed (destructive), Paused (secondary)

### 6.7 `osm-config-form.tsx`
- Form con campos: URL Overpass, timeout, maxResults, delay, userAgent
- Select para frecuencia de sincronizacion
- Switch para habilitar/deshabilitar sync automatico
- Boton "Guardar" y "Probar conexion"
- Validacion con Zod

---

## Fase 7: Paginas Admin

### 7.1 Layout con Tabs

La pagina principal `/admin/osm-imports/page.tsx` tendra un sistema de tabs:

```
[Dashboard] [Nueva Importacion] [Historial] [Cola] [Configuracion]
```

Cada tab renderiza el componente correspondiente. Usar `useSearchParams` o estado local para navegacion entre tabs (sin cambiar de ruta para mantener velocidad, o usar rutas anidadas si se prefiere).

**Decision**: Usar rutas separadas para cada tab (mejor para bookmarks y navegacion directa):
- `/admin/osm-imports` -> Dashboard
- `/admin/osm-imports/nueva-importacion` -> Formulario + Preview
- `/admin/osm-imports/historial` -> Tabla historial
- `/admin/osm-imports/cola` -> Cola de jobs
- `/admin/osm-imports/configuracion` -> Config

### 7.2 Estructura de cada pagina

Cada pagina sigue el patron existente:
1. Verificar sesion ADMIN (server-side)
2. Cargar datos iniciales (server components)
3. Renderizar componente cliente con datos

---

## Fase 8: Sidebar

Agregar a `ADMIN_NAV` en `src/components/layout/app-sidebar.tsx`:

```typescript
{ href: '/admin/osm-imports', label: 'Importaciones OSM', icon: Globe, adminOnly: true }
```

Importar `Globe` de `lucide-react`.

---

## Orden de Implementacion

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Schema Prisma + migracion | `prisma/schema.prisma` |
| 2 | Tipos TypeScript | `src/types/osm-import.ts` |
| 3 | Esquemas Zod | `src/schemas/osm-import.ts` |
| 4 | Servicio Overpass | `src/lib/osm/overpass-service.ts` |
| 5 | Servicio Import | `src/lib/osm/import-service.ts` |
| 6 | Servicio Sync | `src/lib/osm/sync-service.ts` |
| 7 | API Routes (6 endpoints) | `src/app/api/admin/osm-import/*/route.ts` |
| 8 | Server Actions | `src/actions/osm-imports/*.ts` |
| 9 | Componente: Dashboard | `src/components/features/admin/osm/osm-imports-dashboard.tsx` |
| 10 | Componente: Form | `src/components/features/admin/osm/osm-import-form.tsx` |
| 11 | Componente: Preview Table | `src/components/features/admin/osm/osm-preview-table.tsx` |
| 12 | Componente: Duplicate Modal | `src/components/features/admin/osm/osm-duplicate-modal.tsx` |
| 13 | Componente: History Table | `src/components/features/admin/osm/osm-history-table.tsx` |
| 14 | Componente: Queue Table | `src/components/features/admin/osm/osm-queue-table.tsx` |
| 15 | Componente: Config Form | `src/components/features/admin/osm/osm-config-form.tsx` |
| 16 | Paginas Admin (5 paginas) | `src/app/admin/osm-imports/*/page.tsx` |
| 17 | Actualizar Sidebar | `src/components/layout/app-sidebar.tsx` |
| 18 | Pruebas y verificacion | Build + lint |

---

## Consideraciones Clave

- **Overpass API**: No requiere API key, pero tiene rate limits. Implementar delay configurable entre consultas.
- **Geocodificacion**: Usar Nominatim (`https://nominatim.openstreetmap.org/search`) para convertir ciudad -> coordenadas.
- **Duplicados**: La estrategia de comparacion por coordenadas usa distancia Haversine con umbral de 50 metros.
- **Escalabilidad**: El bulk import procesa en lotes de 20 para no saturar la API ni la DB.
- **Toasts**: Usar `sonner` (ya instalado) para todas las notificaciones.
- **Iconos**: Usar `lucide-react` (ya instalado).
- **UI Components**: Reutilizar Button, Card, Input, Select, Checkbox, Badge, Label, Separator, Alert de `src/components/ui/`.
