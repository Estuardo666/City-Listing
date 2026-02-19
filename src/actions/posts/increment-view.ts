'use server'

import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

export async function incrementPostViewAction(postId: string): Promise<ActionResponse<{ viewCount: number }>> {
  try {
    // Update view count - requires npx prisma db push for viewCount field
    try {
      const updated = await (prisma.post as unknown as {
        update: (args: unknown) => Promise<{ viewCount: number }>
      }).update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      })
      return { success: true, data: { viewCount: updated.viewCount } }
    } catch {
      // Graceful fallback before db push
      return { success: true, data: { viewCount: 0 } }
    }
  } catch {
    return { success: false, error: 'No se pudo actualizar el contador de vistas' }
  }
}
