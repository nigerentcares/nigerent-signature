'use client'
/**
 * ExploreOffersClient — renders all offer sections with OfferSheet on tap.
 * Owns the search bar and category pills so both filter reactively.
 */

import { useState, useMemo } from 'react'
import OfferSheet from './OfferSheet'

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

interface Props {
  offers:        Offer[]
  totalPartners: number
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

const SECTION_ORDER = [
  'Restaurant', 'Wellness & Spa', 'Arts & Culture', 'Entertainment',
  'Nature & Adventure', 'Nightlife', 'Supermarket', 'Pharmacy', 'Hospital & Medical',
]

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

/** Return a curated Unsplash image URL for an offer, cycling through the pool */
function offerImageUrl(o: Offer, index: number): string | null {
  if (o.imageUrl) return o.imageUrl
  const ids = CATEGORY_PHOTOS[o.partner.category]
  if (!ids || ids.length === 0) return null
  return `${UNSPLASH}/${ids[index % ids.length]}?w=400&q=75&auto=format&fit=crop`
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

export default function ExploreOffersClient({ offers, totalPartners }: Props) {
  const [selected,  setSelected]  = useState<Offer | null>(null)
  const [query,     setQuery]     = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<'All' | 'Lagos' | 'Abuja'>('All')

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
  const noResults = filtered.length === 0 && (query.trim() !== '' || activeKey !== null)

  const restaurantCount = offers.filter(o => o.partner.category === 'Restaurant').length
  const healthCount     = offers.filter(o => ['Hospital & Medical', 'Pharmacy'].includes(o.partner.category)).length

  return (
    <>
      {/* ── Search bar ── */}
      <div className="srch-outer">
        <div className="srch-bar" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke="#1fa3a6" strokeWidth="2.2"/>
            <path d="m21 21-4.35-4.35" stroke="#1fa3a6" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Restaurants, spas, hospitals, experiences…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--cream)', fontSize: 14, fontFamily: 'Urbanist, sans-serif',
              padding: '0 10px',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 4px', fontSize: 18, lineHeight: 1 }}
              aria-label="Clear"
            >×</button>
          )}
        </div>
      </div>

      {/* ── City filter ── */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px 0' }}>
        {(['All', 'Lagos', 'Abuja'] as const).map(city => (
          <button
            key={city}
            onClick={() => setCityFilter(city)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              border: cityFilter === city ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.1)',
              background: cityFilter === city ? 'rgba(31,163,166,.1)' : 'rgba(255,255,255,.03)',
              color: cityFilter === city ? 'var(--teal)' : 'rgba(201,206,214,.4)',
              cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'all .15s',
            }}
          >
            {city === 'All' ? '🌍 All Cities' : city === 'Lagos' ? '🏙️ Lagos' : '🏛️ Abuja'}
          </button>
        ))}
      </div>

      {/* ── Category pills ── */}
      <div className="cats-outer">
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

      {/* ── Search result count ── */}
      {(query || activeKey) && !noResults && (
        <div style={{ padding: '12px 20px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}{activeKey ? ` · ${activeKey}` : ''}
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
                <div className="sh2-l" style={{ fontSize: 11 }}>
                  {catOffers.length} benefit{catOffers.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* ── 2-col photo grid (dining, wellness, nightlife, etc.) ── */}
              {isGrid && (
                <div className="og">
                  {catOffers.slice(0, 6).map((o, i) => {
                    const imgUrl = offerImageUrl(o, i)
                    return (
                      <div key={o.id} className="oc" style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                        {/* Card image */}
                        <div
                          className="oc-img"
                          style={{
                            height: 120,
                            backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                            background: imgUrl ? undefined : `linear-gradient(135deg, ${color}20, ${color}40)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Scrim for text legibility */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: imgUrl
                              ? 'linear-gradient(to bottom, rgba(0,0,0,.04) 0%, rgba(0,0,0,.58) 100%)'
                              : 'none',
                          }} />
                          {/* Emoji fallback when no photo */}
                          {!imgUrl && (
                            <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 26 }}>{emoji}</span>
                          )}
                          {/* Location pill */}
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
                        {/* Card body */}
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
