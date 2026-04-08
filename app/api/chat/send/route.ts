/**
 * POST /api/chat/send
 * Member sends a message to their concierge thread.
 * After saving the message, triggers the AI concierge to respond.
 * Uses Anthropic prompt caching to reduce cost on repeated system context.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/* ── Static system prompt (cached — stays the same across all members) ─────── */
const STATIC_SYSTEM = `You are the Nigerent Signature Lifestyle concierge — warm, personal, concise, elegant. Never robotic. Address the member by name. Never say you are an AI unless asked.
All booking requests are NEW unless the member explicitly asks about a past or old reservation.
When you detect a new booking request, append a JSON block AFTER your reply:
\`\`\`booking
{"type":"dining"|"concierge","category":"Dining"|"Transport"|"Events"|"Gifts"|"Recommendations"|"Stay Support"|"Errands"|"Custom","restaurantName":"name or null","date":"YYYY-MM-DD or null","time":"HH:MM or null","partySize":number|null,"occasion":"str or null","dietaryNotes":"str or null","seatingPref":"str or null","specialNotes":"str or null","description":"brief summary"}
\`\`\`
Only include the booking block for clear requests, not greetings or questions.`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBookingBlock(text: string): {
  cleanText: string
  booking: Record<string, unknown> | null
} {
  const bookingMatch = text.match(/```booking\s*\n([\s\S]*?)\n```/)
  if (!bookingMatch) return { cleanText: text.trim(), booking: null }

  const cleanText = text.replace(/```booking\s*\n[\s\S]*?\n```/, '').trim()
  try {
    const booking = JSON.parse(bookingMatch[1])
    return { cleanText, booking }
  } catch {
    return { cleanText, booking: null }
  }
}

