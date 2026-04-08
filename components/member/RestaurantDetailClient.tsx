'use client'
/**
 * RestaurantDetailClient — full restaurant detail view.
 * Photo hero → info → member benefit → opening hours → menu → reserve CTA.
 */

import { useState, useMemo } from 'react'
import { useRouter }          from 'next/navigation'
import DiningBookSheet         from './DiningBookSheet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id:          string
  category:    string
  name:        string
  description: string | null
  price:       number   // kobo
  imageUrl:    string | null
}

interface Restaurant {
  id:               string
  name:             string
  cuisine:          string
  city:             string
  area:             string
  description:      string | null
  imageUrls:        string[]
  ambianceTags:     string[]
  memberBenefit:    string | null
  priceLevel:       number
  openingHours:     Record<string, { open: string; close: string } | string>
  reservationNotes: string | null
  mapLink:          string | null
  isFeatured:       boolean
  menuItems:        MenuItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRICE_LABEL = ['', '₦', '₦₦', '₦₦₦', '₦₦₦₦']

const CUISINE_PHOTOS: Record<string, string[]> = {
  'Nigerian':    ['photo-1604329760661-e71dc83f8f26', 'photo-1567188040759-fb8a883dc6d8'],
  'Japanese':    ['photo-1617196034183-421b4040ed20', 'photo-1562802378-063ec186a863'],
  'Italian':     ['photo-1555396273-367ea4eb4db5', 'photo-1481931098730-318b6f776db0'],
  'Continental': ['photo-1517248135467-4c7edcad34c4', 'photo-1466978913421-dad2ebd01d17'],
  'Seafood':     ['photo-1484659619207-9165d119dafe', 'photo-1559737558-2f5a35f4523b'],
  'Steakhouse':  ['photo-1432139555190-58524dae6a55', 'photo-1558030137-a56c1b004fa4'],
  'Asian':       ['photo-1569718212165-3a8278d5f624', 'photo-1617196034099-f87e6c99c0c1'],
  'French':      ['photo-1414235077428-338989a2e8c0', 'photo-1551218808-94e220e084d2'],
  'Lebanese':    ['photo-1547592166-23ac45744acd', 'photo-1528735602780-2552fd46c7af'],
  'Indian':      ['photo-1585937421612-70a008356fbe', 'photo-1631515243349-e0cb75fb8d3a'],
}
const FALLBACK = ['photo-1517248135467-4c7edcad34c4', 'photo-1414235077428-338989a2e8c0', 'photo-1555396273-367ea4eb4db5']

function photoUrl(cuisine: string, idx: number, w = 800): string {
  let ids = FALLBACK
  for (const [key, photos] of Object.entries(CUISINE_PHOTOS)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) { ids = photos; break }
  }
  return `https://images.unsplash.com/${ids[idx % ids.length]}?w=${w}&q=80&auto=format&fit=crop`
}

