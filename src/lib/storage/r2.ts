import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`)
  }

  return value
}

const r2BucketName = requireEnv(process.env.R2_BUCKET_NAME, 'R2_BUCKET_NAME')
const r2Endpoint = requireEnv(process.env.R2_ENDPOINT, 'R2_ENDPOINT')
const r2AccessKeyId = requireEnv(process.env.R2_ACCESS_KEY_ID, 'R2_ACCESS_KEY_ID')
const r2SecretAccessKey = requireEnv(process.env.R2_SECRET_ACCESS_KEY, 'R2_SECRET_ACCESS_KEY')

const normalizedPublicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? '').trim().replace(/\/$/, '')

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
})

export const R2_BUCKET_NAME = r2BucketName

export async function uploadBufferToR2(params: {
  key: string
  body: Buffer
  contentType: string
}): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  })

  await r2Client.send(command)
}

export function getR2PublicUrl(key: string): string {
  const sanitizedKey = key.replace(/^\/+/, '')

  if (normalizedPublicBaseUrl.length > 0) {
    return `${normalizedPublicBaseUrl}/${sanitizedKey}`
  }

  return `${r2Endpoint.replace(/\/$/, '')}/${R2_BUCKET_NAME}/${sanitizedKey}`
}
