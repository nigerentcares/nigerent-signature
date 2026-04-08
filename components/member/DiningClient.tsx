'use client'
/**
 * DiningClient — owns search, occasion filter, and restaurant list interactivity.
 * Tapping a card navigates to /dining/[id] for the full detail page.
 */

import { useState, useMemo } from 'react'
import { useRouter }          from 'next/navigation'

interface Restaurant {
  id:           string
  name:         string
  cuisine:      string
  area:         string
  city:         string
  memberBenefit?: string | null
  priceLevel:   number
  ambianceTags: string[]
  imageUrls:    string[]
  isFeatured:   boolean
  isActive:     boolean
}

interface Props {
  restaurants: Restaurant[]
}

const OCCASIONS = [
  { icon: '✦',  label: 'All',         tags: [] },
  { icon: '🌇', label: 'Fine Dining', tags: ['fine dining', 'sophisticated', 'premium', 'elegant', 'award-winning', 'European'] },
  { icon: '☕', label: 'Brunch',      tags: ['brunch', 'all-day', 'casual', 'cafe'] },
  { icon: '💼', label: 'Business',    tags: ['business', 'continental', 'upscale', 'stylish'] },
  { icon: '🥂', label: 'Date Night',  tags: ['romantic', 'intimate', 'private', 'wine', 'quiet'] },
  { icon: '🎉', label: 'Celebration', tags: ['lively', 'party', 'trendy', 'vibrant', 'social'] },
] as const

const PRICE_LABEL = ['', '₦', '₦₦', '₦₦₦', '₦₦₦₦']

// Curated Unsplash photo IDs per cuisine type — multiple so adjacent cards look distinct
const CUISINE_PHOTOS: Record<string, string[]> = {
  'Nigerian':     ['photo-1604329760661-e71dc83f8f26', 'photo-1567188040759-fb8a883dc6d8'],
  'Japanese':     ['photo-1617196034183-421b4040ed20', 'photo-1562802378-063ec186a863', 'photo-1611143669185-af224c5e3252'],
  'Italian':      ['photo-1555396273-367ea4eb4db5', 'photo-1481931098730-318b6f776db0', 'photo-1414235077428-338989a2e8c0'],
  'Continental':  ['photo-1517248135467-4c7edcad34c4', 'photo-1466978913421-dad2ebd01d17', 'photo-1424847651672-bf20a4b0982b'],
  'Seafood':      ['photo-1484659619207-9165d119dafe', 'photo-1559737558-2f5a35f4523b', 'photo-1615361200141-f45040f367be'],
  'Steakhouse':   ['photo-1432139555190-58524dae6a55', 'photo-1558030137-a56c1b004fa4', 'photo-1544025162-d76694265947'],
  'Pan-African':  ['photo-1567188040759-fb8a883dc6d8', 'photo-1604329760661-e71dc83f8f26'],
  'Asian':        ['photo-1569718212165-3a8278d5f624', 'photo-1617196034099-f87e6c99c0c1'],
  'French':       ['photo-1414235077428-338989a2e8c0', 'photo-1551218808-94e220e084d2'],
  'Lebanese':     ['photo-1547592166-23ac45744acd', 'photo-1528735602780-2552fd46c7af'],
  'Indian':       ['photo-1585937421612-70a008356fbe', 'photo-1631515243349-e0cb75fb8d3a'],
}
const FALLBACK_DINING_PHOTOS = [
  'photo-1517248135467-4c7edcad34c4',
  'photo-1414235077428-338989a2e8c0',
  'photo-1555396273-367ea4eb4db5',
  'photo-1424847651672-bf20a4b0982b',
  'photo-1466978913421-dad2ebd01d17',
]
const UNSPLASH = 'https://images.unsplash.com'

function restaurantPhotoUrl(cuisine: string, index: number, width = 500): string {
  let ids = FALLBACK_DINING_PHOTOS
  for (const [key, photos] of Object.entries(CUISINE_PHOTOS)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) {
      ids = photos
      break
    }
  }
  return `${UNSPLASH}/${ids[index % ids.length]}?w=${width}&q=80&auto=format&fit=crop`
}

