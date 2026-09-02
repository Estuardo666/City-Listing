// Applies pending Prisma migrations during the build.
//
// A deploy must not ship code that queries a table the database does not have,
// which is exactly what happened when MobileRefreshSession reached production
// unmigrated: the build only ran `prisma generate`, so nothing failed until a
// user tried to sign in.
//
// `prisma migrate deploy` resolves the schema's `directUrl`, which reads
// DATABASE_URL_UNPOOLED. Integrations rarely expose that exact name - the Neon
// integration prefixes its variables (listing_DATABASE_URL_UNPOOLED) and
// Vercel Postgres calls it POSTGRES_URL_NON_POOLING - so resolve the direct
// connection from any of those and hand Prisma the name it expects.
//
// When no direct connection is configured the step is skipped with a loud
// warning rather than failing the build, so an unset variable cannot take the
// whole deploy pipeline down. When one is found the step is enforcing: a failed
// migration fails the build.
import { spawnSync } from 'node:child_process'

const EXPECTED = 'DATABASE_URL_UNPOOLED'
const KNOWN_ALIASES = ['POSTGRES_URL_NON_POOLING', 'POSTGRES_URL_NO_SSL']

/** Resolves `name` from the environment, tolerating integration prefixes. */
function resolve(name, aliases = []) {
  if (process.env[name]) return { name, value: process.env[name] }

  // Integration-prefixed copies, e.g. listing_DATABASE_URL_UNPOOLED.
  const prefixed = Object.keys(process.env)
    .filter((key) => key !== name && key.endsWith(name) && process.env[key])
    .sort()
  if (prefixed.length > 0) return { name: prefixed[0], value: process.env[prefixed[0]] }

  for (const alias of aliases) {
    const match = Object.keys(process.env).find((key) => key.endsWith(alias) && process.env[key])
    if (match) return { name: match, value: process.env[match] }
  }

  return null
}

// The schema needs both urls. A missing pooled url would fail validation the
// same way, so treat it as "not configured" and skip rather than kill the build.
const pooled = resolve('DATABASE_URL', ['POSTGRES_PRISMA_URL', 'POSTGRES_URL'])
const direct = pooled ? resolve(EXPECTED, KNOWN_ALIASES) : null

if (!direct) {
  console.warn(`[migrate] no direct database connection found - skipping \`prisma migrate deploy\`.`)
  console.warn(`[migrate] Looked for DATABASE_URL and ${EXPECTED}, including integration-prefixed`)
  console.warn(`[migrate] copies and the ${KNOWN_ALIASES.join(' / ')} aliases.`)
  console.warn('[migrate] Set one to the Neon direct (non-pooler) connection string so migrations')
  console.warn('[migrate] are applied on deploy instead of drifting from the code that needs them.')
  process.exit(0)
}

if (direct.name !== EXPECTED) {
  console.log(`[migrate] using ${direct.name} as ${EXPECTED}`)
}
if (pooled.name !== 'DATABASE_URL') {
  console.log(`[migrate] using ${pooled.name} as DATABASE_URL`)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DATABASE_URL: pooled.value, [EXPECTED]: direct.value },
})

if (result.error) {
  console.error('[migrate] could not run prisma migrate deploy:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
