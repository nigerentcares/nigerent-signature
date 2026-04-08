'use client'

import { useState } from 'react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_VENDORS = [
  {
    id: 'v-001',
    name:     'Prestige Motors Lagos',
    category: 'Transport',
    icon:     '🚗',
    contact:  'Tunde Alabi',
    phone:    '+234 802 111 2233',
    email:    'bookings@prestigemotors.ng',
    rating:   4.9,
    reviews:  48,
    notes:    'Luxury fleet — Range Rover, Maybach, V-Class. 24/7 availability. Preferred vendor.',
    turnaround: '30 min',
  },
  {
    id: 'v-002',
    name:     'Fleur Lagos',
    category: 'Flowers & Gifts',
    icon:     '💐',
    contact:  'Adaeze Williams',
    phone:    '+234 803 222 3344',
    email:    'orders@fleurlagos.com',
    rating:   4.8,
    reviews:  61,
    notes:    'Bespoke floral arrangements and curated hampers. Same-day delivery on VI.',
    turnaround: '2 hrs',
  },
  {
    id: 'v-003',
    name:     'Chef Rotimi & Co.',
    category: 'Private Dining',
    icon:     '👨‍🍳',
    contact:  'Rotimi Oladapo',
    phone:    '+234 805 333 4455',
    email:    'rotimi@privatedineng.com',
    rating:   5.0,
    reviews:  29,
    notes:    'Michelin-trained. Can cater 2–50 guests. Specialises in fusion and continental.',
    turnaround: '24 hrs',
  },
  {
    id: 'v-004',
    name:     'EventCraft Nigeria',
    category: 'Events',
    icon:     '🎉',
    contact:  'Bisi Akinwande',
    phone:    '+234 806 444 5566',
    email:    'hello@eventcraftng.com',
    rating:   4.7,
    reviews:  83,
    notes:    'Full-service event planning. Corporate and private. On-site coordinator available.',
    turnaround: '48 hrs',
  },
  {
    id: 'v-005',
    name:     'ArtHouse Lagos',
    category: 'Culture & Art',
    icon:     '🎨',
    contact:  'Kafilat Musa',
    phone:    '+234 807 555 6677',
    email:    'info@arthouselagos.com',
    rating:   4.6,
    reviews:  22,
    notes:    'Gallery tours, private viewings, art acquisition. Contemporary Nigerian artists.',
    turnaround: '1 day',
  },
  {
    id: 'v-006',
    name:     'Serenity Spa & Wellness',
    category: 'Wellness',
    icon:     '🧘',
    contact:  'Ngozi Irele',
    phone:    '+234 808 666 7788',
    email:    'book@serenityspa.ng',
    rating:   4.9,
    reviews:  74,
    notes:    'In-suite massages available. Thai, Swedish, deep tissue. Female and male therapists.',
    turnaround: '2 hrs',
  },
  {
    id: 'v-007',
    name:     'Swift Errands Lagos',
    category: 'Errands',
    icon:     '📦',
    contact:  'Musa Shehu',
    phone:    '+234 809 777 8899',
    email:    'dispatch@swifterrands.ng',
    rating:   4.5,
    reviews:  110,
    notes:    'Same-day pickup and delivery across Lagos. 7 AM – 10 PM. Tracked.',
    turnaround: '1 hr',
  },
  {
    id: 'v-008',
    name:     'TicketMaster Nigeria',
    category: 'Tickets & Events',
    icon:     '🎟️',
    contact:  'Chidi Okonkwo',
    phone:    '+234 810 888 9900',
    email:    'vip@ticketmasterng.com',
    rating:   4.4,
    reviews:  55,
    notes:    'VIP and premium tickets for concerts, sport, theatre. Usually requires 48h lead time.',
    turnaround: '48 hrs',
  },
  {
    id: 'v-009',
    name:     'Healthy Bites Catering',
    category: 'Catering',
    icon:     '🥗',
    contact:  'Amaka Ezeze',
    phone:    '+234 811 999 0011',
    email:    'orders@healthybites.ng',
    rating:   4.7,
    reviews:  38,
    notes:    'Specialises in clean eating, vegan, and gluten-free options. Meal-prep packages available.',
    turnaround: '3 hrs',
  },
  {
    id: 'v-010',
    name:     'TechFix Mobile',
    category: 'Tech Support',
    icon:     '💻',
    contact:  'Emeka Duru',
    phone:    '+234 812 000 1122',
    email:    'support@techfixlagos.com',
    rating:   4.6,
    reviews:  31,
    notes:    'On-site device repair, laptop setup, AV assistance. Great for corporate guests.',
    turnaround: '1 hr',
  },
]

