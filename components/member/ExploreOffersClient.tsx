'use client'
/**
 * ExploreOffersClient — renders all offer sections with OfferSheet on tap.
 * Owns the AI search bar and category pills so both filter reactively.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter }         from 'next/navigation'
import OfferSheet from './OfferSheet'

// ── AI Search result type ────────────────────────────────────────────────────
interface AIResult {
  id:     string
  type:   'restaurant' | 'offer'
  reason: string
  data:   {
    name?:          string
    title?:         string
    cuisine?:       string
    area?:          string | null
    city?:          string
    priceLevel?:    number
    memberBenefit?: string | null
    ambianceTags?:  string[]
    shortDesc?:     string
    partnerName?:   string
    category?:      string
  }
}

interface Offer {
  id:              string
  title:           string
  shortDesc:       string
  description:     string
  category:        string
  tierEligibility: string[]
  pointsEligible:  boolean
  pointsAward:     number | null
  redemptionType:  'SHOW_ON_SCREEN' | 'CODE' | 'CONCIERGE_CONFIRM'
  redemptionCode:  string | null
  redemptionSteps: string[]
  termsConditions: string | null
  imageUrl:        string | null
  validTo:         string | null
  isFeatured:      boolean
  partner: {
    name:     string
    category: string
    area:     string | null
    city:     string
    contactInfo: unknown
  }
}

interface ExploreRestaurant {
  id:            string
  name:          string
  cuisine:       string
  city:          string
  area:          string
  priceLevel:    number
  memberBenefit: string | null
  imageUrls:     string[]
  isFeatured:    boolean
  ambianceTags:  string[]
}

interface Props {
  offers:        Offer[]
  totalPartners: number
  restaurants?:  ExploreRestaurant[]
  hasDiningBanner?: boolean
}

const CAT_PILLS = [
  { label: 'All',           icon: '✦',  key: null },
  { label: 'Dining',        icon: '🍽️', key: 'Restaurant' },
  { label: 'Wellness',      icon: '🧖', key: 'Wellness & Spa' },
  { label: 'Experiences',   icon: '🎭', key: 'Arts & Culture' },
  { label: 'Entertainment', icon: '🎬', key: 'Entertainment' },
  { label: 'Nature',        icon: '🌿', key: 'Nature & Adventure' },
  { label: 'Nightlife',     icon: '🥂', key: 'Nightlife' },
  { label: 'Supermarkets',  icon: '🛒', key: 'Supermarket' },
  { label: 'Pharmacies',    icon: '💊', key: 'Pharmacy' },
  { label: 'Hospitals',     icon: '🏥', key: 'Hospital & Medical' },
] as const

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

// New order: Experiences first, then Wellness, then Dining (with banner), then rest
const SECTION_ORDER = [
  'Arts & Culture', 'Entertainment', 'Nature & Adventure',
  'Wellness & Spa',
  'Restaurant',
  'Nightlife', 'Supermarket', 'Pharmacy', 'Hospital & Medical',
]

// How many items to show per section before "View All"
const SECTION_LIMIT = 4

// ── Real Unsplash photo IDs per category ─────────────────────────────────────
// Multiple per category so adjacent cards look distinct
const CATEGORY_PHOTOS: Record<string, string[]> = {
  'Restaurant': [
    'photo-1517248135467-4c7edcad34c4', // warm upscale interior
    'photo-1414235077428-338989a2e8c0', // beautifully plated dish
    'photo-1555396273-367ea4eb4db5',    // stylish bar/dining room
    'photo-1424847651672-bf20a4b0982b', // elegant outdoor terrace
    'photo-1466978913421-dad2ebd01d17', // candlelit fine dining
    'photo-1504674900247-0877df9cc836', // plated food overhead
    'photo-1551218808-94e220e084d2',    // restaurant booth
    'photo-1484659619207-9165d119dafe', // grilled seafood
  ],
  'Wellness & Spa': [
    'photo-1540555700478-4be289fbecef', // spa treatment room
    'photo-1544161515-4ab6ce6db874',    // hot stone massage
    'photo-1600334089648-b0d9d3028eb2', // luxury spa pool
    'photo-1571019614242-c5c5dee9f50b', // wellness stretching
    'photo-1515377905703-c4788e51af15', // serene spa atmosphere
  ],
  'Nightlife': [
    'photo-1566417713940-fe7c737a9ef2', // luxe nightclub
    'photo-1514525253161-7a46d19cd819', // rooftop bar at night
    'photo-1516450360452-9312f5e86fc7', // neon club interior
    'photo-1572116469696-31de0f17cc34', // cocktails bar
    'photo-1581899765987-d4d26059d901', // jazz lounge
  ],
  'Arts & Culture': [
    'photo-1510525009579-5bd35e6dc5d2', // modern art gallery
    'photo-1571115764595-644a1f56a55c', // theater stage
    'photo-1518998053901-5348d3961a04', // museum interior
    'photo-1580893246395-52aead8960dc', // contemporary art
  ],
  'Entertainment': [
    'photo-1489599849927-2ee91cede3ba', // cinema theater
    'photo-1536440136628-849c177e76a1', // movie screening
    'photo-1574267432553-4b4628081c31', // bowling / games lounge
  ],
  'Nature & Adventure': [
    'photo-1441974231531-c6227db76b6e', // sunlit forest path
    'photo-1518539396202-f37f61f68e43', // adventure landscape
    'photo-1507525428034-b723cf961d3e', // beach
    'photo-1506905925346-21bda4d32df4', // mountains
  ],
}

const UNSPLASH = 'https://images.unsplash.com'

/** Return a curated Unsplash image URL for an offer, cycling through the pool.
 *  Prefer curated Unsplash photos for categories that have them — DB imageUrls
 *  can be stale/broken, and the curated pool always looks correct. */
