import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function key(): Buffer {
  const encoded = process.env.TICKETING_CREDENTIAL_ENCRYPTION_KEY
  if (!encoded) throw new Error('TICKETING_CREDENTIAL_ENCRYPTION_KEY is not configured')
  const value = Buffer.from(encoded, 'base64')
  if (value.length !== 32) throw new Error('TICKETING_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  return value
}

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    keyVersion: 1,
  }
}

export function decryptSecret(input: { ciphertext: string; iv: string; authTag: string }): string {
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(input.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(input.authTag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(input.ciphertext, 'base64')), decipher.final()]).toString('utf8')
}

export function createPublicToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashSecret(token), last4: token.slice(-4) }
}
