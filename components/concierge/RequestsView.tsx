'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS = [
  {
    id: 'req-001',
    type: 'concierge' as const,
    category: 'Transport',
    icon: '🚗',
    description: 'Airport pickup at MMA2, flight arrives 14:30 tomorrow. 1 passenger + 2 large bags.',
    status: 'RECEIVED',
    isUrgent: true,
    timeAgo: '8m ago',
    member: { name: 'Adewale Okonkwo', initials: 'AO', tier: 'Signature Elite', email: 'adewale@nsl.com', walletNgn: 480000 },
  },
  {
    id: 'req-002',
    type: 'dining' as const,
    category: 'Dining',
    icon: '🍽️',
    description: 'Table for 4 at Nobu Lagos, preferred 8 PM. Anniversary dinner — rose petals if possible.',
    status: 'IN_PROGRESS',
    isUrgent: false,
    timeAgo: '22m ago',
    member: { name: 'Chiamaka Obi', initials: 'CO', tier: 'Signature Plus', email: 'chiamaka@nsl.com', walletNgn: 275000 },
    extra: { restaurant: 'Nobu Lagos', date: '14 Apr 2026', time: '20:00', partySize: 4, occasion: 'Anniversary' },
  },
  {
    id: 'req-003',
    type: 'concierge' as const,
    category: 'Events',
    icon: '🎟️',
    description: '2 VIP tickets to Afrobeats Arena concert, 19 April. Front section preferred.',
    status: 'IN_PROGRESS',
    isUrgent: false,
    timeAgo: '1h ago',
    member: { name: 'Emeka Nwosu', initials: 'EN', tier: 'Signature', email: 'emeka@nsl.com', walletNgn: 120000 },
  },
  {
    id: 'req-004',
    type: 'concierge' as const,
    category: 'Gifts',
    icon: '🎁',
    description: "Curated hamper for wife's birthday — luxury chocolate, champagne, custom message card.",
    status: 'AWAITING_UPDATE',
    isUrgent: false,
    timeAgo: '2h ago',
    member: { name: 'Babatunde Adeola', initials: 'BA', tier: 'Signature Elite', email: 'babatunde@nsl.com', walletNgn: 900000 },
  },
  {
    id: 'req-005',
    type: 'dining' as const,
    category: 'Dining',
    icon: '🍽️',
    description: 'Lunch booking at Tarkwa Bay Beach Club, party of 6, Saturday.',
    status: 'RECEIVED',
    isUrgent: false,
    timeAgo: '3h ago',
    member: { name: 'Ngozi Adeyemi', initials: 'NA', tier: 'Signature Plus', email: 'ngozi@nsl.com', walletNgn: 310000 },
    extra: { restaurant: 'Tarkwa Bay Beach Club', date: '12 Apr 2026', time: '12:30', partySize: 6 },
  },
  {
    id: 'req-006',
    type: 'concierge' as const,
    category: 'Recommendations',
    icon: '⭐',
    description: 'Best art galleries in Lagos for a first-time visitor. Also any evening cultural events this week.',
    status: 'IN_PROGRESS',
    isUrgent: false,
    timeAgo: '4h ago',
    member: { name: 'Fatima Bello', initials: 'FB', tier: 'Signature', email: 'fatima@nsl.com', walletNgn: 95000 },
  },
  {
    id: 'req-007',
    type: 'concierge' as const,
    category: 'Stay Support',
    icon: '🏨',
    description: 'Room temperature in suite 702 not responding to thermostat. Guest has been waiting 20 mins.',
    status: 'RECEIVED',
    isUrgent: true,
    timeAgo: '5m ago',
    member: { name: 'Olumide Fashola', initials: 'OF', tier: 'Signature Elite', email: 'olumide@nsl.com', walletNgn: 650000 },
  },
  {
    id: 'req-008',
    type: 'concierge' as const,
    category: 'Errands',
    icon: '📦',
    description: 'Pick up tailored suit from Bespoke by Adeyemi on Adeola Odeku. Ready since Monday.',
    status: 'AWAITING_UPDATE',
    isUrgent: false,
    timeAgo: '6h ago',
    member: { name: 'Kola Martins', initials: 'KM', tier: 'Signature Plus', email: 'kola@nsl.com', walletNgn: 180000 },
  },
]

const STATUS_LABEL: Record<string, string> = {
  RECEIVED:        'Received',
  IN_PROGRESS:     'In Progress',
  AWAITING_UPDATE: 'Awaiting Update',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
  DECLINED:        'Declined',
}

const STATUS_CLASS: Record<string, string> = {
  RECEIVED:        'con-b-received',
  IN_PROGRESS:     'con-b-progress',
  AWAITING_UPDATE: 'con-b-awaiting',
  CONFIRMED:       'con-b-confirmed',
  COMPLETED:       'con-b-completed',
  CANCELLED:       'con-b-cancelled',
  DECLINED:        'con-b-cancelled',
}

const TIER_CLASS: Record<string, string> = {
  'Signature':       'con-t-sig',
  'Signature Plus':  'con-t-plus',
  'Signature Elite': 'con-t-elite',
}