function offerImageUrl(o: Offer, index: number): string | null {
  const ids = CATEGORY_PHOTOS[o.partner.category]
  if (ids && ids.length > 0) {
    return `${UNSPLASH}/${ids[index % ids.length]}?w=400&q=75&auto=format&fit=crop`
  }
  if (o.imageUrl) return o.imageUrl
  return null
}

function ratingStr(ci: unknown) {
  if (!ci || typeof ci !== 'object') return ''
  const c = ci as Record<string, unknown>
  return typeof c.rating === 'number' ? `${c.rating} ★` : ''
}
function phoneStr(ci: unknown) {
  if (!ci || typeof ci !== 'object') return ''
  const c = ci as Record<string, unknown>
  return typeof c.phone === 'string' ? c.phone : ''
}

// ── Component ─────────────────────────────────────────────────────────────────

const PRICE_LABEL = ['', '₦', '₦₦', '₦₦₦', '₦₦₦₦']

const CUISINE_PHOTOS: Record<string, string> = {
  'Nigerian':    'photo-1604329760661-e71dc83f8f26',
  'Japanese':    'photo-1617196034183-421b4040ed20',
  'Italian':     'photo-1555396273-367ea4eb4db5',
  'Continental': 'photo-1517248135467-4c7edcad34c4',
  'Seafood':     'photo-1484659619207-9165d119dafe',
  'Steakhouse':  'photo-1432139555190-58524dae6a55',
  'Pan-Asian':   'photo-1562802378-063ec186a863',
  'Indian':      'photo-1585937421612-70a008356fbe',
  'Chinese':     'photo-1563245372-f21724e3856d',
}

function restaurantImgUrl(r: ExploreRestaurant): string {
  if (r.imageUrls.length > 0 && r.imageUrls[0]) return r.imageUrls[0]
  const photoId = CUISINE_PHOTOS[r.cuisine] ?? 'photo-1517248135467-4c7edcad34c4'
  return `${UNSPLASH}/${photoId}?w=400&q=75&auto=format&fit=crop`
}

