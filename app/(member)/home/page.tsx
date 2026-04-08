/**
 * /home — Member Dashboard
 *
 * Server Component: fetches live member + content data via Prisma.
 * Renders: MemberCard → UpcomingStay → Restaurants Near You
 *          → Member Discounts → What's On → City Guide → Concierge strip
 *
 * Content sections are populated from the live database (restaurants, partners,
 * offers). Each section falls back to an empty-state card when no data exists.
 */

import { redirect }   from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }      from '@/lib/prisma'
import MemberCard      from '@/components/member/MemberCard'
import Link            from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type PartnerOffer = {
  id:          string
  title:       string
  shortDesc:   string
  category:    string
  validTo:     Date | null
  validFrom:   Date
  isFeatured:  boolean
  partner: {
    name: string
    area: string | null
  }
}

type DashRestaurant = {
  id:           string
  name:         string
  cuisine:      string
  area:         string
  city:         string
  memberBenefit: string | null
  isFeatured:   boolean
  imageUrls:    string[]
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function getMemberData(userId: string) {
  const now = new Date()
  const [dbUser, pointsAgg, walletLoads, walletSpend, savedCount, unreadCount, upcomingDining] =
    await Promise.all([
      prisma.user.findUnique({
        where:   { id: userId },
        include: { membership: { include: { tier: true } } },
      }),
      prisma.pointsLedger.aggregate({
        where: { userId },
        _sum:  { points: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { userId, status: 'COMPLETED', type: { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] } },
        _sum:  { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { userId, status: 'COMPLETED', type: 'SPEND' },
        _sum:  { amount: true },
      }),
      prisma.savedItem.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.diningRequest.findFirst({
        where:   { userId, status: 'CONFIRMED', preferredDate: { gte: now } },
        orderBy: { preferredDate: 'asc' },
        include: { restaurant: { select: { name: true, area: true, city: true } } },
      }),
    ])

  if (!dbUser) return null

  const points        = pointsAgg._sum.points ?? 0
  const walletBalance = Math.floor(
    ((walletLoads._sum.amount ?? 0) - (walletSpend._sum.amount ?? 0)) / 100
  )

  return { dbUser, points, walletBalance, savedCount, unreadCount, upcomingDining }
}

async function getDashboardContent(city: string) {
  const [allRestaurants, discountOffers, experienceOffers] = await Promise.all([
    // Restaurants: featured first, user city preferred
    prisma.restaurant.findMany({
      where:   { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      take:    12,
      select: {
        id: true, name: true, cuisine: true,
        area: true, city: true, memberBenefit: true, isFeatured: true,
        imageUrls: true,
      },
    }),

    // Lifestyle / discount offers
    prisma.offer.findMany({
      where: {
        status:   'ACTIVE',
        category: { in: ['Wellness & Spa', 'Nightlife', 'Transport', 'Supermarket', 'Pharmacy', 'Restaurant'] },
      },
      include: { partner: { select: { name: true, area: true } } },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      take: 6,
    }),

    // Experience / events offers
    prisma.offer.findMany({
      where: {
        status:   'ACTIVE',
        category: { in: ['Arts & Culture', 'Entertainment', 'Nature & Adventure', 'Nightlife', 'Fitness & Sports'] },
      },
      include: { partner: { select: { name: true, area: true } } },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      take: 6,
    }),
  ])

  // City-preferred sort: member's city first, then rest
  const restaurants: DashRestaurant[] = [
    ...allRestaurants.filter(r => r.city === city),
    ...allRestaurants.filter(r => r.city !== city),
  ].slice(0, 4)

  return {
    restaurants,
    discountOffers: discountOffers as PartnerOffer[],
    experienceOffers: experienceOffers as PartnerOffer[],
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────

const CUISINE_EMOJI: Record<string, string> = {
  'nigerian':        '🍽️',
  'african':         '🍽️',
  'japanese':        '🍱',
  'asian':           '🥢',
  'chinese':         '🥡',
  'italian':         '🍝',
  'continental':     '🍴',
  'mediterranean':   '🫒',
  'seafood':         '🦐',
  'grill':           '🥩',
  'steakhouse':      '🥩',
  'pizza':           '🍕',
  'bar':             '🥂',
  'cocktail':        '🍸',
  'fine dining':     '🥂',
  'brunch':          '☕',
  'cafe':            '☕',
  'indian':          '🍛',
  'lebanese':        '🧆',
  'sushi':           '🍣',
}

function cuisineEmoji(cuisine: string): string {
  const key = cuisine.toLowerCase()
  for (const [k, v] of Object.entries(CUISINE_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '🍽️'
}

const CARD_IMG_CLASSES = ['ri1', 'ri2', 'ri3', 'ri4'] as const

// ── Unsplash photo fallback per cuisine (same pool as DiningClient) ───────────
const CUISINE_PHOTOS: Record<string, string[]> = {
  'Nigerian':    ['photo-1604329760661-e71dc83f8f26', 'photo-1567188040759-fb8a883dc6d8'],
  'Japanese':    ['photo-1617196034183-421b4040ed20', 'photo-1562802378-063ec186a863', 'photo-1611143669185-af224c5e3252'],
  'Italian':     ['photo-1555396273-367ea4eb4db5', 'photo-1481931098730-318b6f776db0', 'photo-1414235077428-338989a2e8c0'],
  'Continental': ['photo-1517248135467-4c7edcad34c4', 'photo-1466978913421-dad2ebd01d17', 'photo-1424847651672-bf20a4b0982b'],
  'Seafood':     ['photo-1484659619207-9165d119dafe', 'photo-1559737558-2f5a35f4523b', 'photo-1615361200141-f45040f367be'],
  'Steakhouse':  ['photo-1432139555190-58524dae6a55', 'photo-1558030137-a56c1b004fa4', 'photo-1544025162-d76694265947'],
  'Pan-African': ['photo-1567188040759-fb8a883dc6d8', 'photo-1604329760661-e71dc83f8f26'],
  'Asian':       ['photo-1569718212165-3a8278d5f624', 'photo-1617196034099-f87e6c99c0c1'],
  'French':      ['photo-1414235077428-338989a2e8c0', 'photo-1551218808-94e220e084d2'],
  'Lebanese':    ['photo-1547592166-23ac45744acd', 'photo-1528735602780-2552fd46c7af'],
  'Indian':      ['photo-1585937421612-70a008356fbe', 'photo-1631515243349-e0cb75fb8d3a'],
}
const FALLBACK_DINING = [
  'photo-1517248135467-4c7edcad34c4',
  'photo-1414235077428-338989a2e8c0',
  'photo-1555396273-367ea4eb4db5',
  'photo-1424847651672-bf20a4b0982b',
  'photo-1466978913421-dad2ebd01d17',
]
function dashRestaurantPhoto(r: DashRestaurant, index: number): string {
  if (r.imageUrls?.[0]) return r.imageUrls[0]
  let ids = FALLBACK_DINING
  const cuisine = r.cuisine.toLowerCase()
  for (const [key, photos] of Object.entries(CUISINE_PHOTOS)) {
    if (cuisine.includes(key.toLowerCase())) { ids = photos; break }
  }
  return `https://images.unsplash.com/${ids[index % ids.length]}?w=400&q=75&auto=format&fit=crop`
}
const DISC_CARD_CLASSES = ['db1', 'db2', 'db3'] as const
const EXP_CARD_CLASSES  = ['ei1', 'ei2', 'ei3'] as const

const CAT_TAG: Record<string, { label: string; style?: React.CSSProperties; cls?: string }> = {
  'Wellness & Spa':     { label: 'Wellness',  cls: 'stb st-t' },
  'Nightlife':          { label: 'Nightlife', cls: 'stb st-g' },
  'Transport':          { label: 'Transport', cls: 'stb', style: { background: 'rgba(160,80,220,.14)', color: '#c090f5', border: '1px solid rgba(160,80,220,.2)' } },
  'Supermarket':        { label: 'Shopping',  cls: 'stb', style: { background: 'rgba(230,126,34,.12)', color: '#e67e22', border: '1px solid rgba(230,126,34,.2)' } },
  'Pharmacy':           { label: 'Pharmacy',  cls: 'stb', style: { background: 'rgba(231,76,60,.12)', color: '#e74c3c', border: '1px solid rgba(231,76,60,.2)' } },
  'Restaurant':         { label: 'Dining',    cls: 'stb', style: { background: 'rgba(212,135,15,.12)', color: '#d4870f', border: '1px solid rgba(212,135,15,.2)' } },
  'Arts & Culture':     { label: 'Arts',      cls: 'stb', style: { background: 'rgba(200,168,75,.12)', color: '#c8a84b', border: '1px solid rgba(200,168,75,.2)' } },
  'Entertainment':      { label: 'Events',    cls: 'stb', style: { background: 'rgba(155,89,182,.12)', color: '#9b59b6', border: '1px solid rgba(155,89,182,.2)' } },
  'Nature & Adventure': { label: 'Nature',    cls: 'stb', style: { background: 'rgba(39,174,96,.12)',  color: '#27ae60', border: '1px solid rgba(39,174,96,.2)' } },
  'Fitness & Sports':   { label: 'Fitness',   cls: 'stb', style: { background: 'rgba(52,152,219,.12)', color: '#3498db', border: '1px solid rgba(52,152,219,.2)' } },
}

const EXP_EMOJI: Record<string, string> = {
  'Arts & Culture':     '🎨',
  'Entertainment':      '🎬',
  'Nature & Adventure': '🌿',
  'Nightlife':          '🎶',
  'Fitness & Sports':   '💪',
}

function formatExpiry(d: Date | null): string {
  if (!d) return 'Ongoing'
  return `Ends ${d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?reason=session_expired')

  const data = await getMemberData(user.id)
  if (!data) redirect('/login?reason=session_expired')

  const { dbUser, points, walletBalance, savedCount, unreadCount, upcomingDining } = data
  const tier         = dbUser.membership?.tier
  const tierName     = tier?.name ?? 'Signature'
  const memberNumber = dbUser.membership?.memberNumber ?? '—'
  const city         = dbUser.city ?? 'Lagos'

  const { restaurants, discountOffers, experienceOffers } =
    await getDashboardContent(city)

  return (
    <>
      {/* ══ MEMBER CARD ══ */}
      <MemberCard
        name={dbUser.name ?? 'Member'}
        memberNumber={memberNumber}
        tierName={tierName}
        points={points}
        walletBalance={walletBalance}
        savedCount={savedCount}
        city={city}
        unreadCount={unreadCount}
      />

      {/* ══ UPCOMING RESERVATION ══ (only shown when a confirmed dining request exists) */}
      {upcomingDining && (
        <div className="sec">
          <div className="res-card">
            <div className="res-g" />
            <div className="res-top">
              <div className="res-st">
                <div className="res-dot" />
                <span className="res-lbl">Upcoming Reservation</span>
              </div>
              <div className="res-dt">
                {upcomingDining.preferredDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                {' · '}{upcomingDining.preferredTime}
              </div>
            </div>
            <div className="res-pr">{upcomingDining.restaurant.name}</div>
            <div className="res-de">
              {upcomingDining.restaurant.area}, {upcomingDining.restaurant.city}
              {upcomingDining.partySize > 1 ? ` · ${upcomingDining.partySize} guests` : ''}
            </div>
            <div className="res-ac">
              <Link href="/dining" className="rb rb-p" style={{ textDecoration: 'none', display: 'inline-block' }}>View Details</Link>
              <Link href="/chat"   className="rb rb-g" style={{ textDecoration: 'none', display: 'inline-block' }}>Concierge</Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESTAURANTS NEAR YOU ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Restaurants Near You</div>
          <Link href="/dining" className="sh2-l" style={{ textDecoration: 'none' }}>See All →</Link>
        </div>
        <div className="hscr">
          {restaurants.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'rgba(201,206,214,.35)', fontSize: 13 }}>
              Curated restaurants coming soon.
            </div>
          ) : (
            restaurants.map((r, i) => {
              const photoUrl = dashRestaurantPhoto(r, i)
              return (
              <Link key={r.id} href="/dining" style={{ textDecoration: 'none' }}>
                <div className="rcard">
                  <div
                    className="rcard-img"
                    style={{
                      backgroundImage: `url(${photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* scrim for text legibility */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.5) 100%)',
                    }} />
                    <div
                      className={`rtag ${r.isFeatured ? 'rtag-m' : 'rtag-o'}`}
                      style={{ position: 'relative', zIndex: 1 }}
                    >
                      {r.isFeatured ? 'Member Perk' : 'Member Access'}
                    </div>
                  </div>
                  <div className="rcard-body">
                    <div className="rc-n">{r.name}</div>
                    <div className="rc-cu">{r.cuisine}</div>
                    <div className="rc-f">
                      <div className="rc-dist">📍 {r.area}{r.city !== city ? `, ${r.city}` : ''}</div>
                      {r.memberBenefit && (
                        <div className="rc-ben">{r.memberBenefit}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ══ MEMBER DISCOUNTS ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Member Discounts</div>
          <Link href="/explore" className="sh2-l" style={{ textDecoration: 'none' }}>View All →</Link>
        </div>
        <div className="hscr">
          {discountOffers.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'rgba(201,206,214,.35)', fontSize: 13 }}>
              Partner offers are being curated.
            </div>
          ) : (
            discountOffers.slice(0, 3).map((offer, i) => {
              const tagInfo = CAT_TAG[offer.category] ?? { label: offer.category, cls: 'stb' }
              return (
                <Link key={offer.id} href="/explore" style={{ textDecoration: 'none' }}>
                  <div className={`dcard ${DISC_CARD_CLASSES[i % 3]}`}>
                    <div className={`dco dco${(i % 3) + 1}`} />
                    <div className="dc-in">
                      <div>
                        <div className="dc-pn">{offer.partner.name}</div>
                        <div className="dc-of">{offer.shortDesc || offer.title}</div>
                      </div>
                      <div className="dc-ft">
                        <span className={tagInfo.cls ?? 'stb'} style={tagInfo.style}>
                          {tagInfo.label}
                        </span>
                        <div className="dc-ex">{formatExpiry(offer.validTo)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ══ WHAT'S ON ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">What&apos;s On This Weekend</div>
          <Link href="/explore" className="sh2-l" style={{ textDecoration: 'none' }}>See All →</Link>
        </div>
        <div className="hscr">
          {experienceOffers.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'rgba(201,206,214,.35)', fontSize: 13 }}>
              Member events coming soon.
            </div>
          ) : (
            experienceOffers.slice(0, 3).map((offer, i) => {
              const tagInfo = CAT_TAG[offer.category] ?? { label: offer.category, cls: 'stb' }
              return (
                <Link key={offer.id} href="/explore" style={{ textDecoration: 'none' }}>
                  <div className="ecard">
                    <div className={`ecard-img ${EXP_CARD_CLASSES[i % 3]}`}>
                      <div className="e-em">{EXP_EMOJI[offer.category] ?? '✦'}</div>
                      <div className="e-dc">{formatEventDate(offer.validFrom)}</div>
                    </div>
                    <div className="ecard-body">
                      <div className="ec-t">{offer.title}</div>
                      <div className="ec-v">
                        {offer.partner.name}{offer.partner.area ? `, ${offer.partner.area}` : ''}
                      </div>
                      <div className="ec-f">
                        <div className="ec-p">{offer.shortDesc}</div>
                        <div className="ec-tag" style={tagInfo.style}>{tagInfo.label}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ══ CITY GUIDE STRIP ══ */}
      <div className="sec">
        <div className="guide-strip">
          <div className="guide-g" />
          <div className="guide-ico">🗺️</div>
          <div className="guide-txt">
            <div className="guide-eye">Member Guide</div>
            <div className="guide-ttl">
              {city}: The insider&apos;s edit
            </div>
            <div className="guide-sub">Curated spots · Updated this week</div>
          </div>
          <div style={{ fontSize: 20, color: 'rgba(201,206,214,.25)' }}>›</div>
        </div>
      </div>

      {/* ══ CONCIERGE STRIP ══ */}
      <div className="sec">
        <Link href="/chat" style={{ textDecoration: 'none' }}>
          <div className="conc-strip2">
            <div className="conc-av2">👋</div>
            <div className="conc-txt2">
              <div className="conc-n2">Your concierge is available</div>
              <div className="conc-s2">Reservations, transport, anything you need</div>
            </div>
            <div className="conc-cta2">Chat →</div>
          </div>
        </Link>
      </div>

      {/* Bottom padding for nav */}
      <div className="gap" />
      <div className="gap" />
    </>
  )
}
