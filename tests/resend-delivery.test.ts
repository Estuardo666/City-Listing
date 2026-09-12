import assert from 'node:assert/strict'
import test from 'node:test'
import { assertResendAccepted } from '../src/lib/resend'

test('Resend provider errors do not acknowledge delivery', () => {
  assert.throws(
    () => assertResendAccepted({ data: null, error: { name: 'validation_error', statusCode: 403, message: 'Domain is not verified' } }),
    /Resend rechazó el correo.*Domain is not verified/,
  )
  assert.throws(() => assertResendAccepted({ data: null, error: null }), /no devolvió un ID/i)
  assert.doesNotThrow(() => assertResendAccepted({ data: { id: 'email-id' }, error: null }))
})
