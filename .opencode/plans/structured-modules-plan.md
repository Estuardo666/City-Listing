# Plan de Implementación: Horarios, Servicios y Menú Estructurados

## Resumen Ejecutivo

Transformar los módulos de horarios, servicios y menú de campos de texto libre a estructuras de datos relacionales con UI dedicada, validaciones robustas y visualización pública optimizada.

---

## Estado Actual

### Horarios
- **Modelo**: `OperatingHours` con campos string (mon, tue, wed...)
- **Formato**: "HH:MM-HH:MM" o "HH:MM-HH:MM,HH:MM-HH:MM" para horarios partidos
- **Limitación**: No permite múltiples franjas reales, solo simulación con comas

### Servicios
- **Estado**: No existe
- **Necesidad**: Crear desde cero

### Menú
- **Modelo**: `MenuCategory` + `MenuItem` (ya estructurado)
- **Limitaciones**: Falta drag-and-drop, edición inline, toggle disponibilidad visible

---

## FASE 1: HORARIOS ESTRUCTURADOS

### 1.1 Base de Datos

**Nuevo modelo: `VenueBusinessHours`**

```prisma
model VenueBusinessHours {
  id         String   @id @default(cuid())
  venueId    String
  dayOfWeek  Int      // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  openTime   String   // Formato "HH:MM"
  closeTime  String   // Formato "HH:MM"
  isClosed   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId])
  @@index([venueId, dayOfWeek])
}
```

**Migración de datos:**
- Script para convertir `OperatingHours` existente a `VenueBusinessHours`
- Parsear strings "HH:MM-HH:MM" y "HH:MM-HH:MM,HH:MM-HH:MM"
- Crear registros individuales por cada franja horaria

**Eliminar modelo antiguo:**
- Después de migración exitosa, deprecar `OperatingHours`

### 1.2 Backend - Server Actions

**Archivo**: `src/actions/business-hours/manage-hours.ts`

```typescript
// Acciones a implementar:
- upsertBusinessHoursAction(venueId, dayOfWeek, openTime, closeTime)
- deleteBusinessHoursAction(id)
- setDayClosedAction(venueId, dayOfWeek, isClosed)
- duplicateDayScheduleAction(venueId, fromDay, toDays[])
- getBusinessHoursAction(venueId)
```

**Validaciones:**
- `openTime < closeTime`
- No solapamiento de horarios en el mismo día
- Formato "HH:MM" válido
- `dayOfWeek` entre 0-6

### 1.3 Backend - Dashboard UI

**Nueva página**: `/dashboard/locales/[slug]/horarios`

**Componente**: `src/components/business-hours/business-hours-editor.tsx`

**UI inspirada en Google Business Profile:**

```
┌─────────────────────────────────────────────────────────────┐
│  Horarios de atención                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Lunes                                                       │
│  ☐ Cerrado todo el día                                      │
│  ┌─────────────┐  ┌─────────────┐         ┌───┐            │
│  │ 09:00       │  │ 13:00       │  +      │ 🗑 │            │
│  └─────────────┘  └─────────────┘         └───┘            │
│  ┌─────────────┐  ┌─────────────┐         ┌───┐            │
│  │ 15:00       │  │ 22:00       │  +      │ 🗑 │            │
│  └─────────────┘  └─────────────┘         └───┘            │
│  [+ Agregar horario]  [Copiar a otros días →]               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Martes                                                      │
│  ☐ Cerrado todo el día                                      │
│  ...                                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Por cada día: checkbox "Cerrado", lista de franjas horarias
- Cada franja: input hora apertura, input hora cierre, botón eliminar
- Botón "Agregar horario" para añadir franjas adicionales
- Botón "Copiar a otros días" con selector múltiple
- Validación en tiempo real de solapamientos

### 1.4 Frontend - Visualización Pública

**Componente actualizado**: `src/components/business-hours/business-hours-display.tsx`

**Estado en tiempo real:**
```
🟢 Abierto ahora
⏰ Cierra a las 22:00