type Filter = 'all' | 'dining' | 'concierge' | 'urgent'
type Request = typeof MOCK_REQUESTS[number]

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function DetailSheet({ req, onClose }: { req: Request; onClose: () => void }) {
  return (
    <>
      <div className="con-overlay" onClick={onClose} />
      <div className="con-sheet">
        <div className="con-sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div className="con-card-ico" style={{ fontSize: 22 }}>{req.icon}</div>
          <div>
            <div className="con-sheet-title">{req.category}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className={`con-badge ${STATUS_CLASS[req.status]}`}>{STATUS_LABEL[req.status]}</span>
              {req.isUrgent && <span className="con-badge con-b-urgent">Urgent</span>}
            </div>
          </div>
        </div>

        <p className="con-sheet-sub">{req.description}</p>

        {'extra' in req && req.extra && (
          <div style={{ marginBottom: 16 }}>
            {Object.entries(req.extra as Record<string, string | number>).filter(([, v]) => v).map(([k, v]) => (
              <div className="con-info-row" key={k}>
                <span className="con-info-k">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                <span className="con-info-v">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 12 }}>Member</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="con-av sm" style={{ background: 'linear-gradient(135deg,#d4af37,#b8960f)', color: '#1c1c1c' }}>
              {req.member.initials}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#e6ded5' }}>{req.member.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(230,222,213,.4)', marginTop: 2 }}>{req.member.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`con-tier ${TIER_CLASS[req.member.tier] ?? 'con-t-sig'}`}>{req.member.tier}</span>
            </div>
          </div>
          <div className="con-info-row" style={{ marginTop: 8 }}>
            <span className="con-info-k">Wallet Balance</span>
            <span className="con-info-v">
              ₦{(req.member.walletNgn / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="con-info-row">
            <span className="con-info-k">Requested</span>
            <span className="con-info-v">{req.timeAgo}</span>
          </div>
        </div>

        <button className="con-sheet-btn primary" onClick={onClose}>→ In Progress</button>
        <button className="con-sheet-btn outline" onClick={onClose}>Mark Complete</button>
        <button className="con-sheet-btn danger" onClick={onClose}>Cancel Request</button>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RequestsView() {
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Request | null>(null)
  const router = useRouter()

  const visible = MOCK_REQUESTS.filter(r => {
    if (filter === 'dining'    && r.type !== 'dining')    return false
    if (filter === 'concierge' && r.type !== 'concierge') return false
    if (filter === 'urgent'    && !r.isUrgent)            return false
    if (search) {
      const q = search.toLowerCase()
      return r.member.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total:    MOCK_REQUESTS.length,
    urgent:   MOCK_REQUESTS.filter(r => r.isUrgent).length,
    dining:   MOCK_REQUESTS.filter(r => r.type === 'dining').length,
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="con-page">
      {/* Top bar */}
      <div className="con-topbar">
        <div className="con-topbar-left">
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 4 }}>NSL Concierge</div>
          <div className="con-topbar-title">Requests</div>
          <div className="con-topbar-sub">Staff portal · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <button className="con-topbar-action" onClick={handleLogout}>Sign out</button>
      </div>

      {/* Stats */}
      <div className="con-stats">
        <div className="con-stat">
          <div className="con-stat-n">{stats.total}</div>
          <div className="con-stat-l">Open</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n red">{stats.urgent}</div>
          <div className="con-stat-l">Urgent</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n teal">{stats.dining}</div>
          <div className="con-stat-l">Dining</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n">{stats.total - stats.dining}</div>
          <div className="con-stat-l">Concierge</div>
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
          placeholder="Search member or request…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="con-filters">
        {(['all', 'dining', 'concierge', 'urgent'] as Filter[]).map(f => (
          <button
            key={f}
            className={`con-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="con-filter-count">
                {f === 'dining' ? stats.dining : f === 'concierge' ? stats.total - stats.dining : stats.urgent}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="con-list">
        {visible.length === 0 && (
          <div className="con-empty">
            <div className="con-empty-icon">✦</div>
            <div className="con-empty-title">No requests</div>
            <div className="con-empty-sub">All clear for this filter</div>
          </div>
        )}
        {visible.map(req => (
          <div key={req.id} className="con-card" onClick={() => setSelected(req)}>
            <div className="con-card-row">
              <div className="con-card-ico">{req.icon}</div>
              <div className="con-card-info">
                <div className="con-card-name">{req.member.name}</div>
                <div className="con-card-meta">{req.category}</div>
              </div>
              <div className="con-card-right">
                <span className={`con-badge ${STATUS_CLASS[req.status]}`}>{STATUS_LABEL[req.status]}</span>
                {req.isUrgent && <span className="con-urgent-dot" />}
              </div>
            </div>
            <div className="con-card-desc">{req.description}</div>
            <div className="con-card-foot">
              <span className={`con-tier ${TIER_CLASS[req.member.tier] ?? 'con-t-sig'}`}>{req.member.tier}</span>
              <span className="con-card-time">{req.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      {selected && <DetailSheet req={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
