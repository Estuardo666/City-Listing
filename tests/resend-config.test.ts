import assert from 'node:assert/strict'
import test from 'node:test'

test('Resend integration loads without an API key and fails only when sending', async () => {
  const previousKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  try {
    const resendModule = await import('../src/lib/resend')

    assert.equal(resendModule.resend, null)
    await assert.rejects(
      resendModule.sendEmail({
        to: 'test@example.com',
        subject: 'configuration test',
        text: 'not sent',
      }),
      /RESEND_API_KEY no configurada/,
    )
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})
