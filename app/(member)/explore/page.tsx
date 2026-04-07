/**
 * /explore — Member Privileges & Partner Directory
 *
 * Server Component: fetches real partners + offers from Prisma.
 * Shows: Featured offer → category sections → full partner grid.
 */

import { redirect }          from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { prisma }             from '@/lib/prisma'
import Link                   from 'next/link'
import ExploreOffersClient    from '@/components/member/ExploreOffersClient'


const CAT_EMOJI: Record<string, string> = {
  'Restaurant':         '🍽️',
  'Wellness & Spa':     '🧖',
  'Arts & Culture':     '🎭',
  'Entertainment':      '🎬',
  'Nature & Adventure': '🌿',
  'Supermarket':        '🛒',
  'Pharmacy':           '💊',
  'Hospital & Medical': '🏥',
  'Nightlife':          '🥂',
}

const CAT_COLOR: Record<string, string> = {
  'Restaurant':         '#d4870f',
  'Wellness & Spa':     '#1fa3a6',
  'Arts & Culture':     '#c8a84b',
  'Entertainment':      '#9b59b6',
  'Nature & Adventure': '#27ae60',
  'Supermarket':        '#e67e22',
  'Pharmacy':           '#e74c3c',
  'Hospital & Medical': '#2980b9',
  'Nightlife':          '#8e44ad',
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function getExploreData() {
  const [featured, allOffers, totalPartners] = await Promise.all([
    prisma.offer.findMany({
      where:   { status: 'ACTIVE', isFeatured: true },
      include: { partner: true },
      orderBy: { displayOrder: 'asc' },
      take:    1,
    }),
    prisma.offer.findMany({
      where:   { status: 'ACTIVE' },
      include: { partner: true },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      take:    80,
    }),
    prisma.partner.count({ where: { isActive: true } }),
  ])

  return { featured: featured[0] ?? null, allOffers, totalPartners, hasData: allOffers.length > 0 }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByCategory(offers: Awaited<ReturnType<typeof getExploreData>>['allOffers']) {
  const map = new Map<string, typeof offers>()
  for (const o of offers) {
    const cat = o.partner.category
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(o)
  }
  return map
}

function ratingStr(contactInfo: unknown): string {
  if (!contactInfo || typeof contactInfo !== 'object') return ''
  const ci = contactInfo as Record<string, unknown>
  if (typeof ci.rating === 'number') return `${ci.rating} ★`
  return ''
}

function phoneStr(contactInfo: unknown): string {
  if (!contactInfo || typeof contactInfo !== 'object') return ''
  const ci = contactInfo as Record<string, unknown>
  return typeof ci.phone === 'string' ? ci.phone : ''
}

function areaStr(area: string | null): string {
  return area ?? ''
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const { allOffers, totalPartners } = await getExploreData()

  // Serialize dates + JSON fields for client
  const serializedOffers = allOffers.map(o => ({
    id:              o.id,
    title:           o.title,
    shortDesc:       o.shortDesc,
    description:     o.description,
    category:        o.category,
    tierEligibility: o.tierEligibility,
    pointsEligible:  o.pointsEligible,
    pointsAward:     o.pointsAward,
    redemptionType:  o.redemptionType as 'SHOW_ON_SCREEN' | 'CODE' | 'CONCIERGE_CONFIRM',
    redemptionCode:  o.redemptionCode,
    redemptionSteps: Array.isArray(o.redemptionSteps) ? o.redemptionSteps as string[] : [],
    termsConditions: o.termsConditions,
    imageUrl:        o.imageUrl,
    validTo:         o.validTo?.toISOString() ?? null,
    isFeatured:      o.isFeatured,
    partner: {
      name:        o.partner.name,
      category:    o.partner.category,
      area:        o.partner.area,
      city:        o.partner.city,
      contactInfo: o.partner.contactInfo,
    },
  }))

  return (
    <>
      {/* ── Header ── */}
      <div className="hdr" style={{ paddingBottom: 0 }}>
        <div className="pe">Discover Lagos</div>
        <div className="pt">Your City, <span className="pti">Elevated</span></div>
      </div>

      {/* ── Dining Entry Banner ── */}
      <Link href="/dining" className="din-banner" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="din-banner-bg" />
        <div className="din-banner-orb" />
        <div className="din-banner-in">
          <div className="din-banner-left">
            <div className="din-banner-em">🍽️</div>
            <div>
              <div className="din-banner-title">Curated Dining</div>
              <div className="din-banner-sub">Reserve tables at Lagos&apos;s finest restaurants</div>
            </div>
          </div>
          <div className="din-banner-cta">Book Now →</div>
        </div>
      </Link>

      {/* ── Interactive offer sections (stats, featured, categories, emergency) ── */}
      <ExploreOffersClient offers={serializedOffers} totalPartners={totalPartners} />

    </>
  )
}
