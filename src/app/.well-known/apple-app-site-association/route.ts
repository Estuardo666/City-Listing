const PUBLIC_PATHS = ['/locales/*', '/eventos/*', '/blog/*', '/partidos/*']

export const dynamic = 'force-dynamic'

export function GET() {
  const teamID = process.env.APPLE_TEAM_ID?.trim()
  const bundleID = process.env.APPLE_BUNDLE_ID?.trim() || 'com.viveloja.app'

  if (!teamID) {
    return new Response(JSON.stringify({ error: 'AASA no configurado' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const appID = `${teamID}.${bundleID}`
  const body = {
    applinks: {
      details: [
        {
          appIDs: [appID],
          components: PUBLIC_PATHS.map((path) => ({ '/': path })),
        },
      ],
    },
  }

  return new Response(JSON.stringify(body), {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