function formatPrice(kobo: number): string {
  if (kobo === 0) return 'Complimentary'
  const ngn = kobo / 100
  if (ngn >= 1_000_000) return `₦${(ngn / 1_000_000).toFixed(1)}m`
  return `₦${Math.round(ngn / 1000)}k`
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

function todayDayKey(): string {
  return DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RestaurantDetailClient({ restaurant: r }: { restaurant: Restaurant }) {
  const router           = useRouter()
  const [bookOpen, setBookOpen] = useState(false)
  const [imgIdx,   setImgIdx]   = useState(0)
  const [hoursOpen, setHoursOpen] = useState(false)

  const images = useMemo(() => {
    const real = r.imageUrls.filter(Boolean)
    if (real.length > 0) return real
    return [0, 1, 2].map(i => photoUrl(r.cuisine, i))
  }, [r.imageUrls, r.cuisine])

  // Group menu by category
  const menuByCat = useMemo(() => {
    const map: Record<string, MenuItem[]> = {}
    for (const item of r.menuItems) {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    }
    return map
  }, [r.menuItems])

  const today    = todayDayKey()
  const todayHrs = r.openingHours?.[today]
  const isOpenToday = todayHrs && typeof todayHrs !== 'string' && todayHrs !== 'closed'

  return (
    <div style={{ background: '#080f0f', minHeight: '100dvh', paddingBottom: 120 }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        <img
          src={images[imgIdx]}
          alt={r.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Gradient scrim */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,.45) 0%, rgba(8,15,15,0) 40%, rgba(8,15,15,.9) 80%, #080f0f 100%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 52, left: 20, zIndex: 10,
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(8,15,15,.6)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}
          aria-label="Back"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Featured badge */}
        {r.isFeatured && (
          <div style={{
            position: 'absolute', top: 56, right: 20, zIndex: 10,
            background: 'rgba(212,175,55,.18)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(212,175,55,.3)', borderRadius: 20,
            padding: '5px 12px', fontSize: 10, fontWeight: 800,
            color: '#d4af37', letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            ✦ Featured
          </div>
        )}

        {/* Image pagination dots */}
        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6, zIndex: 10,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                style={{
                  width: i === imgIdx ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === imgIdx ? '#fff' : 'rgba(255,255,255,.35)',
                  border: 'none', cursor: 'pointer', transition: 'all .2s', padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Name overlay */}
        <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 5 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(212,175,55,.8)', marginBottom: 4 }}>
            {r.cuisine}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.15, fontFamily: "'Cormorant Garamond', serif" }}>
            {r.name}
          </div>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={tagStyle}>📍 {r.area}, {r.city}</div>
          <div style={tagStyle}>{PRICE_LABEL[r.priceLevel] ?? '₦₦'} · {r.cuisine}</div>
          {r.ambianceTags.slice(0, 2).map(t => (
            <div key={t} style={tagStyle}>{t}</div>
          ))}
        </div>

        {/* Member benefit */}
        {r.memberBenefit && (
          <div style={{
            background: 'rgba(31,163,166,.08)', border: '1px solid rgba(31,163,166,.18)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(31,163,166,.15)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>✦</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 2 }}>
                Member Benefit
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,206,214,.9)', lineHeight: 1.4 }}>
                {r.memberBenefit}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {r.description && (
          <div style={{ fontSize: 14, color: 'rgba(201,206,214,.65)', lineHeight: 1.65, marginBottom: 20 }}>
            {r.description}
          </div>
        )}
      </div>

      {/* ── Opening Hours ── */}
      <div style={{ margin: '0 20px 20px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 16, overflow: 'hidden' }}>
        <button
          onClick={() => setHoursOpen(h => !h)}
          style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 16 }}>🕐</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(201,206,214,.9)' }}>Opening Hours</div>
            {todayHrs && (
              <div style={{ fontSize: 11, color: isOpenToday ? '#1fa3a6' : 'rgba(231,76,60,.8)', fontWeight: 600, marginTop: 1 }}>
                {isOpenToday
                  ? `Open today: ${(todayHrs as { open: string; close: string }).open} – ${(todayHrs as { open: string; close: string }).close}`
                  : 'Closed today'}
              </div>
            )}
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(201,206,214,.3)', transform: hoursOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {hoursOpen && (
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ height: 1, background: 'rgba(201,206,214,.06)', marginBottom: 12 }} />
            {DAY_ORDER.map((day, i) => {
              const hrs = r.openingHours?.[day]
              const isToday = day === today
              const isClosed = !hrs || hrs === 'closed' || typeof hrs === 'string'
              return (
                <div key={day} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                  borderBottom: i < DAY_ORDER.length - 1 ? '1px solid rgba(201,206,214,.04)' : 'none',
                }}>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--teal)' : 'rgba(201,206,214,.5)' }}>
                    {DAY_SHORT[day]}
                    {isToday && <span style={{ fontSize: 9, marginLeft: 4, color: '#1fa3a6' }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isClosed ? 'rgba(231,76,60,.6)' : 'rgba(201,206,214,.75)' }}>
                    {isClosed ? 'Closed' : `${(hrs as { open: string; close: string }).open} – ${(hrs as { open: string; close: string }).close}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Menu ── */}
      {Object.keys(menuByCat).length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(201,206,214,.9)', marginBottom: 4, fontFamily: "'Cormorant Garamond', serif" }}>
            Menu
          </div>
          <div style={{ fontSize: 11, color: 'rgba(201,206,214,.3)', marginBottom: 20, fontWeight: 500 }}>
            Prices shown are indicative and subject to change
          </div>

          {Object.entries(menuByCat).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
                color: '#1fa3a6', marginBottom: 10, paddingLeft: 2,
              }}>
                {category}
              </div>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.07)', borderRadius: 16, overflow: 'hidden' }}>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: i < items.length - 1 ? '1px solid rgba(201,206,214,.06)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(201,206,214,.9)', marginBottom: 3 }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)', lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.price === 0 ? '#1fa3a6' : 'rgba(212,175,55,.8)', flexShrink: 0 }}>
                      {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reservation Notes ── */}
      {r.reservationNotes && (
        <div style={{ margin: '0 20px 20px', background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.12)', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)', marginBottom: 6 }}>Note</div>
          <div style={{ fontSize: 12, color: 'rgba(201,206,214,.55)', lineHeight: 1.55 }}>{r.reservationNotes}</div>
        </div>
      )}

      {/* ── Map link ── */}
      {r.mapLink && (
        <div style={{ padding: '0 20px 20px' }}>
          <a
            href={r.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)',
              borderRadius: 14, textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: 18 }}>📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,206,214,.8)' }}>{r.area}, {r.city}</div>
              <div style={{ fontSize: 10, color: 'rgba(201,206,214,.3)', marginTop: 1 }}>Open in Maps</div>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="rgba(201,206,214,.25)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </a>
        </div>
      )}

      {/* ── Sticky Reserve CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'linear-gradient(to top, #080f0f 60%, transparent)',
        padding: '20px 20px 32px',
      }}>
        <button
          onClick={() => setBookOpen(true)}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'linear-gradient(135deg, #1fa3a6 0%, #167a7d 100%)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
            letterSpacing: '.3px', boxShadow: '0 4px 24px rgba(31,163,166,.35)',
          }}
        >
          Reserve a Table at {r.name}
        </button>
      </div>

      {/* ── Booking Sheet ── */}
      {bookOpen && (
        <DiningBookSheet
          restaurant={{
            id:           r.id,
            name:         r.name,
            cuisine:      r.cuisine,
            area:         r.area,
            memberBenefit: r.memberBenefit,
            priceLevel:   r.priceLevel,
          }}
          onClose={() => setBookOpen(false)}
        />
      )}
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600,
  padding: '5px 10px', borderRadius: 20,
  background: 'rgba(201,206,214,.06)',
  border: '1px solid rgba(201,206,214,.1)',
  color: 'rgba(201,206,214,.55)',
}
