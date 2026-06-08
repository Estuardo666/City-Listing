import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('=== Migración Completa de Categorías ===\n')

  // PASO 1: Crear tablas pivote si no existen
  console.log('1. Creando tablas pivote...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VenueCategory" (
      "venueId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VenueCategory_pkey" PRIMARY KEY ("venueId", "categoryId")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VenueSubcategory" (
      "venueId" TEXT NOT NULL,
      "subcategoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VenueSubcategory_pkey" PRIMARY KEY ("venueId", "subcategoryId")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventCategory" (
      "eventId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("eventId", "categoryId")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventSubcategory" (
      "eventId" TEXT NOT NULL,
      "subcategoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EventSubcategory_pkey" PRIMARY KEY ("eventId", "subcategoryId")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Subcategory" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "description" TEXT,
      "icon" TEXT,
      "color" TEXT,
      "categoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_slug_key" ON "Subcategory"("slug");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GooglePlaceTypeMapping" (
      "id" TEXT NOT NULL,
      "googleType" TEXT NOT NULL,
      "categorySlugs" TEXT[],
      "subcategorySlugs" TEXT[],
      "confidence" INTEGER NOT NULL DEFAULT 100,
      "approved" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "GooglePlaceTypeMapping_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "GooglePlaceTypeMapping_googleType_key" ON "GooglePlaceTypeMapping"("googleType");
  `)
  console.log('   Tablas pivote creadas.\n')

  // PASO 2: Crear índices en tablas pivote
  console.log('2. Creando índices...')
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VenueCategory_categoryId_idx" ON "VenueCategory"("categoryId");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VenueSubcategory_subcategoryId_idx" ON "VenueSubcategory"("subcategoryId");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EventCategory_categoryId_idx" ON "EventCategory"("categoryId");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EventSubcategory_subcategoryId_idx" ON "EventSubcategory"("subcategoryId");`)
  console.log('   Índices creados.\n')

  // PASO 3: Migrar datos de Venue.categoryId a VenueCategory
  console.log('3. Migrando Venues...')
  const venueResult = await prisma.$executeRawUnsafe(`
    INSERT INTO "VenueCategory" ("venueId", "categoryId", "createdAt")
    SELECT "id", "categoryId", NOW()
    FROM "Venue"
    WHERE "categoryId" IS NOT NULL
    ON CONFLICT DO NOTHING
  `)
  console.log(`   Migrados: ${venueResult} registros.\n`)

  // PASO 4: Migrar datos de Event.categoryId a EventCategory
  console.log('4. Migrando Events...')
  const eventResult = await prisma.$executeRawUnsafe(`
    INSERT INTO "EventCategory" ("eventId", "categoryId", "createdAt")
    SELECT "id", "categoryId", NOW()
    FROM "Event"
    WHERE "categoryId" IS NOT NULL
    ON CONFLICT DO NOTHING
  `)
  console.log(`   Migrados: ${eventResult} registros.\n`)

  // PASO 5: Verificar
  console.log('5. Verificando...')
  const vcCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) as count FROM "VenueCategory"`)
  const ecCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) as count FROM "EventCategory"`)
  console.log(`   VenueCategory: ${vcCount[0].count} registros`)
  console.log(`   EventCategory: ${ecCount[0].count} registros`)

  console.log('\n✅ Migración de datos completada.')
  console.log('Ahora ejecuta: npx prisma db push --accept-data-loss')
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
