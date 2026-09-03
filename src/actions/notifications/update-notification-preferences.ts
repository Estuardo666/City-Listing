'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notificationPreferencesSchema } from '@/schemas/notification.schema'
import type { ActionResponse } from '@/types/action-response'
import { NOTIFICATION_PREFERENCE_SELECT, type NotificationPreferenceRow } from '@/types/notification'

export async function updateNotificationPreferencesAction(
  input: unknown
): Promise<ActionResponse<NotificationPreferenceRow>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado.',
      }
    }

    const parsed = notificationPreferencesSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Preferencias inválidas.',
      }
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { userId: session.user.id, ...parsed.data },
      select: NOTIFICATION_PREFERENCE_SELECT,
    })

    return {
      success: true,
      data: prefs,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron actualizar las preferencias de notificación.',
    }
  }
}
