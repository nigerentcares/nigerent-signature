'use client'
/**
 * ArtsCultureClient — owns search, type filter, and experiences list interactivity.
 * Tapping a card opens an OfferSheet with full benefit details.
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
    name:        string
    category:    string
    area:        string | null
    city:        string
    contactInfo: unknown
  }
}

interface Props {
  offers: Offer[]
}

const TYPES = [
  { icon: '✦',  label: 'All',      keywords: [] },
  { icon: '🖼️', label: 'Gallery',  keywords: ['gallery', 'exhibition', 'art gallery', 'art space'] },
  { icon: '🎭', label: 'Theater',  keywords: ['theater', 'theatre', 'stage', 'performance', 'drama', 'show'] },
  { icon: '🏛️', label: 'Museum',   keywords: ['museum', 'heritage', 'history', 'archive', 'monument'] },
  { icon: '🎵', label: 'Music',    keywords: ['music', 'concert', 'live', 'open mic', 'jazz', 'band', 'festival'] },
  { icon: '📚', label: 'Cultural', keywords: ['culture', 'cultural', 'bookshop', 'library', 'literary', 'book'] },
] as const

// Curated Unsplash photo pool for Arts & Culture
const ARTS_PHOTOS = [
  'photo-1510525009579-5bd35e6dc5d2', // modern art gallery
  'photo-1571115764595-644a1f56a55c', // theater stage
  'photo-1518998053901-5348d3961a04', // museum interior
  'photo-1580893246395-52aead8960dc', // contemporary art
  'photo-1544967082-d9d25d867d66', // gallery visit
  'photo-1605721911519-3dfeb3be25e7', // art installation
]

const UNSPLASH = 'https://images.unsplash.com'
const COLOR = '#c8a84b'

function artsPhotoUrl(index: number, width = 500): string {
  return `${UNSPLASH}/${ARTS_PHOTOS[index % ARTS_PHOTOS.length]}?w=${width}&q=80&auto=format&fit=crop`
}

export default function ArtsCultureClient({ offers }: Props) {
  const [query,    setQuery]    = useState('')
  const [type,     setType]     = useState<string>('All')
  const [selected, setSelected] = useState<Offer | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return offers.filter(o => {
      if (type !== 'All') {
        const t = TYPES.find(t => t.label === type)
        if (t && t.keywords.length > 0) {
          const text = `${o.title} ${o.shortDesc} ${o.partner.name} ${o.description}`.toLowerCase()
          const matches = t.keywords.some(kw => text.includes(kw))
          if (!matches) return false
        }
      }
      if (!q) return true
      return (
        o.title.toLowerCase().includes(q)              ||
        o.partner.name.toLowerCase().includes(q)       ||
        o.shortDesc.toLowerCase().includes(q)          ||
        (o.partner.area ?? '').toLowerCase().includes(q)
      )
    })
  }, [offers, query, type])

  const featured  = filtered.find(o => o.isFeatured) ?? filtered[0]
  const rest      = filtered.filter(o => o.id !== featured?.id)
  const noResults = filtered.length === 0 && (query.trim() !== '' || type !== 'All')

  return (
    <>
      {/* ── Header ── */}
      <div className="hdr" style={{ paddingBottom: 0 }}>
        <div className="pg-eye">Arts &amp; Culture</div>
        <div className="pg-title">
          Culture &amp;<br/>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 30, color: `rgba(200,168,75,.85)` }}>
            Experiences
          </span>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="srch-outer">
        <div className="srch-bar" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke={COLOR} strokeWidth="2.2"/>
            <path d="m21 21-4.35-4.35" stroke={COLOR} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search galleries, theaters, museums…"
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

      {/* ── Type pills ── */}
      <div className="occ-row">
        {TYPES.map(t => (
          <div
            key={t.label}
            className={`occ-pill ${type === t.label ? 'on' : 'off'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setType(type === t.label && t.label !== 'All' ? 'All' : t.label)}
          >
            <span className="occ-ic">{t.icon}</span>
            <span className="occ-lbl">{t.label}</span>
          </div>
        ))}
      </div>

      {/* ── No-results state ── */}
      {noResults && (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎭</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>
            No experiences found
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            {query ? `No results for "${query}"` : `No ${type} experiences at the moment`}. Try another search.
          </div>
          <button
            onClick={() => { setQuery(''); setType('All') }}
            style={{ padding: '10px 24px', borderRadius: 12, background: `rgba(200,168,75,.12)`, border: `1px solid rgba(200,168,75,.25)`, color: COLOR, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Result count when filtering ── */}
      {!noResults && (query || type !== 'All') && (
        <div style={{ padding: '0 20px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {filtered.length} experience{filtered.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}{type !== 'All' ? ` · ${type}` : ''}
        </div>
      )}

      {offers.length > 0 && !noResults && (
        <>
          {/* ── Featured Hero ── */}
          {featured && (
            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <div
                className="hero-rest"
                style={{
                  cursor: 'pointer',
                  backgroundImage: `url(${artsPhotoUrl(0, 800)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
                onClick={() => setSelected(featured)}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,.18) 0%, rgba(0,0,0,.72) 100%)',
                  borderRadius: 'inherit',
                }} />
                <div className="hr-content" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="hr-badge-row">
                    <div className="hr-badge" style={{ background: `rgba(200,168,75,.15)`, color: COLOR, border: `1px solid rgba(200,168,75,.3)` }}>
                      ✦ Featured
                    </div>
                  </div>
                  <div className="hr-cuisine" style={{ color: `rgba(200,168,75,.8)` }}>{featured.partner.name}</div>
                  <div className="hr-name">{featured.title}</div>
                  <div className="hr-foot">
                    <div className="hr-info-left">
                      <div className="hr-loc">📍 {featured.partner.area ?? featured.partner.city}</div>
                      <div className="hr-benefit" style={{ color: COLOR }}>Member Experience</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(featured) }}
                      className="hr-cta"
                      style={{ cursor: 'pointer', border: 'none', fontFamily: 'Urbanist, sans-serif', background: COLOR, color: '#1a0e00' }}
                    >
                      View Benefit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── All Experiences — 2-column grid ── */}
          {rest.length > 0 && (
            <div className="sec">
              <div className="sh">
                <div className="sh-t">All Experiences</div>
                <div className="sh-l">{rest.length} partner{rest.length !== 1 ? 's' : ''}</div>
              </div>

              <div className="og">
                {rest.map((o, i) => (
                  <div
                    key={o.id}
                    className="oc"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(o)}
                  >
                    <div
                      className="oc-img"
                      style={{
                        height: 110,
                        backgroundImage: `url(${artsPhotoUrl(i + 1)})`,
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
                      <div style={{
                        position: 'absolute', bottom: 8, left: 8, zIndex: 1,
                        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
                        border: '1px solid rgba(255,255,255,.14)',
                        borderRadius: 5, padding: '2px 7px',
                        fontSize: 8, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff',
                      }}>
                        {o.partner.area ?? o.partner.city}
                      </div>
                    </div>
                    <div className="oc-body">
                      <div className="oc-ptnr" style={{ color: COLOR }}>
                        {o.partner.name}
                      </div>
                      <div className="oc-ttl">{o.title}</div>
                      <div className="oc-ft">
                        <div style={{
                          fontSize: 9, fontWeight: 700, color: COLOR,
                          background: `rgba(200,168,75,.08)`, borderRadius: 4,
                          padding: '2px 6px', border: `1px solid rgba(200,168,75,.15)`,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%',
                        }}>
                          Member Perk
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>→</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {offers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎭</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--dark)', marginBottom: 8 }}>
            Coming soon
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Exclusive arts &amp; culture experiences curated for Nigerent Signature members.
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