const CATEGORIES = ['All', 'Transport', 'Flowers & Gifts', 'Private Dining', 'Events', 'Wellness', 'Errands', 'Tickets & Events', 'Catering', 'Tech Support', 'Culture & Art']

type Vendor = typeof MOCK_VENDORS[number]

// ─── Vendor detail sheet ──────────────────────────────────────────────────────

function VendorSheet({ v, onClose }: { v: Vendor; onClose: () => void }) {
  return (
    <>
      <div className="con-overlay" onClick={onClose} />
      <div className="con-sheet">
        <div className="con-sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="con-card-ico" style={{ width: 52, height: 52, borderRadius: 14, fontSize: 24, background: 'rgba(212,175,55,.1)' }}>
            {v.icon}
          </div>
          <div>
            <div className="con-sheet-title">{v.name}</div>
            <span className="con-vendor-cat">{v.category}</span>
          </div>
        </div>

        <div className="con-info-row">
          <span className="con-info-k">Contact</span>
          <span className="con-info-v">{v.contact}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Phone</span>
          <span className="con-info-v">{v.phone}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Email</span>
          <span className="con-info-v">{v.email}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Rating</span>
          <span className="con-info-v">
            <span style={{ color: '#d4af37' }}>★</span> {v.rating} ({v.reviews} reviews)
          </span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Lead Time</span>
          <span className="con-info-v">{v.turnaround}</span>
        </div>
        {v.notes && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(230,222,213,.3)', marginBottom: 8 }}>Notes</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(230,222,213,.7)', lineHeight: 1.6 }}>{v.notes}</div>
          </div>
        )}

        <button className="con-sheet-btn primary" style={{ marginTop: 22 }} onClick={onClose}>Copy Phone Number</button>
        <button className="con-sheet-btn outline" onClick={onClose}>Close</button>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VendorsView() {
  const [category, setCategory] = useState('All')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Vendor | null>(null)

  const visible = MOCK_VENDORS.filter(v => {
    if (category !== 'All' && v.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="con-page">
      {/* Top bar */}
      <div className="con-topbar">
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 4 }}>NSL Concierge</div>
          <div className="con-topbar-title">Vendors</div>
          <div className="con-topbar-sub">{MOCK_VENDORS.length} trusted partners</div>
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
          placeholder="Search vendors…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="con-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`con-filter ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="con-list">
        {visible.length === 0 && (
          <div className="con-empty">
            <div className="con-empty-icon">🏢</div>
            <div className="con-empty-title">No vendors</div>
            <div className="con-empty-sub">Nothing matches this filter</div>
          </div>
        )}
        {visible.map(v => (
          <div key={v.id} className="con-card" onClick={() => setSelected(v)}>
            <div className="con-card-row">
              <div className="con-card-ico" style={{ background: 'rgba(212,175,55,.1)' }}>{v.icon}</div>
              <div className="con-card-info">
                <div className="con-card-name">{v.name}</div>
                <div className="con-card-meta">{v.contact} · {v.phone}</div>
              </div>
              <div className="con-card-right">
                <span className="con-vendor-cat">{v.category}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(230,222,213,.5)' }}>
                  <span style={{ color: '#d4af37' }}>★</span> {v.rating}
                </span>
              </div>
            </div>
            <div className="con-card-desc" style={{ marginTop: 10 }}>{v.notes}</div>
            <div className="con-card-foot" style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.3)' }}>
                Lead time: {v.turnaround}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.3)' }}>
                {v.reviews} reviews
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && <VendorSheet v={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
