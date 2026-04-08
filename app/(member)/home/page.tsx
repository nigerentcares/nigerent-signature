/**
 * /home — Member Dashboard
 *
 * Server Component: fetches live member + content data via Prisma.
 * Renders: Welcome → Restaurants → Experiences → Places to Visit
 *          → Things to Do → Member Discounts → City Guide → Concierge
 */

import { redirect }   from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }      from '@/lib/prisma'
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
  const [dbUser, pointsAgg, savedCount, unreadCount, upcomingDining] =
    await Promise.all([
      prisma.user.findUnique({
        where:   { id: userId },
        include: { membership: { include: { tier: true } } },
      }),
      prisma.pointsLedger.aggregate({
        where: { userId },
        _sum:  { points: true },
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

  const points = pointsAgg._sum.points ?? 0

  return { dbUser, points, savedCount, unreadCount, upcomingDining }
}

async function getDashboardContent(city: string) {
  const [allRestaurants, discountOffers, experienceOffers] = await Promise.all([
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

    prisma.offer.findMany({
      where: {
        status:   'ACTIVE',
        category: { in: ['Wellness & Spa', 'Nightlife', 'Transport', 'Supermarket', 'Pharmacy', 'Restaurant'] },
      },
      include: { partner: { select: { name: true, area: true } } },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      take: 6,
    }),

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

  const restaurants: DashRestaurant[] = [
    ...allRestaurants.filter(r => r.city === city),
    ...allRestaurants.filter(r => r.city !== city),
  ].slice(0, 6)

  return {
    restaurants,
    discountOffers: discountOffers as PartnerOffer[],
    experienceOffers: experienceOffers as PartnerOffer[],
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────

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

const DISC_CARD_CLASSES = ['db1', 'db2', 'db3'] as const
const EXP_CARD_CLASSES  = ['ei1', 'ei2', 'ei3'] as const

// Unsplash photos for experience categories
const EXP_PHOTOS: Record<string, string[]> = {
  'Arts & Culture':     ['photo-1518998053901-5348d3961a04', 'photo-1510525009579-5bd35e6dc5d2', 'photo-1571115764595-644a1f56a55c'],
  'Entertainment':      ['photo-1489599849927-2ee91cede3ba', 'photo-1536440136628-849c177e76a1', 'photo-1574267432553-4b4628081c31'],
  'Nature & Adventure': ['photo-1441974231531-c6227db76b6e', 'photo-1507525428034-b723cf961d3e', 'photo-1506905925346-21bda4d32df4'],
  'Nightlife':          ['photo-1566417713940-fe7c737a9ef2', 'photo-1514525253161-7a46d19cd819', 'photo-1572116469696-31de0f17cc34'],
  'Fitness & Sports':   ['photo-1571019614242-c5c5dee9f50b', 'photo-1544161515-4ab6ce6db874', 'photo-1540555700478-4be289fbecef'],
}
function expPhotoUrl(category: string, index: number): string | null {
  const ids = EXP_PHOTOS[category]
  if (!ids) return null
  return `https://images.unsplash.com/${ids[index % ids.length]}?w=400&q=75&auto=format&fit=crop`
}

function formatExpiry(d: Date | null): string {
  if (!d) return 'Ongoing'
  return `Ends ${d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// ── Curated "Places to Visit" with Unsplash photos ─────────────────────────
const PLACES_TO_VISIT = [
  { title: 'Lekki Conservation Centre', area: 'Lekki, Lagos',    img: 'photo-1441974231531-c6227db76b6e', tag: 'Nature' },
  { title: 'Nike Art Gallery',          area: 'Lekki, Lagos',    img: 'photo-1518998053901-5348d3961a04', tag: 'Arts' },
  { title: 'Tarkwa Bay Beach',          area: 'Lagos Island',    img: 'photo-1507525428034-b723cf961d3e', tag: 'Beach' },
  { title: 'Jabi Lake Mall',            area: 'Abuja',           img: 'photo-1552083375-1447ce886485', tag: 'Leisure' },
  { title: 'Olumo Rock',                area: 'Abeokuta',        img: 'photo-1464822759023-fed622ff2c3b', tag: 'Adventure' },
  { title: 'Elegushi Royal Beach',      area: 'Ikate, Lagos',    img: 'photo-1519046904884-53103b34b206', tag: 'Beach' },
]

// ── Curated "Things to Do" ─────────────────────────────────────────────────
const THINGS_TO_DO = [
  { title: 'Book a Spa Day', desc: 'Unwind at a member-exclusive wellness retreat', icon: '🧖', color: 'rgba(31,163,166,.12)', accent: '#1fa3a6' },
  { title: 'Private Dining', desc: 'Reserve a chef\'s table experience', icon: '🍷', color: 'rgba(212,175,55,.12)', accent: '#d4af37' },
  { title: 'Weekend Getaway', desc: 'Curated short stays outside the city', icon: '🏡', color: 'rgba(39,174,96,.12)', accent: '#27ae60' },
  { title: 'Art & Culture', desc: 'Gallery tours and live performances', icon: '🎭', color: 'rgba(155,89,182,.12)', accent: '#9b59b6' },
  { title: 'Fitness Class', desc: 'Exclusive access to premium gyms & studios', icon: '🏋️', color: 'rgba(52,152,219,.12)', accent: '#3498db' },
  { title: 'Nightlife', desc: 'VIP tables and member-only events', icon: '🥂', color: 'rgba(232,68,58,.12)', accent: '#e8443a' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?reason=session_expired')

  const data = await getMemberData(user.id)
  if (!data) redirect('/login?reason=session_expired')

  const { dbUser, points, savedCount, unreadCount, upcomingDining } = data
  const tier         = dbUser.membership?.tier
  const tierName     = tier?.name ?? 'Signature'
  const memberNumber = dbUser.membership?.memberNumber ?? '—'
  const city         = dbUser.city ?? 'Lagos'
  const firstName    = (dbUser.name ?? 'Member').split(' ')[0]

  const { restaurants, discountOffers, experienceOffers } =
    await getDashboardContent(city)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <>
      {/* ══ WELCOME HEADER ══ */}
      <div className="hdr" style={{ paddingBottom: 20 }}>
        {/* Brand Row */}
        <div className="brand-row">
          <div>
            <div className="brand-name">Signature Lifestyle</div>
            <div className="brand-by">by Nigerent</div>
          </div>
          <div className="hdr-r">
            <Link href="/notifications" style={{ textDecoration: 'none' }}>
              <div className="nb2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    stroke="rgba(201,206,214,.5)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {unreadCount > 0 && <div className="npip" />}
              </div>
            </Link>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div className="av">{getInitials(dbUser.name ?? 'Member')}</div>
            </Link>
          </div>
        </div>

        {/* Welcome message */}
        <div className="home-welcome">
          <div className="home-greeting">{getGreeting()},</div>
          <div className="home-name">{firstName}</div>
          <div className="home-meta-row">
            <div className="home-id">
              <span className="home-id-lbl">Member ID</span>
              <span className="home-id-val">{memberNumber}</span>
            </div>
            <div className="home-tier-pill">
              <span style={{ color: 'var(--gold)', fontSize: 10 }}>&#10022;</span>
              <span>{tierName}</span>
            </div>
          </div>
          <div className="home-date">{today}</div>
        </div>

        {/* Quick stats */}
        <div className="home-stats">
          <Link href="/wallet" className="home-stat" style={{ textDecoration: 'none' }}>
            <div className="home-stat-val">{points.toLocaleString()}</div>
            <div className="home-stat-lbl">Points</div>
          </Link>
          <Link href="/explore" className="home-stat" style={{ textDecoration: 'none' }}>
            <div className="home-stat-val">{savedCount}</div>
            <div className="home-stat-lbl">Saved</div>
          </Link>
          <Link href="/chat" className="home-stat" style={{ textDecoration: 'none' }}>
            <div className="home-stat-val home-stat-accent">Online</div>
            <div className="home-stat-lbl">Concierge</div>
          </Link>
        </div>
      </div>

      {/* ══ UPCOMING RESERVATION ══ */}
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

      {/* ══ RESTAURANTS ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Restaurants</div>
          <Link href="/dining" className="sh2-l" style={{ textDecoration: 'none' }}>View All &#8594;</Link>
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
              <Link key={r.id} href={`/dining/${r.id}`} style={{ textDecoration: 'none' }}>
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
                      <div className="rc-dist">&#128205; {r.area}{r.city !== city ? `, ${r.city}` : ''}</div>
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

      {/* ══ EXPERIENCES ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Experiences</div>
          <Link href="/explore" className="sh2-l" style={{ textDecoration: 'none' }}>View All &#8594;</Link>
        </div>
        <div className="hscr">
          {experienceOffers.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'rgba(201,206,214,.35)', fontSize: 13 }}>
              Member experiences coming soon.
            </div>
          ) : (
            experienceOffers.slice(0, 4).map((offer, i) => {
              const tagInfo  = CAT_TAG[offer.category] ?? { label: offer.category, cls: 'stb' }
              const photoUrl = expPhotoUrl(offer.category, i)
              return (
                <Link key={offer.id} href="/explore" style={{ textDecoration: 'none' }}>
                  <div className="ecard">
                    <div
                      className={`ecard-img ${photoUrl ? '' : EXP_CARD_CLASSES[i % 3]}`}
                      style={photoUrl ? {
                        backgroundImage: `url(${photoUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      } : undefined}
                    >
                      {photoUrl && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,.1) 0%, rgba(0,0,0,.55) 100%)',
                        }} />
                      )}
                      {!photoUrl && <div className="e-em">{EXP_EMOJI[offer.category] ?? '✦'}</div>}
                      <div className="e-dc" style={{ position: 'relative', zIndex: 1 }}>
                        {formatEventDate(offer.validFrom)}
                      </div>
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

      {/* ══ PLACES TO VISIT ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Places to Visit</div>
          <Link href="/explore" className="sh2-l" style={{ textDecoration: 'none' }}>View All &#8594;</Link>
        </div>
        <div className="hscr">
          {PLACES_TO_VISIT.map((place, i) => (
            <div key={i} className="pv-card">
              <div
                className="pv-img"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/${place.img}?w=320&q=75&auto=format&fit=crop)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="pv-scrim" />
                <div className="pv-tag">{place.tag}</div>
              </div>
              <div className="pv-body">
                <div className="pv-title">{place.title}</div>
                <div className="pv-area">&#128205; {place.area}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ THINGS TO DO ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Things to Do</div>
        </div>
        <div className="ttd-grid">
          {THINGS_TO_DO.map((item, i) => (
            <Link key={i} href="/explore" style={{ textDecoration: 'none' }}>
              <div className="ttd-card" style={{ background: item.color }}>
                <div className="ttd-icon">{item.icon}</div>
                <div className="ttd-title" style={{ color: item.accent }}>{item.title}</div>
                <div className="ttd-desc">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ MEMBER DISCOUNTS ══ */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">Member Discounts</div>
          <Link href="/explore" className="sh2-l" style={{ textDecoration: 'none' }}>View All &#8594;</Link>
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

      {/* ══ CITY GUIDE STRIP ══ */}
      <div className="sec">
        <div className="guide-strip">
          <div className="guide-g" />
          <div className="guide-ico">&#128506;</div>
          <div className="guide-txt">
            <div className="guide-eye">Member Guide</div>
            <div className="guide-ttl">
              {city}: The insider&apos;s edit
            </div>
            <div className="guide-sub">Curated spots &middot; Updated this week</div>
          </div>
          <div style={{ fontSize: 20, color: 'rgba(201,206,214,.25)' }}>&#8250;</div>
        </div>
      </div>

      {/* ══ CONCIERGE STRIP ══ */}
      <div className="sec">
        <Link href="/chat" style={{ textDecoration: 'none' }}>
          <div className="conc-strip2">
            <div className="conc-av2">&#128075;</div>
            <div className="conc-txt2">
              <div className="conc-n2">Your concierge is available</div>
              <div className="conc-s2">Reservations, transport, anything you need</div>
            </div>
            <div className="conc-cta2">Chat &#8594;</div>
          </div>
        </Link>
      </div>

      {/* Bottom padding for nav */}
      <div className="gap" />
      <div className="gap" />
    </>
  )
}
