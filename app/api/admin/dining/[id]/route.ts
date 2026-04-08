import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const PatchSchema = z.object({
  status:     z.enum(['RECEIVED', 'IN_PROGRESS', 'CONFIRMED', 'DECLINED', 'COMPLETED', 'CANCELLED']).optional(),
  adminNotes: z.string().optional(),
  assignedTo: z.string().optional(),
})

/**
 * PATCH /api/admin/dining/[id]
 * Update a dining request status, admin notes, or assignment.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const updateData: Record<string, unknown> = {}
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status
  if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes
  if (parsed.data.assignedTo !== undefined) updateData.assignedTo = parsed.data.assignedTo

  // Auto-set confirmedAt when status changes to CONFIRMED
  if (parsed.data.status === 'CONFIRMED') {
    updateData.confirmedAt = new Date()
  }

  const request = await prisma.diningRequest.update({
    where: { id: params.id },
    data: updateData,
  })

  // Create notification for the member
  try {
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your dining reservation has been confirmed!',
      DECLINED:  'Unfortunately, your dining request could not be accommodated.',
      COMPLETED: 'Your dining reservation has been marked as completed. We hope you enjoyed it!',
      CANCELLED: 'Your dining reservation has been cancelled.',
    }
    const msg = statusMessages[parsed.data.status ?? '']
    if (msg) {
      await prisma.notification.create({
        data: {
          userId:  request.userId,
          type:    'dining_update',
          title:   `Reservation ${parsed.data.status?.toLowerCase()}`,
          body:    msg,
        },
      })
    }
  } catch {
    // Non-critical: notification failure shouldn't block status update
  }

  return NextResponse.json({ success: true, request })
}