const CUISINE_ICONS: Record<string, string> = {
  'Nigerian': '🫕', 'Japanese': '🍱', 'Italian': '🍝', 'Continental': '🍷',
  'Seafood': '🦞', 'Steakhouse': '🥩', 'Pan-African': '🌍', 'Asian': '🍜',
  'French': '🥐', 'Lebanese': '🫙', 'Indian': '🍛',
}
function cuisineIcon(c: string) {
  for (const [key, icon] of Object.entries(CUISINE_ICONS)) {
    if (c.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '🍽️'
}

export default function DiningClient({ restaurants }: Props) {
  const router                    = useRouter()
  const [query,    setQuery]      = useState('')
  const [occasion, setOccasion]   = useState<string>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return restaurants.filter(r => {
      // Occasion filter (match against ambiance tags)
      if (occasion !== 'All') {
        const occ = OCCASIONS.find(o => o.label === occasion)
        if (occ && occ.tags.length > 0) {
          const tagLower = r.ambianceTags.map(t => t.toLowerCase())
          const cuisineLower = r.cuisine.toLowerCase()
          const matchesTags = occ.tags.some(t =>
            tagLower.some(at => at.includes(t)) || cuisineLower.includes(t)
          )
          if (!matchesTags) return false
        }
      }
      // Search query
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q)    ||
        r.cuisine.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)    ||
        r.ambianceTags.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [restaurants, query, occasion])

  const featured = filtered.find(r => r.isFeatured) ?? filtered[0]
  const rest     = filtered.filter(r => r.id !== featured?.id)
  const hasReal  = restaurants.length > 0
  const noResults = filtered.length === 0 && (query.trim() !== '' || occasion !== 'All')

  return (
    <>
      {/* ── Header ── */}
      <div className="hdr" style={{ paddingBottom: 0 }}>
        <div className="pg-eye">Curated Dining</div>
        <div className="pg-title">
          Restaurants &amp;<br/>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 30, color: 'rgba(212,175,55,.85)' }}>
            Experiences
          </span>
        </div>
      </div>

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
            placeholder="Search restaurants or cuisines…"
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

      {/* ── Occasion pills ── */}
      <div className="occ-row">
        {OCCASIONS.map(o => (
          <div
            key={o.label}
            className={`occ-pill ${occasion === o.label ? 'on' : 'off'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setOccasion(occasion === o.label ? 'All' : o.label)}
          >
            <span className="occ-ic">{o.icon}</span>
            <span className="occ-lbl">{o.label}</span>
          </div>
        ))}
      </div>

      {/* No-results state */}
      {noResults && (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>
            No restaurants found
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            {query ? `No results for "${query}"` : `No ${occasion} venues at the moment`}. Try another search.
          </div>
          <button
            onClick={() => { setQuery(''); setOccasion('All') }}
            style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(31,163,166,.12)', border: '1px solid rgba(31,163,166,.25)', color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Result count when filtering */}
      {!noResults && (query || occasion !== 'All') && (
        <div style={{ padding: '0 20px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}{occasion !== 'All' ? ` · ${occasion}` : ''}
        </div>
      )}

      {hasReal && !noResults && (
        <>
          {/* ── Featured Hero ── */}
          {featured && (
            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <div
                className="hero-rest"
                style={{
                  cursor: 'pointer',
                  backgroundImage: featured.imageUrls[0]
                    ? `url(${featured.imageUrls[0]})`
                    : `url(${restaurantPhotoUrl(featured.cuisine, 0, 800)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
                onClick={() => router.push(`/dining/${featured.id}`)}
              >
                {/* Photo scrim — darker than the decorative blobs */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,.18) 0%, rgba(0,0,0,.72) 100%)',
                  borderRadius: 'inherit',
                }} />
                <div className="hr-content" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="hr-badge-row">
                    <div className="hr-badge feat">✦ Featured</div>
                  </div>
                  <div className="hr-cuisine">{featured.cuisine}</div>
                  <div className="hr-name">{featured.name}</div>
                  <div className="hr-foot">
                    <div className="hr-info-left">
                      <div className="hr-loc">📍 {featured.area}, {featured.city}</div>
                      {featured.memberBenefit && (
                        <div className="hr-benefit">{featured.memberBenefit}</div>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/dining/${featured.id}`) }}
                      className="hr-cta"
                      style={{ cursor: 'pointer', border: 'none', fontFamily: 'Urbanist, sans-serif' }}
                    >
                      View &amp; Reserve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── All Restaurants ── */}
          {rest.length > 0 && (
            <div className="sec">
              <div className="sh">
                <div className="sh-t">Member Restaurants</div>
                <div className="sh-l">{rest.length} venues</div>
              </div>

              {rest.map((r, i) => {
                const photoUrl = r.imageUrls[0] ?? restaurantPhotoUrl(r.cuisine, i)
                return (
                <div
                  key={r.id}
                  className="drc"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/dining/${r.id}`)}
                >
                  <div
                    className="drc-img"
                    style={{
                      backgroundImage: `url(${photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* Photo scrim */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 100%)',
                      borderRadius: 'inherit',
                    }} />
                    <div className="drc-tags" style={{ position: 'relative', zIndex: 1 }}>
                      {r.memberBenefit && <div className="drc-tag m">Member Perk</div>}
                    </div>
                  </div>
                  <div className="drc-body">
                    <div className="drc-top">
                      <div>
                        <div className="drc-name">{r.name}</div>
                        <div className="drc-cuisine">{r.cuisine} · {r.area}</div>
                      </div>
                      <div className="drc-price">{PRICE_LABEL[r.priceLevel] ?? '₦₦'}</div>
                    </div>
                    <div className="drc-foot">
                      <div className="drc-meta">
                        <div className="drc-m"><span>📍</span><span>{r.area}</span></div>
                        {r.ambianceTags[0] && (
                          <div className="drc-m"><span>✨</span><span>{r.ambianceTags[0]}</span></div>
                        )}
                      </div>
                      {r.memberBenefit && (
                        <div className="drc-benefit">{r.memberBenefit}</div>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Empty state for no real restaurants yet */}
          {restaurants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
              Dining partners coming soon.
            </div>
          )}
        </>
      )}

    </>
  )
}