Lunes      09:00 - 13:00, 15:00 - 22:00
Martes     09:00 - 18:00
Miércoles  Cerrado
...
```

**Lógica:**
- Calcular si está abierto según hora actual
- Mostrar próxima hora de cierre si está abierto
- Mostrar próxima hora de apertura si está cerrado
- Resaltar día actual

---

## FASE 2: SERVICIOS

### 2.1 Base de Datos

**Nuevo modelo: `VenueService`**

```prisma
model VenueService {
  id          String   @id @default(cuid())
  venueId     String
  name        String
  description String?
  icon        String?  // Emoji o nombre de icono
  isCustom    Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId])
  @@unique([venueId, name])
}
```

**Catálogo predefinido (constante en código):**

```typescript
export const PREDEFINED_SERVICES = [
  { name: 'WiFi', icon: '📶', description: 'Internet inalámbrico gratuito' },
  { name: 'Parqueadero', icon: '🚗', description: 'Estacionamiento disponible' },
  { name: 'Delivery', icon: '🛵', description: 'Servicio a domicilio' },
  { name: 'Para llevar', icon: '🥡', description: 'Pedidos para llevar' },
  { name: 'Pet Friendly', icon: '🐶', description: 'Mascotas bienvenidas' },
  { name: 'Terraza', icon: '☂️', description: 'Área exterior' },
  { name: 'Reservaciones', icon: '📅', description: 'Acepta reservas' },
  { name: 'Pago con tarjeta', icon: '💳', description: 'Acepta tarjetas' },
  { name: 'Aire acondicionado', icon: '❄️', description: 'Climatización' },
  { name: 'Acceso discapacitados', icon: '♿', description: 'Accesible' },
  { name: 'Música en vivo', icon: '🎵', description: 'Entretenimiento' },
  { name: 'Barra', icon: '🍸', description: 'Servicio de bar' },
  { name: 'Desayunos', icon: '🥐', description: 'Menú de desayuno' },
  { name: 'Vegetariano', icon: '🥗', description: 'Opciones vegetarianas' },
  { name: 'Vegano', icon: '🌱', description: 'Opciones veganas' },
  { name: 'Sin gluten', icon: '🌾', description: 'Opciones sin gluten' },
]
```

### 2.2 Backend - Server Actions

**Archivo**: `src/actions/services/manage-services.ts`

```typescript
// Acciones a implementar:
- togglePredefinedServiceAction(venueId, serviceName)
- addCustomServiceAction(venueId, name, description?, icon?)
- updateCustomServiceAction(id, name?, description?, icon?)
- deleteServiceAction(id)
- reorderServicesAction(venueId, serviceIds[])
- getVenueServicesAction(venueId)
```

### 2.3 Backend - Dashboard UI

**Nueva página**: `/dashboard/locales/[slug]/servicios`

**Componente**: `src/components/services/services-editor.tsx`

**UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  Servicios                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Servicios disponibles                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📶 WiFi                                    [✓]      │   │
│  │ 🚗 Parqueadero                             [✓]      │   │
│  │ 🛵 Delivery                                [ ]      │   │
│  │ 🐶 Pet Friendly                            [ ]      │   │
│  │ ☂️ Terraza                                 [✓]      │   │
│  │ 💳 Pago con tarjeta                        [✓]      │   │
│  │ ❄️ Aire acondicionado                      [ ]      │   │
│  │ ♿ Acceso discapacitados                    [ ]      │   │
│  │ ...más                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Servicios personalizados                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🎸 Karaoke                               [editar]  │   │
│  │ 🎂 Pasteles personalizados               [editar]  │   │
│  └──────────────────────────────────────────────────────┘   │
│  [+ Agregar servicio personalizado]                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Frontend - Visualización Pública

**Componente**: `src/components/services/services-display.tsx`

**UI en página pública:**

```
┌─────────────────────────────────────────────────────────────┐
│  Servicios                                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │   📶    │ │   🚗    │ │   ☂️    │ │   💳    │          │
│  │  WiFi   │ │Parquead.│ │ Terraza │ │ Tarjeta │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Diseño:**
- Grid responsive (2-4 columnas según pantalla)
- Iconos grandes con label debajo
- Solo mostrar servicios activos

---

## FASE 3: MENÚ MEJORADO

### 3.1 Base de Datos

**Mantener modelos existentes:**
- `MenuCategory` (ya tiene: id, name, order, venueId)
- `MenuItem` (ya tiene: id, name, description, price, image, order, isAvailable, menuCategoryId)

**Mejoras necesarias:**
- Agregar campo `isFeatured` a MenuItem (para destacar productos)
- Agregar campo `allergens` a MenuItem (texto JSON con alérgenos)

### 3.2 Backend - Server Actions

**Archivo existente**: `src/actions/menu/manage-menu.ts`

**Nuevas acciones:**
```typescript
- updateMenuCategoryAction(id, name, order)
- reorderCategoriesAction(venueId, categoryIds[])
- reorderItemsAction(categoryId, itemIds[])
- toggleItemAvailabilityAction(id)
- updateMenuItemImageAction(id, imageUrl)
```

### 3.3 Backend - Dashboard UI

**Página existente**: `/dashboard/locales/[slug]/menu`

**Restricción**: Solo visible para categorías gastronómicas
- Restaurantes
- Bares
- Cafeterías

**Componente mejorado**: `src/components/menu/menu-manager-v2.tsx`

**UI mejorada:**

