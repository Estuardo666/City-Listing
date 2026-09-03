'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'
import { NOTIFICATION_PREFERENCE_SELECT, type NotificationPreferenceRow } from '@/types/notification'

export async function getNotificationPreferencesAction(): Promise<
  ActionResponse<NotificationPreferenceRow>
> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado.',
      }
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
      },
      select: NOTIFICATION_PREFERENCE_SELECT,
    })

    return {
      success: true,
      data: prefs,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron cargar las preferencias de notificación.',
    }
  }
}
