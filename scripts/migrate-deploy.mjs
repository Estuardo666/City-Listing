// Applies pending Prisma migrations during the build.
//
// A deploy must not ship code that queries a table the database does not have,
// which is exactly what happened when MobileRefreshSession reached production
// unmigrated: the build only ran `prisma generate`, so nothing failed until a
// user tried to sign in.
//
// `prisma migrate deploy` resolves the schema's `directUrl`, so it needs
// DATABASE_URL_UNPOOLED. When that is missing the step is skipped with a loud
// warning rather than failing the build, so an unset variable cannot take the
// whole deploy pipeline down. Once the variable is set the step is enforcing:
// a failed migration fails the build.
import { spawnSync } from 'node:child_process'

const directURL = process.env.DATABASE_URL_UNPOOLED

if (!directURL) {
  console.warn('[migrate] DATABASE_URL_UNPOOLED is not set - skipping `prisma migrate deploy`.')
  console.warn('[migrate] Set it to the Neon direct (non-pooler) connection string so migrations')
  console.warn('[migrate] are applied on deploy instead of drifting from the code that needs them.')
  process.exit(0)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error('[migrate] could not run prisma migrate deploy:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