```
┌─────────────────────────────────────────────────────────────┐
│  Menú                                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ≡ Entradas                                          [🗑]   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ≡ Ceviche Mixto                           $8.50  [✓] │   │
│  │   Ceviche de pescado con limón y cilantro            │   │
│  │   [📷 Imagen]  [Editar]  [Disponible]                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ≡ Empanadas                               $2.00  [✓] │   │
│  │   Empanadas de carne o queso                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  [+ Agregar producto]                                        │
│                                                              │
│  ≡ Bebidas                                           [🗑]   │
│  ...                                                         │
│                                                              │
│  [+ Agregar categoría]                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Drag & drop para reordenar categorías
- Drag & drop para reordenar items dentro de categoría
- Toggle de disponibilidad inline
- Upload de imagen por producto
- Edición inline de nombre, descripción, precio
- Botón para destacar producto

**Librería recomendada**: `@dnd-kit/core` + `@dnd-kit/sortable`

### 3.4 Frontend - Visualización Pública

**Componente mejorado**: `src/components/menu/menu-display-v2.tsx`

**UI mejorada:**

```
┌─────────────────────────────────────────────────────────────┐
│  🍽️ Menú                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ENTRADAS                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ┌─────┐                                               │  │
│  │ │ IMG │ Ceviche Mixto                        $8.50    │  │
│  │ └─────┘ Ceviche de pescado con limón y cilantro      │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ┌─────┐                                               │  │
│  │ │ IMG │ Empanadas                            $2.00    │  │
│  │ └─────┘ Empanadas de carne o queso                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  BEBIDAS                                                     │
│  ...                                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Mejoras:**
- Imágenes de productos (thumbnails 60x60)
- Layout en cards con imagen
- Badge "Popular" para productos destacados
- Indicador visual de no disponible (tachado o gris)

---

## FASE 4: INTEGRACIÓN Y NAVEGACIÓN

### 4.1 Dashboard - Pestañas de Venue

**Sidebar actualizado** (`src/components/layout/app-sidebar.tsx`):

Agregar al menú contextual de cada venue:
- 📅 Horarios
- 🛎️ Servicios
- 🍽️ Menú (solo gastronómicos)

### 4.2 Página Pública

**Componente**: `src/components/features/venues/venue-detail.tsx`

Agregar secciones en orden:
1. Horarios (con estado abierto/cerrado)
2. Servicios (grid de iconos)
3. Menú (solo si es gastronómico y tiene items)

---

## FASE 5: MIGRACIÓN DE DATOS

### 5.1 Script de Migración

**Archivo**: `scripts/migrate-business-hours.ts`

```typescript
// 1. Leer todos los OperatingHours
// 2. Parsear strings a franjas horarias
// 3. Crear VenueBusinessHours para cada franja
// 4. Verificar integridad
// 5. Marcar OperatingHours como deprecado
```

### 5.2 Compatibilidad

- Mantener `OperatingHours` hasta migración completa
- Componentes de display deben soportar ambos formatos temporalmente
- Deprecar después de verificar migración exitosa

---

## ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos

```
prisma/schema.prisma (modificar)
src/actions/business-hours/manage-hours.ts
src/actions/services/manage-services.ts
src/components/business-hours/business-hours-editor.tsx
src/components/business-hours/business-hours-display.tsx
src/components/services/services-editor.tsx
src/components/services/services-display.tsx
src/components/menu/menu-manager-v2.tsx
src/components/menu/menu-display-v2.tsx
src/app/dashboard/locales/[slug]/horarios/page.tsx
src/app/dashboard/locales/[slug]/servicios/page.tsx
src/lib/constants/services.ts
scripts/migrate-business-hours.ts
```

### Archivos a Modificar

```
src/components/features/venues/venue-detail.tsx
src/components/layout/app-sidebar.tsx
src/actions/menu/manage-menu.ts
src/lib/queries/venues.ts
```

---

## DEPENDENCIAS

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## ORDEN DE IMPLEMENTACIÓN

1. **Schema y migración** (2h)
2. **Horarios backend** (3h)
3. **Horarios frontend editor** (4h)
4. **Horarios frontend display** (2h)
5. **Servicios backend** (2h)
6. **Servicios frontend editor** (3h)
7. **Servicios frontend display** (2h)
8. **Menú mejoras backend** (2h)
9. **Menú mejoras frontend** (5h)
10. **Integración y testing** (3h)

**Total estimado: ~28 horas**

---

## CRITERIOS DE ACEPTACIÓN

### Horarios
- [ ] Múltiples franjas horarias por día
- [ ] Días marcados como cerrado
- [ ] Validación de solapamiento
- [ ] Copiar horarios a otros días
- [ ] Estado "Abierto/Cerrado" en tiempo real
- [ ] Migración de datos existentes

### Servicios
- [ ] Catálogo de 16+ servicios predefinidos
- [ ] Toggle on/off para servicios predefinidos
- [ ] Creación de servicios personalizados
- [ ] Edición y eliminación de personalizados
- [ ] Grid responsive en página pública

### Menú
- [ ] Solo visible para categorías gastronómicas
- [ ] Drag & drop para reordenar
- [ ] Upload de imágenes por producto
- [ ] Toggle disponibilidad inline
- [ ] Edición completa de productos
- [ ] Imágenes en visualización pública

---

## NOTAS TÉCNICAS

1. **Rendimiento**: Usar `React.memo` en componentes de lista
2. **Accesibilidad**: ARIA labels en todos los controles
3. **Mobile-first**: Diseño responsive desde el inicio
4. **Dark mode**: Usar variables CSS del design system
5. **i18n**: Preparar textos para futura internacionalización

---

## FUTURAS MEJORAS

- API pública para apps móviles
- Exportar menú a PDF
- Integración con sistemas de delivery
- Análisis de productos más vistos
- Horarios especiales por fecha (feriados)
