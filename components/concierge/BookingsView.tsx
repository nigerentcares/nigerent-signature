'use client'

import { useState } from 'react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS = [
  {
    id: 'bk-001',
    memberName: 'Adewale Okonkwo',
    initials:   'AO',
    tier:        'Signature Elite',
    property:    'Eko Atlantic Suite 702',
    checkIn:     '10 Apr 2026',
    checkOut:    '14 Apr 2026',
    nights:      4,
    status:      'CHECKED_IN',
    guests:      2,
    specialNotes: 'Late checkout requested. Champagne on arrival.',
  },
  {
    id: 'bk-002',
    memberName: 'Chiamaka Obi',
    initials:   'CO',
    tier:        'Signature Plus',
    property:    'Victoria Island Penthouse',
    checkIn:     '12 Apr 2026',
    checkOut:    '15 Apr 2026',
    nights:      3,
    status:      'CONFIRMED',
    guests:      1,
    specialNotes: 'Vegan breakfast only.',
  },
  {
    id: 'bk-003',
    memberName: 'Babatunde Adeola',
    initials:   'BA',
    tier:        'Signature Elite',
    property:    'Lekki Phase 1 Villa',
    checkIn:     '15 Apr 2026',
    checkOut:    '20 Apr 2026',
    nights:      5,
    status:      'CONFIRMED',
    guests:      4,
    specialNotes: 'Corporate stay. Require 2 extra desks and printer.',
  },
  {
    id: 'bk-004',
    memberName: 'Ngozi Adeyemi',
    initials:   'NA',
    tier:        'Signature Plus',
    property:    'Ikoyi Garden Residence',
    checkIn:     '18 Apr 2026',
    checkOut:    '21 Apr 2026',
    nights:      3,
    status:      'PENDING',
    guests:      2,
    specialNotes: '',
  },
  {
    id: 'bk-005',
    memberName: 'Kola Martins',
    initials:   'KM',
    tier:        'Signature Plus',
    property:    'Banana Island Estate',
    checkIn:     '5 Apr 2026',
    checkOut:    '9 Apr 2026',
    nights:      4,
    status:      'COMPLETED',
    guests:      2,
    specialNotes: 'Requested housekeeping twice daily.',
  },
  {
    id: 'bk-006',
    memberName: 'Emeka Nwosu',
    initials:   'EN',
    tier:        'Signature',
    property:    'Eko Atlantic Suite 301',
    checkIn:     '20 Apr 2026',
    checkOut:    '22 Apr 2026',
    nights:      2,
    status:      'CONFIRMED',
    guests:      1,
    specialNotes: '',
  },
  {
    id: 'bk-007',
    memberName: 'Fatima Bello',
    initials:   'FB',
    tier:        'Signature',
    property:    'Victoria Island Penthouse',
    checkIn:     '2 Apr 2026',
    checkOut:    '6 Apr 2026',
    nights:      4,
    status:      'COMPLETED',
    guests:      3,
    specialNotes: 'Birthday decoration required on arrival.',
  },
]

const STATUS_LABEL: Record<string, string> = {
  CHECKED_IN: 'Checked In',
  CONFIRMED:  'Confirmed',
  PENDING:    'Pending',
  COMPLETED:  'Completed',
  CANCELLED:  'Cancelled',
}

const STATUS_CLASS: Record<string, string> = {
  CHECKED_IN: 'con-b-progress',
  CONFIRMED:  'con-b-confirmed',
  PENDING:    'con-b-pending',
  COMPLETED:  'con-b-completed',
  CANCELLED:  'con-b-cancelled',
}

const TIER_CLASS: Record<string, string> = {
  'Signature':       'con-t-sig',
  'Signature Plus':  'con-t-plus',
  'Signature Elite': 'con-t-elite',
}

