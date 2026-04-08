/**
 * POST /api/explore/ai-search
 * AI-powered search across restaurants and offers.
 * Sends the query + venue/offer catalog to Claude (with prompt caching)
 * and returns top 5 matches with reasons.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const STATIC_SYSTEM = `You are a smart search engine for Nigerent Signature Lifestyle, a luxury membership platform in Lagos and Abuja, Nigeria. Members search for dining venues, offers, experiences, wellness, nightlife, and services.

Given a member's search query and a catalog of venues/offers, return the TOP 5 most relevant results. Think about intent: "date night" means romantic restaurants, "hangout" means casual fun spots, "healthy" means wellness or healthy food, "birthday" means event-friendly venues, etc.

RULES:
- Return EXACTLY a JSON array (no markdown, no explanation outside the JSON)
- Each result: {"id":"...","type":"restaurant"|"offer","reason":"1 short sentence why this matches"}
- "reason" should be specific and helpful (e.g. "Romantic waterfront setting, perfect for a date night" not "This is a restaurant")
- If fewer than 5 match well, return fewer. Never pad with bad matches.
- Prioritize quality of match over quantity.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { query } = await request.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    // Fetch catalog (trimmed for cost)
    const [restaurants, offers] = await Promise.all([
      prisma.restaurant.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, cuisine: true, city: true, area: true,
          priceLevel: true, memberBenefit: true, ambianceTags: true,
          description: true,
        },
      }),
      prisma.offer.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true, title: true, shortDesc: true, category: true,
          city: true,
          partner: { select: { name: true, category: true, area: true, city: true } },
        },
        take: 60,
      }),
    ])

    // Build compact catalog string
    const catalog = `RESTAURANTS:\n${restaurants
      .map(r => `[${r.id}] ${r.name} (${r.cuisine}, ${r.area}, ${r.city}) ${'₦'.repeat(r.priceLevel)} | ${r.ambianceTags.join(', ')} | ${r.memberBenefit ?? 'No perk'}${r.description ? ' | ' + r.description.slice(0, 80) : ''}`)
      .join('\n')}

OFFERS:\n${offers
      .map(o => `[${o.id}] "${o.title}" at ${o.partner.name} (${o.partner.category}, ${o.partner.area ?? o.partner.city}) — ${o.shortDesc}`)
      .join('\n')}`

    const response = await anthropic.messages.create({
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
          text: catalog,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user', content: query.trim() }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '[]'

    // Parse JSON array from response (handle markdown wrapping)
    let results: Array<{ id: string; type: string; reason: string }> = []
    try {
      const jsonStr = rawText.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
      results = JSON.parse(jsonStr)
    } catch {
      // Try to find array in response
      const match = rawText.match(/\[[\s\S]*\]/)
      if (match) {
        try { results = JSON.parse(match[0]) } catch { /* empty */ }
      }
    }

    // Enrich results with full data
    const enriched = results.slice(0, 5).map(r => {
      if (r.type === 'restaurant') {
        const rest = restaurants.find(x => x.id === r.id)
        if (rest) return { ...r, data: { name: rest.name, cuisine: rest.cuisine, area: rest.area, city: rest.city, priceLevel: rest.priceLevel, memberBenefit: rest.memberBenefit, ambianceTags: rest.ambianceTags } }
      } else {
        const offer = offers.find(x => x.id === r.id)
        if (offer) return { ...r, data: { title: offer.title, shortDesc: offer.shortDesc, partnerName: offer.partner.name, category: offer.partner.category, area: offer.partner.area, city: offer.partner.city ?? offer.city } }
      }
      return null
    }).filter(Boolean)

    return NextResponse.json({ results: enriched })
  } catch (err) {
    console.error('AI search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
