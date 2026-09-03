// Verifies the parity migrations against a database that already holds data.
//
// CI proves the SQL applies to an empty database. What it cannot prove is the
// part that only bites in production: dropping RouteStop's old unique index
// while rows exist, backfilling `day`, seeding stop coordinates from their
// venue, and constraining Venue.claimedBy once orphaned ids are already there.
//
// Run it against a Neon branch (a copy, never production):
//
//   DATABASE_URL_UNPOOLED="postgres://…/neondb" node scripts/verify-itinerary-migration.mjs
//
// It only reads, except for the `--seed` mode described below, which inserts
// clearly-labelled fixture rows so the checks have something to look at on a
// branch with no routes. Nothing is deleted.
//
//   node scripts/verify-itinerary-migration.mjs --seed   # insert fixtures first
//   node scripts/verify-itinerary-migration.mjs --clean  # remove those fixtures

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL_UNPOOLED (or DATABASE_URL) to the copy you want to check.')
  process.exit(2)
}

// Guard against pointing this at the live database by accident.
if (/viveloja\.com/.test(url) && !process.env.ALLOW_PRODUCTION) {
  console.error('Refusing to run against what looks like production. Use a Neon branch.')
  process.exit(2)
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

const FIXTURE_PREFIX = 'migration-check-'
const results = []

function check(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function seed() {
  const user = await prisma.user.create({
    data: {
      id: `${FIXTURE_PREFIX}user`,
      email: `${FIXTURE_PREFIX}${Date.now()}@example.com`,
      name: 'Migration check',
    },
  })

  const venue = await prisma.venue.create({
    data: {
      id: `${FIXTURE_PREFIX}venue`,
      name: 'Local de prueba',
      slug: `${FIXTURE_PREFIX}venue`,
      description: 'Fixture for the migration check',
      location: 'Loja',
      lat: -3.99313,
      lng: -79.20422,
      status: 'APPROVED',
      isActive: true,
      userId: user.id,
    },
  })

  // Two stops on the same ordinal but different days: impossible under the old
  // unique key, which is the whole point of the migration.
  await prisma.route.create({
    data: {
      id: `${FIXTURE_PREFIX}route`,
      title: 'Ruta de prueba',
      slug: `${FIXTURE_PREFIX}route`,
      description: 'Fixture for the migration check',
      type: 'cultural',
      status: 'APPROVED',
      days: 2,
      userId: user.id,
      stops: {
        create: [
          { id: `${FIXTURE_PREFIX}stop-d1`, day: 1, order: 0, title: 'Parada día 1', venueId: venue.id },
          { id: `${FIXTURE_PREFIX}stop-d2`, day: 2, order: 0, title: 'Parada día 2' },
        ],
      },
    },
  })

  console.log('Seeded fixtures.')
}

async function clean() {
  await prisma.routeStop.deleteMany({ where: { id: { startsWith: FIXTURE_PREFIX } } })
  await prisma.route.deleteMany({ where: { id: { startsWith: FIXTURE_PREFIX } } })
  await prisma.venue.deleteMany({ where: { id: { startsWith: FIXTURE_PREFIX } } })
  await prisma.user.deleteMany({ where: { id: { startsWith: FIXTURE_PREFIX } } })
  console.log('Removed fixtures.')
}

async function verify() {
  // --- schema shape ---------------------------------------------------------
  const indexes = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes WHERE tablename = 'RouteStop'
  `
  const names = indexes.map((row) => row.indexname)
  check(
    'RouteStop old unique index is gone',
    !names.includes('RouteStop_routeId_order_key'),
    names.join(', '),
  )
  check(
    'RouteStop unique key is (routeId, day, order)',
    names.includes('RouteStop_routeId_day_order_key'),
  )

  const columns = await prisma.$queryRaw`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'RouteStop'
  `
  const day = columns.find((c) => c.column_name === 'day')
  check('RouteStop.day exists, NOT NULL, defaults to 1', Boolean(day) && day.is_nullable === 'NO' && /1/.test(day.column_default ?? ''), day ? `${day.is_nullable}, default ${day.column_default}` : 'missing')

  for (const column of ['startTime', 'lat', 'lng', 'image', 'travelMinutes']) {
    check(`RouteStop.${column} exists`, columns.some((c) => c.column_name === column))
  }

  // Cast to text: Prisma cannot deserialize a bare regclass.
  const tables = await prisma.$queryRaw`
    SELECT to_regclass('"ViewEvent"')::text AS view_event,
           to_regclass('"DeviceToken"')::text AS device_token
  `
  check('ViewEvent table exists', tables[0]?.view_event !== null)
  check('DeviceToken table exists', tables[0]?.device_token !== null)

  const claimedByFk = await prisma.$queryRaw`
    SELECT conname FROM pg_constraint WHERE conname = 'Venue_claimedBy_fkey'
  `
  check('Venue.claimedBy is a foreign key', claimedByFk.length === 1)

  const favoriteCollection = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Favorite' AND column_name = 'collectionId'
  `
  check('Favorite.collectionId exists', favoriteCollection.length === 1)

  // --- data ------------------------------------------------------------------
  const totalStops = await prisma.routeStop.count()
  const nullDays = await prisma.$queryRaw`
    SELECT count(*)::int AS count FROM "RouteStop" WHERE "day" IS NULL
  `
  check('No stop was left without a day', nullDays[0].count === 0, `${totalStops} stops total`)

  const belowOne = await prisma.routeStop.count({ where: { day: { lt: 1 } } })
  check('Every stop is on day 1 or later', belowOne === 0)

  const preExisting = await prisma.routeStop.count({
    where: { day: 1, id: { not: { startsWith: FIXTURE_PREFIX } } },
  })
  check(
    'Pre-existing stops backfilled to day 1',
    preExisting === totalStops - (await prisma.routeStop.count({ where: { id: { startsWith: FIXTURE_PREFIX } } })) ||
      totalStops === 0,
    `${preExisting} on day 1`,
  )

  // Every stop that points at a venue with coordinates should have inherited
  // them, unless it was created after the migration with its own.
  const missingGeo = await prisma.$queryRaw`
    SELECT count(*)::int AS count
    FROM "RouteStop" s
    JOIN "Venue" v ON v."id" = s."venueId"
    WHERE s."lat" IS NULL AND v."lat" IS NOT NULL
  `
  check('Stop coordinates seeded from their venue', missingGeo[0].count === 0, `${missingGeo[0].count} missing`)

  const orphanClaims = await prisma.$queryRaw`
    SELECT count(*)::int AS count
    FROM "Venue" v
    LEFT JOIN "User" u ON u."id" = v."claimedBy"
    WHERE v."claimedBy" IS NOT NULL AND u."id" IS NULL
  `
  check('No venue points at a missing owner', orphanClaims[0].count === 0)

  // A venue flagged as claimed with no claimer could never be claimed again,
  // because the app's CTA checks that flag.
  const strandedClaims = await prisma.venue.count({
    where: { claimed: true, claimedBy: null },
  })
  check('No venue is flagged claimed without a claimer', strandedClaims === 0, `${strandedClaims} stranded`)

  // --- the constraint actually does its job ---------------------------------
  const routeWithStops = await prisma.route.findFirst({
    where: { stops: { some: {} } },
    select: { id: true, stops: { select: { day: true, order: true }, take: 1 } },
  })

  if (routeWithStops?.stops[0]) {
    const { day, order } = routeWithStops.stops[0]
    let rejectedSameDay = false
    try {
      await prisma.routeStop.create({
        data: { id: `${FIXTURE_PREFIX}dup`, routeId: routeWithStops.id, day, order, title: 'dup' },
      })
    } catch {
      rejectedSameDay = true
    }
    check('Duplicate (day, order) is rejected', rejectedSameDay)

    let acceptedOtherDay = false
    try {
      await prisma.routeStop.create({
        data: { id: `${FIXTURE_PREFIX}otherday`, routeId: routeWithStops.id, day: day + 90, order, title: 'other day' },
      })
      acceptedOtherDay = true
    } catch (error) {
      acceptedOtherDay = false
      console.log(`      (insert on another day failed: ${error.message.split('\n')[0]})`)
    }
    check('Same ordinal on another day is accepted', acceptedOtherDay)

    await prisma.routeStop.deleteMany({
      where: { id: { in: [`${FIXTURE_PREFIX}dup`, `${FIXTURE_PREFIX}otherday`] } },
    })
  } else {
    console.log('  skip  constraint behaviour — no route with stops in this copy (run with --seed)')
  }
}

const mode = process.argv[2]

try {
  if (mode === '--seed') {
    await seed()
  } else if (mode === '--clean') {
    await clean()
  } else {
    await verify()
    const failed = results.filter((r) => !r.ok)
    console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
    if (failed.length > 0) process.exitCode = 1
  }
} finally {
  await prisma.$disconnect()
}
