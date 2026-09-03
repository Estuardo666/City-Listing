import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyClaimCode, type ClaimFailure } from '@/lib/claims/service'
import { claimVerifySchema } from '@/schemas/venue-claim.schema'

/** HTTP status per failure; the mobile route maps the same reasons to codes. */
const STATUS: Record<ClaimFailure, number> = {
  VENUE_NOT_FOUND: 404,
  ALREADY_OWNER: 409,
  ALREADY_CLAIMING: 409,
  CLAIM_NOT_FOUND: 404,
  FORBIDDEN: 403,
  CODE_EXPIRED: 410,
  TOO_MANY_ATTEMPTS: 429,
  INVALID_CODE: 400,
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 })
    }

    const parsed = claimVerifySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 },
      )
    }

    const result = await verifyClaimCode(session.user.id, parsed.data)

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: STATUS[result.reason] },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Correo verificado correctamente.',
        verified: true,
        confidenceScore: result.data.confidenceScore,
      },
    })
  } catch (error) {
    console.error('Error in claim verify:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
