'use client'
/**
 * /concierge/bookings — Bookings tab
 *
 * Calendar/list view of all active bookings across members.
 * Uses realistic mock data (no bookings model in DB covers this scope yet).
 */

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingType = 'dining' | 'events' | 'travel' | 'spa' | 'shopping'
type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

type Booking = {
  id:         string
  memberName: string
  memberTier: string
  venue:      string
  type:       BookingType
  date:       string   // ISO date string
  time:       string
  status:     BookingStatus
  partySize?: number
  notes?:     string
  vendor?:    string
  amount?:    string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1', memberName: 'Adaeze Okonkwo', memberTier: 'Signature Elite',
    venue: 'Nok by Alara', type: 'dining', date: '2026-04-08', time: '19:30',
    status: 'confirmed', partySize: 4, notes: 'Anniversary dinner — champagne on arrival',
    vendor: 'Nok by Alara', amount: '₦85,000',
  },
  {
    id: 'b2', memberName: 'Chukwuemeka Adeyemi', memberTier: 'Signature Plus',
    venue: 'Four Points by Sheraton', type: 'travel', date: '2026-04-09', time: '14:00',
    status: 'confirmed', notes: 'Airport transfer — 2 guests, Abuja to Lagos',
    vendor: 'Premier Rides', amount: '₦45,000',
  },
  {
    id: 'b3', memberName: 'Ngozi Eze', memberTier: 'Signature',
    venue: 'Terra Kulture Arena', type: 'events', date: '2026-04-09', time: '18:00',
    status: 'pending', partySize: 2, notes: 'RSVP pending — follow up with venue',
    vendor: 'Terra Kulture', amount: '₦30,000',
  },
  {
    id: 'b4', memberName: 'Babatunde Fashola', memberTier: 'Signature Elite',
    venue: 'Sublime Wellness Spa', type: 'spa', date: '2026-04-10', time: '10:00',
    status: 'confirmed', notes: 'Deep tissue + hot stone — request for female therapist',
    vendor: 'Sublime Wellness', amount: '₦120,000',
  },
  {
    id: 'b5', memberName: 'Amaka Obi', memberTier: 'Signature Plus',
    venue: 'Alara Lagos', type: 'shopping', date: '2026-04-10', time: '13:00',
    status: 'pending', notes: 'Personal shopping session — budget ₦500k',
    vendor: 'Alara Lagos',
  },
  {
    id: 'b6', memberName: 'Kelechi Nwosu', memberTier: 'Signature',
    venue: 'La Campagne Tropicana', type: 'travel', date: '2026-04-11', time: '08:00',
    status: 'confirmed', partySize: 3, notes: 'Beach resort weekend — 2 nights',
    vendor: 'La Campagne', amount: '₦380,000',
  },
  {
    id: 'b7', memberName: 'Ifeoma Chukwu', memberTier: 'Signature Elite',
    venue: 'Craftgrill', type: 'dining', date: '2026-04-11', time: '20:00',
    status: 'confirmed', partySize: 6, notes: 'Private dining room — birthday celebration',
    vendor: 'Craftgrill', amount: '₦210,000',
  },
  {
    id: 'b8', memberName: 'Obiora Mensah', memberTier: 'Signature Plus',
    venue: 'Yellow Chilli', type: 'dining', date: '2026-04-12', time: '13:00',
    status: 'pending', partySize: 2, notes: 'Business lunch — quiet table preferred',
    vendor: 'Yellow Chilli',
  },
  {
    id: 'b9', memberName: 'Adaeze Okonkwo', memberTier: 'Signature Elite',
    venue: 'Lagos Business School', type: 'events', date: '2026-04-13', time: '09:00',
    status: 'confirmed', notes: 'Executive leadership summit — VIP badge',
    vendor: 'LBS Events', amount: '₦150,000',
  },
  {
    id: 'b10', memberName: 'Taiwo Adesanya', memberTier: 'Signature',
    venue: 'Escape Room Lagos', type: 'events', date: '2026-04-14', time: '16:00',
    status: 'cancelled', partySize: 5, notes: 'Cancelled by member — reschedule requested',
  },
]

const TYPE_ICON: Record<BookingType, string> = {
  dining:   '🍽️',
  events:   '🎟️',
  travel:   '✈️',
  spa:      '🧖',
  shopping: '🛍️',
}

const TYPE_COLOR: Record<BookingType, string> = {
  dining:   '#1fa3a6',
  events:   '#9b59b6',
  travel:   '#3498db',
  spa:      '#e91e8c',
  shopping: '#f39c12',
}

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending:   '#f5a623',
  confirmed: '#27ae60',
  cancelled: '#e74c3c',
}