export default function ExploreOffersClient({ offers, totalPartners, restaurants = [] }: Props) {
  const router = useRouter()
  const [selected,  setSelected]  = useState<Offer | null>(null)
  const [query,     setQuery]     = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<'All' | 'Lagos' | 'Abuja'>('All')

  // AI Search state
  const [aiQuery,     setAiQuery]     = useState('')
  const [aiResults,   setAiResults]   = useState<AIResult[]>([])
  const [aiSearching, setAiSearching] = useState(false)
  const [aiSearched,  setAiSearched]  = useState(false)
  const aiInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAiSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setAiResults([])
      setAiSearched(false)
      return
    }
    setAiSearching(true)
    setAiSearched(true)
    try {
      const res = await fetch('/api/explore/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiResults(data.results ?? [])
      }
    } catch { /* silent */ }
    finally { setAiSearching(false) }
  }, [])

  function handleAiInput(val: string) {
    setAiQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setAiResults([])
      setAiSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => runAiSearch(val), 800)
  }

  function clearAiSearch() {
    setAiQuery('')
    setAiResults([])
    setAiSearched(false)
    if (aiInputRef.current) aiInputRef.current.focus()
  }

  // Filter restaurants by search + city
  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase()
    const showDining = !activeKey || activeKey === 'Restaurant'
    if (!showDining) return []
    return restaurants.filter(r => {
      const matchesCity = cityFilter === 'All' || r.city === cityFilter
      if (!matchesCity) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.ambianceTags.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [restaurants, query, activeKey, cityFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return offers.filter(o => {
      const matchesCat  = !activeKey || o.partner.category === activeKey
      const matchesCity = cityFilter === 'All' || o.partner.city === cityFilter
      if (!matchesCat || !matchesCity) return false
      if (!q) return true
      return (
        o.title.toLowerCase().includes(q)            ||
        o.partner.name.toLowerCase().includes(q)     ||
        o.partner.category.toLowerCase().includes(q) ||
        (o.partner.area ?? '').toLowerCase().includes(q) ||
        o.shortDesc.toLowerCase().includes(q)
      )
    })
  }, [offers, query, activeKey, cityFilter])

  const grouped = useMemo(() => {
    const m = new Map<string, Offer[]>()
    for (const o of filtered) {
      const cat = o.partner.category
      if (!m.has(cat)) m.set(cat, [])
      m.get(cat)!.push(o)
    }
    return m
  }, [filtered])

  const featured  = offers.find(o => o.isFeatured) ?? null
  const hasData   = offers.length > 0
  const noResults = filtered.length === 0 && filteredRestaurants.length === 0 && (query.trim() !== '' || activeKey !== null)

  const restaurantCount = restaurants.length || offers.filter(o => o.partner.category === 'Restaurant').length
  const healthCount     = offers.filter(o => ['Hospital & Medical', 'Pharmacy'].includes(o.partner.category)).length

  return (
    <>
      {/* ── AI Search bar ── */}
      <div style={{ padding: '0 20px', marginBottom: 4 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(31,163,166,.06)',
          border: '1.5px solid rgba(31,163,166,.18)',
          borderRadius: 16, padding: '12px 16px',
          transition: 'border-color .2s, box-shadow .2s',
          ...(aiSearching ? { borderColor: 'rgba(31,163,166,.4)', boxShadow: '0 0 0 3px rgba(31,163,166,.08)' } : {}),
        }}>
          {aiSearching ? (
            <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(31,163,166,.3)', borderTopColor: '#1fa3a6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            </div>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="#1fa3a6" strokeWidth="2.2"/>
              <path d="m21 21-4.35-4.35" stroke="#1fa3a6" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          )}
          <input
            ref={aiInputRef}
            type="text"
            value={aiQuery}
            onChange={e => handleAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { if (debounceRef.current) clearTimeout(debounceRef.current); runAiSearch(aiQuery) } }}
            placeholder={'Try "date night spot" or "healthy brunch"…'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--dark)', fontSize: 14, fontFamily: 'Urbanist, sans-serif',
              padding: 0,
            }}
          />
          {aiQuery && (
            <button
              onClick={clearAiSearch}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 2px', fontSize: 18, lineHeight: 1 }}
              aria-label="Clear"
            >×</button>
          )}
        </div>
        {!aiSearched && !aiQuery && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['Date night', 'Healthy food', 'Fun with friends', 'Birthday dinner'].map(s => (
              <button
                key={s}
                onClick={() => { setAiQuery(s); runAiSearch(s) }}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: 'rgba(31,163,166,.06)', border: '1px solid rgba(31,163,166,.14)',
                  color: '#1fa3a6', cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Search Results ── */}
      {aiSearched && (
        <div style={{ padding: '8px 20px 4px' }}>
          {aiSearching ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Finding the best matches…</div>
            </div>
          ) : aiResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤔</div>
              <div style={{ fontSize: 14, color: 'var(--dark)', fontWeight: 700, marginBottom: 4 }}>
                No great matches found
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Try a different search or browse categories below.
              </div>
              <button onClick={clearAiSearch} style={{
                padding: '8px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: 'rgba(31,163,166,.08)', border: '1px solid rgba(31,163,166,.2)',
                color: '#1fa3a6', cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
              }}>Clear search</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                Top matches for &ldquo;{aiQuery}&rdquo;
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {aiResults.map((r, i) => {
                  const isRest = r.type === 'restaurant'
                  const color = isRest ? '#d4870f' : (CAT_COLOR[r.data.category ?? ''] ?? '#1fa3a6')
                  const emoji = isRest ? '🍽️' : (CAT_EMOJI[r.data.category ?? ''] ?? '✦')

                  // Find matching offer for sheet
                  const matchOffer = !isRest ? offers.find(o => o.id === r.id) : null

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (isRest) router.push(`/dining/${r.id}`)
                        else if (matchOffer) setSelected(matchOffer)
                      }}
                      style={{
                        display: 'flex', gap: 12, padding: '14px 14px',
                        background: 'rgba(255,255,255,.65)',
                        border: '1px solid rgba(28,28,28,.08)',
                        borderRadius: 16, cursor: 'pointer',
                        transition: 'transform .15s, box-shadow .15s',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Rank badge */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        background: i === 0 ? 'rgba(212,175,55,.12)' : 'rgba(28,28,28,.04)',
                        borderRadius: '16px 0 12px 0', padding: '4px 10px',
                        fontSize: 9, fontWeight: 800, color: i === 0 ? '#d4af37' : 'var(--muted)',
                        letterSpacing: '.3px',
                      }}>
                        #{i + 1}
                      </div>

                      {/* Icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: `${color}12`, border: `1px solid ${color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, marginTop: 4,
                      }}>
                        {emoji}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 2 }}>
                          {isRest ? `${r.data.cuisine} · ${r.data.area}` : `${r.data.partnerName} · ${r.data.category}`}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.3, marginBottom: 4 }}>
                          {isRest ? r.data.name : r.data.title}
                        </div>
                        {/* AI match reason */}
                        <div style={{
                          fontSize: 12, color: 'rgba(28,28,28,.55)', lineHeight: 1.45,
                          fontStyle: 'italic',
                        }}>
                          {r.reason}
                        </div>
                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {isRest && r.data.priceLevel && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${color}10`, color, border: `1px solid ${color}20` }}>
                              {'₦'.repeat(r.data.priceLevel)}
                            </span>
                          )}
                          {isRest && r.data.memberBenefit && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(31,163,166,.08)', color: '#1fa3a6', border: '1px solid rgba(31,163,166,.15)' }}>
                              {r.data.memberBenefit}
                            </span>
                          )}
                          {!isRest && r.data.shortDesc && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${color}10`, color, border: `1px solid ${color}20`, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.data.shortDesc.length > 50 ? r.data.shortDesc.slice(0, 50) + '…' : r.data.shortDesc}
                            </span>
                          )}
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(28,28,28,.04)', color: 'var(--muted)', border: '1px solid rgba(28,28,28,.08)' }}>
                            {isRest ? 'Restaurant' : 'Offer'} →
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={clearAiSearch} style={{
                width: '100%', padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: 'rgba(28,28,28,.03)', border: '1px solid rgba(28,28,28,.08)',
                color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                marginBottom: 8,
              }}>
                Clear search · Browse all
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Below AI search: filters + content (hidden during AI search) ── */}
      {!aiSearched && <>

      {/* ── Filters ── */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Filter by City</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          {(['All', 'Lagos', 'Abuja'] as const).map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: cityFilter === city ? '1px solid var(--teal)' : '1px solid rgba(28,28,28,.15)',
                background: cityFilter === city ? 'rgba(31,163,166,.1)' : 'rgba(28,28,28,.05)',
                color: cityFilter === city ? 'var(--teal)' : 'var(--muted)',
                cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'all .15s',
              }}
            >
              {city === 'All' ? '🌍 All Cities' : city === 'Lagos' ? '🏙️ Lagos' : '🏛️ Abuja'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="cats-outer">
        <span className="cats-label">Filter by Category</span>
        <div className="cats-row">
          {CAT_PILLS.map(p => (
            <div
              key={p.label}
              className={`cat-pill ${activeKey === p.key ? 'on' : 'off'}`}
              onClick={() => setActiveKey(activeKey === p.key ? null : p.key)}
              style={{ cursor: 'pointer' }}
            >
              <span className="cat-pill-ic">{p.icon}</span>
              <span className="cat-pill-lbl">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats bar — compact inline ── */}
      {hasData && !query && !activeKey && (
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          padding: '16px 20px 4px', gap: 0,
        }}>
          {[
            { n: totalPartners,    l: 'Partners'    },
            { n: offers.length,    l: 'Benefits'    },
            { n: restaurantCount,  l: 'Restaurants' },
            { n: healthCount,      l: 'Health'      },
          ].map((s, i) => (
            <span key={s.l} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <span style={{ color: 'rgba(30,30,30,.2)', margin: '0 8px', fontSize: 14, lineHeight: 1 }}>·</span>
              )}
              <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--dark)' }}>{s.n}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginLeft: 4 }}>{s.l}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── No-results state ── */}
      {noResults && (
        <div className="sec" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'var(--dark)', marginBottom: 8 }}>
            No results for &ldquo;{query || activeKey}&rdquo;
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Try a different search term or category.
          </div>
          <button
            onClick={() => { setQuery(''); setActiveKey(null) }}
            style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.3)', color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Featured offer — hidden while searching ── */}
      {featured && !query && !activeKey && (
        <div className="feat-wrap">
          <div className="feat-card" style={{ cursor: 'pointer' }} onClick={() => setSelected(featured)}>
            <div className="feat-card-bg" />
            <div className="feat-o1" /><div className="feat-o2" /><div className="feat-grd" />
            <div className="feat-in">
              <div className="feat-top2">
                <div className="feat-eye">Featured Benefit</div>
                <div className="feat-excl">
                  <span style={{ fontSize: 10, color: 'var(--gold)' }}>✦</span>
                  <span className="feat-excl-lbl">All Members</span>
                </div>
              </div>
              <div>
                <div className="feat-ptnr">{featured.partner.name} · {featured.partner.category}</div>
                <div className="feat-ttl">{featured.title}</div>
                <div className="feat-ft">
                  <div className="feat-tags">
                    <div className="feat-tag">Members Only</div>
                    {featured.partner.area && <div className="feat-tag">{featured.partner.area}</div>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(featured) }}
                    className="feat-cta"
                    style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'Urbanist, sans-serif', fontSize: 'inherit' }}
                  >
                    View Benefit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Curated Dining banner (after featured, not at top) ── */}
      {!query && !activeKey && (
        <div
          className="din-banner"
          style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', margin: '0 20px 4px' }}
          onClick={() => router.push('/dining')}
        >
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
        </div>
      )}

      {/* ── Search result count ── */}
      {(query || activeKey) && !noResults && (
        <div style={{ padding: '12px 20px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}{activeKey ? ` · ${activeKey}` : ''}
        </div>
      )}

      {/* ── Restaurants section (real restaurants → /dining/[id]) ── */}
      {filteredRestaurants.length > 0 && (
        <div className="sec">
          <div className="sh2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: '#d4870f18', border: '1px solid #d4870f30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>
                🍽️
              </div>
              <div className="sh2-t">Restaurants</div>
            </div>
            <div
              className="sh2-l"
              style={{ fontSize: 11, cursor: 'pointer' }}
              onClick={() => router.push('/dining')}
            >
              View All →
            </div>
          </div>

          <div className="og">
            {filteredRestaurants.slice(0, SECTION_LIMIT).map(r => (
              <div
                key={r.id}
                className="oc"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/dining/${r.id}`)}
              >
                <div
                  className="oc-img"
                  style={{
                    height: 110,
                    backgroundImage: `url(${restaurantImgUrl(r)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,.04) 0%, rgba(0,0,0,.58) 100%)',
                  }} />
                  {r.isFeatured && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 1,
                      background: 'rgba(212,135,15,.85)', borderRadius: 4,
                      padding: '2px 6px', fontSize: 8, fontWeight: 700,
                      color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>
                      Featured
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8, zIndex: 1,
                    background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
                    border: '1px solid rgba(255,255,255,.14)',
                    borderRadius: 5, padding: '2px 7px',
                    fontSize: 8, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff',
                  }}>
                    {r.area}
                  </div>
                </div>
                <div className="oc-body">
                  <div className="oc-ptnr" style={{ color: '#d4870f' }}>
                    {r.cuisine} · {PRICE_LABEL[r.priceLevel] || '₦₦'}
                  </div>
                  <div className="oc-ttl">{r.name}</div>
                  <div className="oc-ft">
                    {r.memberBenefit ? (
                      <div style={{
                        fontSize: 9, fontWeight: 700, color: '#1fa3a6',
                        background: 'rgba(31,163,166,.08)', borderRadius: 4,
                        padding: '2px 6px', border: '1px solid rgba(31,163,166,.15)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%',
                      }}>
                        {r.memberBenefit}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 9, fontWeight: 700, color: '#d4870f',
                        background: '#d4870f12', borderRadius: 4,
                        padding: '2px 6px', border: '1px solid #d4870f20',
                      }}>
                        View Menu
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>→</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length > SECTION_LIMIT && (
            <button
              onClick={() => router.push('/dining')}
              style={{
                width: '100%', marginTop: 12, padding: '11px', borderRadius: 12,
                background: 'rgba(212,135,15,.06)', border: '1px solid rgba(212,135,15,.2)',
                color: '#d4870f', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Urbanist, sans-serif',
              }}
            >
              View All {filteredRestaurants.length} Restaurants →
            </button>
          )}
        </div>
      )}

      {/* ── Category sections ── */}
      {hasData && !noResults ? (
        SECTION_ORDER.map(catKey => {
          const catOffers = grouped.get(catKey)
          if (!catOffers || catOffers.length === 0) return null
          const emoji = CAT_EMOJI[catKey] ?? '✦'
          const color = CAT_COLOR[catKey] ?? 'var(--teal)'
          const isGrid = ['Restaurant', 'Wellness & Spa', 'Arts & Culture', 'Entertainment', 'Nightlife', 'Nature & Adventure'].includes(catKey)
          const visibleOffers = catOffers.slice(0, SECTION_LIMIT)
          const hasMore = catOffers.length > SECTION_LIMIT

          return (
            <div key={catKey} className="sec">
              {/* Section header */}
              <div className="sh2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                  }}>
                    {emoji}
                  </div>
                  <div className="sh2-t">{catKey}</div>
                </div>
                <div
                  className="sh2-l"
                  style={{ fontSize: 11, cursor: catKey === 'Arts & Culture' ? 'pointer' : undefined }}
                  onClick={catKey === 'Arts & Culture' ? () => router.push('/arts-culture') : undefined}
                >
                  {catKey === 'Arts & Culture' ? 'View All →' : `${catOffers.length} benefit${catOffers.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {/* ── 2-col photo grid (wellness, nightlife, experiences, etc.) ── */}
              {isGrid && (
                <>
                  <div className="og">
                    {visibleOffers.map((o, i) => {
                      const imgUrl = offerImageUrl(o, i)
                      return (
                        <div key={o.id} className="oc" style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                          <div
                            className="oc-img"
                            style={{
                              height: 110,
                              backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                              background: imgUrl ? undefined : `linear-gradient(135deg, ${color}20, ${color}40)`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: imgUrl
                                ? 'linear-gradient(to bottom, rgba(0,0,0,.04) 0%, rgba(0,0,0,.58) 100%)'
                                : 'none',
                            }} />
                            {!imgUrl && (
                              <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 26 }}>{emoji}</span>
                            )}
                            <div style={{
                              position: 'absolute', bottom: 8, left: 8, zIndex: 1,
                              background: imgUrl ? 'rgba(0,0,0,.45)' : `${color}22`,
                              backdropFilter: imgUrl ? 'blur(3px)' : undefined,
                              border: `1px solid ${imgUrl ? 'rgba(255,255,255,.14)' : `${color}40`}`,
                              borderRadius: 5, padding: '2px 7px',
                              fontSize: 8, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.8px',
                              color: imgUrl ? '#fff' : color,
                            }}>
                              {o.partner.area ?? o.partner.city}
                            </div>
                          </div>
                          <div className="oc-body">
                            <div className="oc-ptnr" style={{ color }}>
                              {o.partner.name}
                            </div>
                            <div className="oc-ttl">{o.title}</div>
                            <div className="oc-ft">
                              <div style={{
                                fontSize: 9, fontWeight: 700, color,
                                background: `${color}12`, borderRadius: 4,
                                padding: '2px 6px', border: `1px solid ${color}20`,
                              }}>
                                Member Perk
                              </div>
                              <div className="bm">
                                <svg width="14" height="14" viewBox="0 0 16 16">
                                  <polygon className="bmd" points="8,1 15,8 8,15 1,8"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => catKey === 'Arts & Culture' ? router.push('/arts-culture') : setActiveKey(catKey)}
                      style={{
                        width: '100%', marginTop: 12, padding: '11px', borderRadius: 12,
                        background: `${color}08`, border: `1px solid ${color}25`,
                        color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Urbanist, sans-serif',
                      }}
                    >
                      View All {catOffers.length} {catKey} Benefits →
                    </button>
                  )}
                </>
              )}

              {/* ── List rows (pharmacies, hospitals, supermarkets) ── */}
              {!isGrid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {catOffers.map(o => (
                    <div key={o.id} className="lo2" style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                      <div
                        className="lo2-ico"
                        style={{
                          background: `${color}14`,
                          border: `1px solid ${color}22`,
                          fontSize: 20,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                        }}
                      >
                        {emoji}
                      </div>
                      <div className="lo2-info">
                        <div className="lo2-ptnr" style={{ color }}>{o.partner.name}</div>
                        <div className="lo2-ttl" style={{ fontSize: 13, lineHeight: 1.3 }}>{o.title}</div>
                        <div className="lo2-tags">
                          {o.partner.area && <div className="lo2-tag">{o.partner.area}</div>}
                          {ratingStr(o.partner.contactInfo) && (
                            <div className="lo2-tag g">{ratingStr(o.partner.contactInfo)}</div>
                          )}
                        </div>
                        {phoneStr(o.partner.contactInfo) && (
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                            📞 {phoneStr(o.partner.contactInfo)}
                          </div>
                        )}
                      </div>
                      <div className="lo2-r">
                        <div style={{
                          fontSize: 9, fontWeight: 700, color,
                          background: `${color}12`, border: `1px solid ${color}20`,
                          borderRadius: 5, padding: '3px 7px', whiteSpace: 'nowrap',
                        }}>
                          Benefit
                        </div>
                        <div className="bm">
                          <svg width="14" height="14" viewBox="0 0 16 16">
                            <polygon className="bmd" points="8,1 15,8 8,15 1,8"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      ) : (
        !noResults && (
          <div className="sec">
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--dark)', marginBottom: 8 }}>
                Partner benefits coming soon
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Exclusive offers from Lagos&apos;s finest restaurants, spas, hospitals, and more — curated for Nigerent Signature members.
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Emergency contacts ── */}
      {hasData && (
        <div className="sec" style={{ marginTop: 12 }}>
          <div className="sh2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}>
                🚨
              </div>
              <div className="sh2-t">Emergency Contacts</div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { label: 'Reddington Hospital (VI)',  phone: '+234 916 535 9769', type: 'Hospital' },
              { label: 'Evercare Hospital (Lekki)', phone: '+234 813 985 0710', type: 'Hospital' },
              { label: 'Lagoon Hospital (VI)',       phone: '+234 913 938 3461', type: 'Hospital' },
              { label: 'Lagos Emergency Services',   phone: '767 / 112',        type: 'Emergency' },
            ].map((e, i, arr) => (
              <div
                key={e.label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{e.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontWeight: 500 }}>{e.type}</div>
                </div>
                <a
                  href={`tel:${e.phone.replace(/[\s/]/g, '')}`}
                  style={{ fontSize: 12, color: '#2980b9', fontWeight: 700, textDecoration: 'none' }}
                >
                  {e.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      </>}
      {/* end of !aiSearched */}

      <div style={{ height: 36 }} />

      {/* ── Offer detail sheet ── */}
      {selected && (
        <OfferSheet
          offer={{
            ...selected,
            redemptionSteps: Array.isArray(selected.redemptionSteps) ? selected.redemptionSteps : [],
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