type Filter = 'all' | 'active' | 'upcoming' | 'completed'
type Booking = typeof MOCK_BOOKINGS[number]

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function BookingSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  return (
    <>
      <div className="con-overlay" onClick={onClose} />
      <div className="con-sheet">
        <div className="con-sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div className="con-av sm" style={{ background: 'linear-gradient(135deg,#d4af37,#b8960f)', color: '#1c1c1c' }}>
            {b.initials}
          </div>
          <div>
            <div className="con-sheet-title">{b.memberName}</div>
            <span className={`con-tier ${TIER_CLASS[b.tier] ?? 'con-t-sig'}`}>{b.tier}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`con-badge ${STATUS_CLASS[b.status]}`}>{STATUS_LABEL[b.status]}</span>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#e6ded5', margin: '18px 0 4px' }}>{b.property}</div>

        <div className="con-info-row">
          <span className="con-info-k">Check-in</span>
          <span className="con-info-v">{b.checkIn}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Check-out</span>
          <span className="con-info-v">{b.checkOut}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Duration</span>
          <span className="con-info-v">{b.nights} night{b.nights !== 1 ? 's' : ''}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Guests</span>
          <span className="con-info-v">{b.guests}</span>
        </div>
        {b.specialNotes && (
          <div className="con-info-row">
            <span className="con-info-k">Notes</span>
            <span className="con-info-v">{b.specialNotes}</span>
          </div>
        )}

        <button className="con-sheet-btn outline" style={{ marginTop: 22 }} onClick={onClose}>Close</button>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingsView() {
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)

  const visible = MOCK_BOOKINGS.filter(b => {
    if (filter === 'active'   && b.status !== 'CHECKED_IN') return false
    if (filter === 'upcoming' && !['CONFIRMED', 'PENDING'].includes(b.status)) return false
    if (filter === 'completed'&& b.status !== 'COMPLETED') return false
    if (search) {
      const q = search.toLowerCase()
      return b.memberName.toLowerCase().includes(q) || b.property.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total:    MOCK_BOOKINGS.length,
    active:   MOCK_BOOKINGS.filter(b => b.status === 'CHECKED_IN').length,
    upcoming: MOCK_BOOKINGS.filter(b => ['CONFIRMED', 'PENDING'].includes(b.status)).length,
  }

  return (
    <div className="con-page">
      {/* Top bar */}
      <div className="con-topbar">
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 4 }}>NSL Concierge</div>
          <div className="con-topbar-title">Bookings</div>
          <div className="con-topbar-sub">Property reservations</div>
        </div>
      </div>

      {/* Stats */}
      <div className="con-stats">
        <div className="con-stat">
          <div className="con-stat-n">{stats.total}</div>
          <div className="con-stat-l">Total</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n teal">{stats.active}</div>
          <div className="con-stat-l">Active</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n gold">{stats.upcoming}</div>
          <div className="con-stat-l">Upcoming</div>
        </div>
      </div>

      {/* Search */}
      <div className="con-search-wrap">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(230,222,213,.25)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          className="con-search"
          placeholder="Search member or property…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="con-filters">
        {(['all', 'active', 'upcoming', 'completed'] as Filter[]).map(f => (
          <button
            key={f}
            className={`con-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="con-list">
        {visible.length === 0 && (
          <div className="con-empty">
            <div className="con-empty-icon">🏨</div>
            <div className="con-empty-title">No bookings</div>
            <div className="con-empty-sub">Nothing matches this filter</div>
          </div>
        )}
        {visible.map(b => (
          <div key={b.id} className="con-card" onClick={() => setSelected(b)}>
            <div className="con-card-row">
              <div className="con-av sm" style={{ background: 'linear-gradient(135deg,#d4af37,#b8960f)', color: '#1c1c1c' }}>
                {b.initials}
              </div>
              <div className="con-card-info">
                <div className="con-card-name">{b.memberName}</div>
                <div className="con-card-meta">{b.property}</div>
              </div>
              <div className="con-card-right">
                <span className={`con-badge ${STATUS_CLASS[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              </div>
            </div>
            <div className="con-card-foot" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(230,222,213,.6)' }}>
                {b.checkIn} → {b.checkOut}
              </span>
              <span className={`con-tier ${TIER_CLASS[b.tier] ?? 'con-t-sig'}`}>{b.tier}</span>
            </div>
            {b.specialNotes && (
              <div className="con-card-desc" style={{ marginTop: 8 }}>{b.specialNotes}</div>
            )}
          </div>
        ))}
      </div>

      {selected && <BookingSheet b={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
