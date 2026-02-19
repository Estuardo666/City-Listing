# Setup CityListing Loja

## 1. Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar variables en .env.local:
# - DATABASE_URL
# - NEXTAUTH_SECRET (generar con: openssl rand -base64 32)
# - MAPBOX_ACCESS_TOKEN (opcional para mapas)
```

### Variables recomendadas

```bash
# Desarrollo (SQLite)
DATABASE_URL="file:./dev.db"

# Producción (PostgreSQL, con prisma/schema.postgresql.prisma)
# DATABASE_URL="postgresql://username:password@localhost:5432/citylisting_loja?schema=public"
```

## 2. Base de datos

```bash
# Push del esquema a la DB
npm run db:push

# Seed de datos iniciales
npm run db:seed
```

### Producción (PostgreSQL)

```bash
# Push del esquema PostgreSQL
npx prisma db push --schema prisma/schema.postgresql.prisma

# (Opcional) aplicar migraciones en producción
npx prisma migrate deploy --schema prisma/schema.postgresql.prisma
```

> Modelo `Event` ya incluye `address`, `lat` y `lng` para geolocalización.

## 3. Ejecutar

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

## 4. URLs

- App: http://localhost:3000
- Prisma Studio: npm run db:studio

## 5. Próximos pasos MVP

1. **Autenticación** - Configurar NextAuth
2. **CRUD Eventos** - Formularios + Server Actions
3. **CRUD Locales** - Categorías + mapa
4. **Blog/Noticias** - Posts + SEO
5. **Dashboard Admin** - Aprobación de contenido
6. **Mapas** - Integración Mapbox

## 6. Estructura de carpetas

```
src/
├── app/              # App Router pages
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   └── features/    # Feature components
├── lib/             # Utils y configs
├── actions/         # Server Actions
├── schemas/         # Zod validations
└── types/           # TypeScript types
```
