'use client'
/**
 * /concierge/vendors — Vendors tab
 *
 * Partner/vendor directory organized by category with detail sheet.
 * Uses mock data — a vendor model can be seeded/linked later.
 */

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorCategory = 'restaurants' | 'events' | 'travel' | 'wellness' | 'shopping'

type Vendor = {
  id:           string
  name:         string
  category:     VendorCategory
  location:     string
  rating:       number    // 1–5
  responseTime: string    // e.g. "< 1 hr"
  phone:        string
  email:        string
  notes?:       string
  pastBookings: number
  tags:         string[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_VENDORS: Vendor[] = [
  // Restaurants
  {
    id: 'v1', name: 'Nok by Alara', category: 'restaurants', location: 'Victoria Island, Lagos',
    rating: 5, responseTime: '< 1 hr', phone: '+234 908 000 1111', email: 'reservations@nokbyalara.com',
    notes: 'Private dining available. Min 48hr notice for parties >8.', pastBookings: 34, tags: ['Fine dining', 'African', 'Outdoor terrace'],
  },
  {
    id: 'v2', name: 'Craftgrill', category: 'restaurants', location: 'Ikoyi, Lagos',
    rating: 5, responseTime: '< 2 hrs', phone: '+234 903 123 4567', email: 'info@craftgrill.ng',
    notes: 'Member discount: 10% on food bill. Contact Temi for VIP seating.', pastBookings: 22, tags: ['Steakhouse', 'Private rooms', 'Wine bar'],
  },
  {
    id: 'v3', name: 'Yellow Chilli', category: 'restaurants', location: 'Ikeja, Lagos',
    rating: 4, responseTime: '< 3 hrs', phone: '+234 906 789 0123', email: 'book@yellowchilli.ng',
    pastBookings: 15, tags: ['Nigerian', 'Business lunch', 'Family'],
  },
  {
    id: 'v4', name: 'The Place', category: 'restaurants', location: 'Multiple locations, Lagos',
    rating: 4, responseTime: '< 2 hrs', phone: '+234 901 234 5678', email: 'concierge@theplace.ng',
    pastBookings: 18, tags: ['Nigerian', 'Casual', 'Takeaway'],
  },
  {
    id: 'v5', name: 'Bogobiri House', category: 'restaurants', location: 'Ikoyi, Lagos',
    rating: 5, responseTime: '< 1 hr', phone: '+234 907 111 2222', email: 'dining@bogobiri.com',
    notes: 'Art gallery + restaurant. Perfect for intimate dinners.', pastBookings: 11, tags: ['Boutique', 'Art venue', 'Intimate'],
  },

  // Events
  {
    id: 'v6', name: 'Terra Kulture Arena', category: 'events', location: 'Victoria Island, Lagos',
    rating: 5, responseTime: '< 4 hrs', phone: '+234 902 333 4444', email: 'events@terrakulture.com',
    notes: 'Cultural events, theatre, music. VIP box available for members.', pastBookings: 8, tags: ['Theatre', 'Cultural', 'Live music'],
  },
  {
    id: 'v7', name: 'Eko Hotels Convention', category: 'events', location: 'Victoria Island, Lagos',
    rating: 4, responseTime: '< 24 hrs', phone: '+234 908 555 6666', email: 'events@ekohotels.com',
    pastBookings: 5, tags: ['Conferences', 'Gala dinners', 'Corporate'],
  },
  {
    id: 'v8', name: 'Oriental Hotel Events', category: 'events', location: 'Victoria Island, Lagos',
    rating: 4, responseTime: '< 8 hrs', phone: '+234 904 777 8888', email: 'eventsales@orientalhotel.ng',
    pastBookings: 7, tags: ['Weddings', 'Exhibitions', 'Cocktail receptions'],
  },

  // Travel
  {
    id: 'v9', name: 'Premier Rides', category: 'travel', location: 'Lagos Island',
    rating: 5, responseTime: '< 30 min', phone: '+234 811 999 0000', email: 'dispatch@premierrides.ng',
    notes: 'Dedicated account manager: Emeka. Fleet: Prados, V8s, Mercedes. Airport transfers 24/7.', pastBookings: 67, tags: ['Airport transfers', 'Luxury fleet', '24/7'],
  },
  {
    id: 'v10', name: 'Skyways Charter', category: 'travel', location: 'Murtala Muhammed Airport',
    rating: 5, responseTime: '< 2 hrs', phone: '+234 809 456 7890', email: 'charter@skywaysnigeria.com',
    notes: 'Private jets + helicopters. Min 6hr notice for domestic.', pastBookings: 12, tags: ['Private jet', 'Helicopter', 'Charter'],
  },
  {
    id: 'v11', name: 'La Campagne Tropicana', category: 'travel', location: 'Ibeju-Lekki, Lagos',
    rating: 5, responseTime: '< 4 hrs', phone: '+234 903 222 1111', email: 'reservations@lacampagne.ng',
    notes: 'Beach eco-resort. Member rate available. Book via Shade.', pastBookings: 9, tags: ['Beach resort', 'Eco-lodge', 'Weekend getaway'],
  },

  // Wellness
  {
    id: 'v12', name: 'Sublime Wellness Spa', category: 'wellness', location: 'Ikoyi, Lagos',
    rating: 5, responseTime: '< 1 hr', phone: '+234 905 333 2222', email: 'bookings@sublimewellness.ng',
    notes: 'Members get 15% off all services. Request therapist by name.', pastBookings: 28, tags: ['Spa', 'Massages', 'Facial', 'Wellness'],
  },
  {
    id: 'v13', name: 'Body by Tunde', category: 'wellness', location: 'Victoria Island, Lagos',
    rating: 4, responseTime: '< 2 hrs', phone: '+234 907 444 5555', email: 'train@bodybytunde.com',
    pastBookings: 14, tags: ['Personal training', 'Nutrition', 'Fitness'],
  },
  {
    id: 'v14', name: 'The Detox Hub', category: 'wellness', location: 'Lekki Phase 1',
    rating: 4, responseTime: '< 3 hrs', phone: '+234 811 666 7777', email: 'hello@detoxhub.ng',
    pastBookings: 6, tags: ['Detox', 'Juice bar', 'Meditation'],
  },

  // Shopping
  {
    id: 'v15', name: 'Alara Lagos', category: 'shopping', location: 'Victoria Island, Lagos',
    rating: 5, responseTime: '< 1 hr', phone: '+234 906 888 9999', email: 'personal.shopping@alaralagos.com',
    notes: 'Personal shopping concierge available. Curated African luxury.', pastBookings: 19, tags: ['Luxury', 'African fashion', 'Lifestyle'],
  },
  {
    id: 'v16', name: 'Temple Muse', category: 'shopping', location: 'Victoria Island, Lagos',
    rating: 5, responseTime: '< 2 hrs', phone: '+234 902 000 1234', email: 'shop@templemuse.com',
    pastBookings: 11, tags: ['Concept store', 'Designer', 'Accessories'],
  },
  {
    id: 'v17', name: 'Stranger Lagos', category: 'shopping', location: 'Oniru, Lagos',
    rating: 4, responseTime: '< 4 hrs', phone: '+234 807 123 9876', email: 'info@strangerlagos.com',
    pastBookings: 7, tags: ['Streetwear', 'Sneakers', 'Pop culture'],
  },
]

const CAT_ICON: Record<VendorCategory, string> = {
  restaurants: '🍽️',
  events:      '🎟️',
  travel:      '✈️',
  wellness:    '🧖',
  shopping:    '🛍️',
}

const CAT_COLOR: Record<VendorCategory, string> = {
  restaurants: '#1fa3a6',
  events:      '#9b59b6',
  travel:      '#3498db',
  wellness:    '#e91e8c',
  shopping:    '#f39c12',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#d4af37', fontSize: 11, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all')
  const [search,         setSearch]         = useState('')
  const [selected,       setSelected]       = useState<Vendor | null>(null)

  const CATS: { key: VendorCategory | 'all'; label: string }[] = [
    { key: 'all',         label: 'All' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'events',      label: 'Events' },
    { key: 'travel',      label: 'Travel' },
    { key: 'wellness',    label: 'Wellness' },
    { key: 'shopping',    label: 'Shopping' },
  ]

  const visible = MOCK_VENDORS.filter(v => {
    if (activeCategory !== 'all' && v.category !== activeCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
    }
    return true
  })

  // Group by category if showing all
  const groupedCats = activeCategory === 'all'
    ? (['restaurants', 'events', 'travel', 'wellness', 'shopping'] as VendorCategory[])
    : [activeCategory]

  return (
    <>
      <div className="con-page">

        {/* Header */}
        <div className="con-page-hdr">
          <div>
            <div className="con-page-title">Vendors</div>
            <div className="con-page-sub">{MOCK_VENDORS.length} partners</div>
          </div>
        </div>

        {/* Search */}
        <div className="con-search-wrap">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(201,206,214,.35)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            className="con-search"
            placeholder="Search vendors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="con-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* Category filters */}
        <div className="con-filter-tabs">
          {CATS.map(c => (
            <button
              key={c.key}
              className={`con-filter-tab ${activeCategory === c.key ? 'on' : ''}`}
              onClick={() => setActiveCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Vendor list */}
        <div className="con-vendor-list">
          {groupedCats.map(cat => {
            const catVendors = visible.filter(v => v.category === cat)
            if (catVendors.length === 0) return null
            const catColor = CAT_COLOR[cat]
            return (
              <div key={cat} className="con-vendor-group">
                {activeCategory === 'all' && (
                  <div className="con-vendor-cat-hdr">
                    <span style={{ marginRight: 6 }}>{CAT_ICON[cat]}</span>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </div>
                )}
                {catVendors.map(v => (
                  <div key={v.id} className="con-vendor-card" onClick={() => setSelected(v)}>
                    <div
                      className="con-vendor-ico"
                      style={{ background: `${catColor}18`, color: catColor }}
                    >
                      {CAT_ICON[v.category]}
                    </div>
                    <div className="con-vendor-info">
                      <div className="con-vendor-name">{v.name}</div>
                      <div className="con-vendor-loc">{v.location}</div>
                      <div className="con-vendor-meta">
                        <Stars rating={v.rating} />
                        <span className="con-vendor-response">· {v.responseTime}</span>
                      </div>
                    </div>
                    <div className="con-vendor-right">
                      <span className="con-vendor-bookings">{v.pastBookings} bkgs</span>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(201,206,214,.2)' }}>
                        <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {visible.length === 0 && (
            <div className="con-empty">
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
              <div className="con-empty-title">No vendors found</div>
              <div className="con-empty-sub">Try a different search or category</div>
            </div>
          )}
        </div>
      </div>

      {/* Vendor detail sheet */}
      {selected && (
        <div className="con-sheet-overlay">
          <div className="con-sheet">
            <div className="con-sheet-hdr">
              <button className="con-sheet-back" onClick={() => setSelected(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="con-sheet-title-wrap">
                <div className="con-sheet-cat">
                  <span style={{ fontSize: 18 }}>{CAT_ICON[selected.category]}</span>
                  <span className="con-sheet-cat-name">{selected.name}</span>
                </div>
                <div className="con-sheet-meta">{selected.location}</div>
              </div>
              <Stars rating={selected.rating} />
            </div>

            <div className="con-sheet-body">

              <div className="con-info-card">
                <div className="con-kv-list">
                  <div className="con-kv">
                    <span className="con-kv-k">Category</span>
                    <span className="con-kv-v" style={{ textTransform: 'capitalize' }}>{selected.category}</span>
                  </div>
                  <div className="con-kv">
                    <span className="con-kv-k">Response Time</span>
                    <span className="con-kv-v">{selected.responseTime}</span>
                  </div>
                  <div className="con-kv">
                    <span className="con-kv-k">Past Bookings</span>
                    <span className="con-kv-v">{selected.pastBookings}</span>
                  </div>
                  <div className="con-kv">
                    <span className="con-kv-k">Phone</span>
                    <a href={`tel:${selected.phone}`} className="con-kv-v" style={{ color: 'var(--teal)' }}>{selected.phone}</a>
                  </div>
                  <div className="con-kv">
                    <span className="con-kv-k">Email</span>
                    <a href={`mailto:${selected.email}`} className="con-kv-v" style={{ color: 'var(--teal)', wordBreak: 'break-all' }}>{selected.email}</a>
                  </div>
                </div>

                {selected.tags.length > 0 && (
                  <div className="con-vendor-tags">
                    {selected.tags.map(t => (
                      <span key={t} className="con-vendor-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {selected.notes && (
                <div className="con-info-card">
                  <div className="con-info-label">Notes</div>
                  <div className="con-info-desc">{selected.notes}</div>
                </div>
              )}

              <div className="con-actions-card">
                <div className="con-info-label">Quick Actions</div>
                <div className="con-action-btns">
                  <a href={`tel:${selected.phone}`} className="con-action-btn primary">📞 Call Vendor</a>
                  <a href={`mailto:${selected.email}`} className="con-action-btn outline">✉️ Email Vendor</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
