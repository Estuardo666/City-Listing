import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.AI_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error('AI_ENCRYPTION_KEY must be at least 32 characters')
  }
  return Buffer.from(secret.slice(0, 32), 'utf-8')
}

export function encryptApiKey(plainText: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptApiKey(encryptedBase64: string): string {
  const key = getKey()
  const data = Buffer.from(encryptedBase64, 'base64')

  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf-8')
}
