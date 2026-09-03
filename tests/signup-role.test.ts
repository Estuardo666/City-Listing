import assert from 'node:assert/strict'
import test from 'node:test'

test('public signup strips role escalation and only accepts account fields', async () => {
  const { signupSchema } = await import('../src/app/api/auth/signup/schema')
  const parsed = signupSchema.parse({
    name: 'Public User',
    email: 'public-user@example.com',
    password: 'valid-password-123',
    role: 'ADMIN',
  })

  assert.deepEqual(parsed, {
    name: 'Public User',
    email: 'public-user@example.com',
    password: 'valid-password-123',
  })
  assert.equal('role' in parsed, false)
})