function computeWalletBalance(
  txns: Array<{ type: string; amount: number; status: string }>
): number {
  return txns.reduce((bal, t) => {
    if (t.status !== 'COMPLETED') return bal
    if (t.type === 'LOAD' || t.type === 'REFUND') return bal + t.amount
    if (t.type === 'SPEND') return bal - t.amount
    return bal
  }, 0)
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await request.json()
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  }

  // Get or create thread
  let thread = await prisma.chatThread.findUnique({ where: { userId: user.id } })
  if (!thread) {
    thread = await prisma.chatThread.create({ data: { userId: user.id } })
  }

  // Save member message
  const msg = await prisma.chatMessage.create({
    data: {
      threadId:   thread.id,
      userId:     user.id,
      senderRole: 'MEMBER',
      body:       body.trim(),
    },
  })

  // ── Trigger AI response ──────────────────────────────────────────────────
  let aiResponse: {
    id: string
    senderRole: string
    body: string
    createdAt: string
    booking: { type: string; id: string; ref: string } | null
  } | null = null

  try {
    // Check if user is asking about past/old reservations
    const lowerBody = body.trim().toLowerCase()
    const wantsPastReservations =
      /\b(old|past|previous|earlier|history|last time|before)\b/.test(lowerBody) &&
      /\b(reserv|book|request|order|dining)\b/.test(lowerBody)

    // Fetch member context in parallel (trimmed for cost)
    const [member, restaurants, offers, recentMessages, ...pastReqs] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          include: {
            membership: { include: { tier: true } },
            walletTxns: {
              where: { status: 'COMPLETED' },
              select: { type: true, amount: true, status: true },
            },
          },
        }),
        prisma.restaurant.findMany({
          where: { isActive: true },
          select: {
            id: true, name: true, cuisine: true, city: true, area: true,
            memberBenefit: true, priceLevel: true, ambianceTags: true,
          },
          take: 10,
        }),
        prisma.offer.findMany({
          where: { status: 'ACTIVE' },
          select: {
            title: true, shortDesc: true,
            category: true, city: true, tierEligibility: true,
            partner: { select: { name: true } },
          },
          take: 10,
        }),
        prisma.chatMessage.findMany({
          where: { threadId: thread!.id },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { senderRole: true, body: true, createdAt: true },
        }),
        // Only fetch past requests if user explicitly asks
        ...(wantsPastReservations
          ? [
              prisma.conciergeRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { category: true, description: true, status: true, createdAt: true },
              }),
              prisma.diningRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { restaurant: { select: { name: true } } },
              }),
            ]
          : []),
      ])

    const conciergeReqs = wantsPastReservations ? (pastReqs[0] ?? []) : []
    const diningReqs = wantsPastReservations ? (pastReqs[1] ?? []) : []

    if (member) {
      const walletBalance = computeWalletBalance(
        member.walletTxns as Array<{ type: string; amount: number; status: string }>
      )
      const tierName = member.membership?.tier?.name ?? 'Signature'

      // Build context strings (trimmed for cost)
      const memberContext = `MEMBER: ${member.name} | ${tierName} | ${member.city} | ₦${Math.floor(walletBalance / 100).toLocaleString()} wallet
TODAY: ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`

      // Only include past reservations if user asked for them
      const pastContext = wantsPastReservations
        ? `\nPAST REQUESTS:\n${(conciergeReqs as Array<{ status: string; category: string; description: string | null; createdAt: Date }>)
            .map((r) => `- [${r.status}] ${r.category}: ${r.description ?? 'N/A'}`)
            .join('\n')}
${(diningReqs as Array<{ status: string; restaurant: { name: string }; partySize: number; preferredDate: Date; preferredTime: string }>)
            .map((r) => `- [${r.status}] ${r.restaurant.name}: ${r.partySize}pax ${r.preferredDate.toLocaleDateString()} ${r.preferredTime}`)
            .join('\n')}`
        : ''

      const restaurantContext = `RESTAURANTS:\n${restaurants
  .map((r: { name: string; cuisine: string; area: string; city: string; priceLevel: number; memberBenefit: string | null; ambianceTags: string[] }) =>
    `- ${r.name} (${r.cuisine}, ${r.area}) ${'₦'.repeat(r.priceLevel)}${r.memberBenefit ? ' — ' + r.memberBenefit : ''}`)
  .join('\n')}`

      const offersContext = `OFFERS:\n${offers
  .map((o: { title: string; partner: { name: string }; category: string; shortDesc: string }) =>
    `- ${o.title} at ${o.partner.name} — ${o.shortDesc}`)
  .join('\n')}`

      // Build conversation messages
      const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
      const historyMsgs = [...recentMessages].reverse()
      for (const m of historyMsgs) {
        if (m.senderRole === 'MEMBER') {
          conversationMessages.push({ role: 'user', content: m.body })
        } else if (m.senderRole === 'AI' || m.senderRole === 'CONCIERGE') {
          conversationMessages.push({ role: 'assistant', content: m.body })
        }
      }

      // Ensure starts with user message
      while (conversationMessages.length > 0 && conversationMessages[0].role !== 'user') {
        conversationMessages.shift()
      }

      // Ensure no duplicate consecutive same-role messages
      const deduped: typeof conversationMessages = []
      for (const m of conversationMessages) {
        if (deduped.length === 0 || deduped[deduped.length - 1].role !== m.role) {
          deduped.push(m)
        }
      }

      // Call Claude with prompt caching — static prompt is cached (90% cheaper)
      const dynamicContext = `${memberContext}${pastContext}\n${restaurantContext}\n${offersContext}`

      const claudeResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: [
          {
            type: 'text' as const,
            text: STATIC_SYSTEM,
            cache_control: { type: 'ephemeral' as const },
          },
          {
            type: 'text' as const,
            text: dynamicContext,
          },
        ],
        messages: deduped.length > 0 ? deduped : [{ role: 'user', content: body.trim() }],
      })

      const rawText =
        claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''

      // Parse for booking request
      const { cleanText, booking } = parseBookingBlock(rawText)

      let bookingResult: { type: string; id: string; ref: string } | null = null

      if (booking) {
        const bookingType = booking.type as string

        if (bookingType === 'dining' && booking.restaurantName) {
          const restaurant = await prisma.restaurant.findFirst({
            where: {
              name: { contains: booking.restaurantName as string, mode: 'insensitive' },
              isActive: true,
            },
          })

          if (restaurant) {
            const diningReq = await prisma.diningRequest.create({
              data: {
                userId: user.id,
                restaurantId: restaurant.id,
                preferredDate: booking.date
                  ? new Date(booking.date as string)
                  : new Date(),
                preferredTime: (booking.time as string) ?? '19:00',
                partySize: (booking.partySize as number) ?? 2,
                occasion: (booking.occasion as string) ?? null,
                dietaryNotes: (booking.dietaryNotes as string) ?? null,
                seatingPref: (booking.seatingPref as string) ?? null,
                additionalNotes: (booking.specialNotes as string) ?? null,
                status: 'RECEIVED',
              },
            })

            bookingResult = {
              type: 'dining',
              id: diningReq.id,
              ref: `NSL-${diningReq.id.slice(0, 8).toUpperCase()}`,
            }
          }
        }

        if (!bookingResult) {
          const category = (booking.category as string) ?? 'Custom'
          const concReq = await prisma.conciergeRequest.create({
            data: {
              userId: user.id,
              category,
              description: (booking.description as string) ?? body.trim(),
              status: 'RECEIVED',
              priority: 'STANDARD',
            },
          })

          bookingResult = {
            type: 'concierge',
            id: concReq.id,
            ref: `NSL-${concReq.id.slice(0, 8).toUpperCase()}`,
          }
        }

        // Notify concierge team
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: bookingResult.type === 'dining' ? 'DINING_UPDATE' : 'CONCIERGE_REQUEST',
            title: 'New AI-Assisted Request',
            body: `${member.name} (${tierName}) — ${(booking.description as string) ?? body.trim().slice(0, 100)}`,
            ctaUrl: '/concierge',
            metadata: {
              requestId: bookingResult.id,
              requestType: bookingResult.type,
              aiGenerated: true,
            },
          },
        }).catch(() => { /* non-critical */ })
      }

      // Save AI response
      const aiMsg = await prisma.chatMessage.create({
        data: {
          threadId: thread!.id,
          userId: user.id,
          senderRole: 'AI',
          body: cleanText,
          metadata: bookingResult
            ? {
                bookingType: bookingResult.type,
                bookingId: bookingResult.id,
                bookingRef: bookingResult.ref,
              }
            : undefined,
          ...(bookingResult?.type === 'dining'
            ? { diningRequestId: bookingResult.id }
            : bookingResult?.type === 'concierge'
              ? { conciergeRequestId: bookingResult.id }
              : {}),
        },
      })

      aiResponse = {
        id: aiMsg.id,
        senderRole: 'AI',
        body: cleanText,
        createdAt: aiMsg.createdAt.toISOString(),
        booking: bookingResult,
      }
    }
  } catch (err) {
    console.error('AI concierge error:', err)
    // AI failure is non-blocking — the member message was already saved
  }

  return NextResponse.json({
    id:         msg.id,
    senderRole: msg.senderRole,
    body:       msg.body,
    createdAt:  msg.createdAt.toISOString(),
    aiResponse,
  })
}
