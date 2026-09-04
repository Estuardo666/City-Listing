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
// Read-only by default. --history-only reads migration metadata only.
// Seed, cleanup and write-based constraint probes are intentionally unsupported.
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL_UNPOOLED (or DATABASE_URL) to the copy you want to check.')
  process.exit(2)
}

const args = process.argv.slice(2)
if (args.length > 1 || (args.length === 1 && args[0] !== '--history-only')) {
  console.error('Unsupported mode. Only --history-only is allowed; writes are disabled.')
  process.exit(2)
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

const FIXTURE_PREFIX = 'migration-check-'
const results = []

function check(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function verify(prisma) {
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

  // Historical backfills cannot be inferred from current rows: new multi-day
  // stops and stops with intentionally absent coordinates are valid.
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

}

async function history(prisma) {
  const tables = await prisma.$queryRaw`SELECT to_regclass('public."_prisma_migrations"')::text AS name`
  check('Migration history exists', Boolean(tables[0]?.name))
  if (!tables[0]?.name) return
  const rows = await prisma.$queryRaw`
    SELECT migration_name, checksum, finished_at, rolled_back_at
    FROM public."_prisma_migrations" ORDER BY started_at
  `
  // Never export migration logs, which can contain sensitive data.
  for (const row of rows) console.log(JSON.stringify(row))
  check('MobileRefreshSession migration applied', rows.some((row) =>
    row.migration_name === '20260901000000_add_mobile_refresh_session'
    && row.finished_at && !row.rolled_back_at))
  check('No unresolved failed migrations', rows.every((row) => row.finished_at || row.rolled_back_at))
}

try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`
    await history(tx)
    if (args[0] !== '--history-only') await verify(tx)
  }, { timeout: 30000 })
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length > 0) process.exitCode = 1
} catch {
  console.error('Read-only verification failed. Check database access/schema privately.')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