const TIER_COLOR: Record<string, string> = {
  'Signature':       '#b8960f',
  'Signature Plus':  '#1fa3a6',
  'Signature Elite': '#c8a84b',
}

type FilterType = BookingType | 'all'
type ViewMode   = 'list' | 'day' | 'week'

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [filterType,  setFilterType]  = useState<FilterType>('all')
  const [viewMode,    setViewMode]    = useState<ViewMode>('list')
  const [selectedBkg, setSelectedBkg] = useState<Booking | null>(null)

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'dining',   label: 'Dining' },
    { key: 'events',   label: 'Events' },
    { key: 'travel',   label: 'Travel' },
    { key: 'spa',      label: 'Spa' },
    { key: 'shopping', label: 'Shopping' },
  ]

  const visible = filterType === 'all'
    ? MOCK_BOOKINGS
    : MOCK_BOOKINGS.filter(b => b.type === filterType)

  // Group by date for list view
  const grouped = visible.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.date]) acc[b.date] = []
    acc[b.date].push(b)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  function fmtDate(iso: string) {
    const d = new Date(iso + 'T00:00:00')
    const today    = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    if (iso === today)    return 'Today'
    if (iso === tomorrow) return 'Tomorrow'
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="con-page">

      {/* Header */}
      <div className="con-page-hdr">
        <div>
          <div className="con-page-title">Bookings</div>
          <div className="con-page-sub">{MOCK_BOOKINGS.filter(b => b.status !== 'cancelled').length} active bookings</div>
        </div>
        <div className="con-view-toggle">
          {(['list', 'day', 'week'] as ViewMode[]).map(v => (
            <button
              key={v}
              className={`con-view-btn ${viewMode === v ? 'on' : ''}`}
              onClick={() => setViewMode(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="con-filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`con-filter-tab ${filterType === f.key ? 'on' : ''}`}
            onClick={() => setFilterType(f.key)}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="con-filter-count">
                {MOCK_BOOKINGS.filter(b => b.type === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
      <div className="con-bkg-list">
        {sortedDates.map(date => (
          <div key={date} className="con-bkg-day">
            <div className="con-bkg-date-hdr">{fmtDate(date)}</div>
            {grouped[date].map(bkg => (
              <div
                key={bkg.id}
                className="con-bkg-card"
                onClick={() => setSelectedBkg(selectedBkg?.id === bkg.id ? null : bkg)}
              >
                <div className="con-bkg-card-left">
                  <div
                    className="con-bkg-type-ico"
                    style={{ background: `${TYPE_COLOR[bkg.type]}18`, color: TYPE_COLOR[bkg.type] }}
                  >
                    {TYPE_ICON[bkg.type]}
                  </div>
                </div>
                <div className="con-bkg-card-body">
                  <div className="con-bkg-venue">{bkg.venue}</div>
                  <div className="con-bkg-meta">
                    <span
                      className="con-tier"
                      style={{
                        background: `${TIER_COLOR[bkg.memberTier] ?? '#d4af37'}18`,
                        color: TIER_COLOR[bkg.memberTier] ?? '#d4af37',
                      }}
                    >
                      {bkg.memberName}
                    </span>
                    <span className="con-bkg-time">· {bkg.time}</span>
                    {bkg.partySize && <span className="con-bkg-time">· {bkg.partySize} guests</span>}
                  </div>
                  {selectedBkg?.id === bkg.id && bkg.notes && (
                    <div className="con-bkg-notes">{bkg.notes}</div>
                  )}
                  {selectedBkg?.id === bkg.id && bkg.amount && (
                    <div className="con-bkg-amount">{bkg.amount}</div>
                  )}
                  {selectedBkg?.id === bkg.id && bkg.vendor && (
                    <div className="con-bkg-vendor">Vendor: {bkg.vendor}</div>
                  )}
                </div>
                <div className="con-bkg-card-right">
                  <span
                    className="con-badge"
                    style={{
                      background: `${STATUS_COLOR[bkg.status]}18`,
                      color: STATUS_COLOR[bkg.status],
                    }}
                  >
                    {bkg.status.charAt(0).toUpperCase() + bkg.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {visible.length === 0 && (
          <div className="con-empty">
            <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
            <div className="con-empty-title">No bookings</div>
            <div className="con-empty-sub">No {filterType} bookings found</div>
          </div>
        )}
      </div>

      {/* Add booking FAB */}
      <button className="con-fab">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
