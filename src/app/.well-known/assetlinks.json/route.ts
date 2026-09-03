export const dynamic = 'force-dynamic'

/**
 * Android App Links counterpart of the AASA route. Fails closed the same way:
 * without a package name and at least one signing fingerprint the file must not
 * exist, otherwise Android caches an empty statement list and stops verifying.
 */
export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME?.trim()
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)

  if (!packageName || fingerprints.length === 0) {
    return new Response(JSON.stringify({ error: 'assetlinks no configurado' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]

  return new Response(JSON.stringify(body), {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
