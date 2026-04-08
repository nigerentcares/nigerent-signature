'use client'

import { useState } from 'react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS = [
  {
    id: 'm-001',
    name:          'Adewale Okonkwo',
    initials:      'AO',
    email:         'adewale.okonkwo@email.com',
    phone:         '+234 802 345 6789',
    tier:          'Signature Elite',
    joinedDate:    'Jan 2024',
    totalBookings: 12,
    walletNgn:     480000,
    openRequests:  2,
    notes:         'Prefers suite-level rooms. Frequent business traveller.',
  },
  {
    id: 'm-002',
    name:          'Chiamaka Obi',
    initials:      'CO',
    email:         'chiamaka.obi@email.com',
    phone:         '+234 803 456 7890',
    tier:          'Signature Plus',
    joinedDate:    'Mar 2024',
    totalBookings: 7,
    walletNgn:     275000,
    openRequests:  1,
    notes:         'Vegan dietary requirement. Allergic to nuts.',
  },
  {
    id: 'm-003',
    name:          'Babatunde Adeola',
    initials:      'BA',
    email:         'babatunde.adeola@email.com',
    phone:         '+234 805 678 9012',
    tier:          'Signature Elite',
    joinedDate:    'Nov 2023',
    totalBookings: 18,
    walletNgn:     900000,
    openRequests:  1,
    notes:         'CEO. Corporate bookings often require office equipment.',
  },
  {
    id: 'm-004',
    name:          'Ngozi Adeyemi',
    initials:      'NA',
    email:         'ngozi.adeyemi@email.com',
    phone:         '+234 806 789 0123',
    tier:          'Signature Plus',
    joinedDate:    'Apr 2024',
    totalBookings: 5,
    walletNgn:     310000,
    openRequests:  1,
    notes:         '',
  },
  {
    id: 'm-005',
    name:          'Emeka Nwosu',
    initials:      'EN',
    email:         'emeka.nwosu@email.com',
    phone:         '+234 807 890 1234',
    tier:          'Signature',
    joinedDate:    'Jun 2024',
    totalBookings: 3,
    walletNgn:     120000,
    openRequests:  1,
    notes:         '',
  },
  {
    id: 'm-006',
    name:          'Fatima Bello',
    initials:      'FB',
    email:         'fatima.bello@email.com',
    phone:         '+234 808 901 2345',
    tier:          'Signature',
    joinedDate:    'Jul 2024',
    totalBookings: 4,
    walletNgn:     95000,
    openRequests:  1,
    notes:         '',
  },
  {
    id: 'm-007',
    name:          'Olumide Fashola',
    initials:      'OF',
    email:         'olumide.fashola@email.com',
    phone:         '+234 809 012 3456',
    tier:          'Signature Elite',
    joinedDate:    'Sep 2023',
    totalBookings: 22,
    walletNgn:     650000,
    openRequests:  1,
    notes:         'Long-stay guest. Prefers east-facing rooms.',
  },
  {
    id: 'm-008',
    name:          'Kola Martins',
    initials:      'KM',
    email:         'kola.martins@email.com',
    phone:         '+234 810 123 4567',
    tier:          'Signature Plus',
    joinedDate:    'Feb 2024',
    totalBookings: 8,
    walletNgn:     180000,
    openRequests:  1,
    notes:         '',
  },
  {
    id: 'm-009',
    name:          'Amaka Eze',
    initials:      'AE',
    email:         'amaka.eze@email.com',
    phone:         '+234 811 234 5678',
    tier:          'Signature Plus',
    joinedDate:    'May 2024',
    totalBookings: 6,
    walletNgn:     220000,
    openRequests:  0,
    notes:         '',
  },
  {
    id: 'm-010',
    name:          'Chukwudi Okafor',
    initials:      'CK',
    email:         'chukwudi.okafor@email.com',
    phone:         '+234 812 345 6789',
    tier:          'Signature',
    joinedDate:    'Aug 2024',
    totalBookings: 2,
    walletNgn:     50000,
    openRequests:  0,
    notes:         '',
  },
  {
    id: 'm-011',
    name:          'Yewande Coker',
    initials:      'YC',
    email:         'yewande.coker@email.com',
    phone:         '+234 813 456 7890',
    tier:          'Signature Elite',
    joinedDate:    'Dec 2023',
    totalBookings: 15,
    walletNgn:     720000,
    openRequests:  0,
    notes:         'Interior designer. Requests premium linens.',
  },
  {
    id: 'm-012',
    name:          'Tobi Adesanya',
    initials:      'TA',
    email:         'tobi.adesanya@email.com',
    phone:         '+234 814 567 8901',
    tier:          'Signature Plus',
    joinedDate:    'Jan 2025',
    totalBookings: 4,
    walletNgn:     195000,
    openRequests:  0,
    notes:         '',
  },
]

const TIER_CLASS: Record<string, string> = {
  'Signature':       'con-t-sig',
  'Signature Plus':  'con-t-plus',
  'Signature Elite': 'con-t-elite',
}

type Filter = 'all' | 'elite' | 'plus' | 'signature'
type Member = typeof MOCK_MEMBERS[number]

// ─── Member detail sheet ──────────────────────────────────────────────────────

function MemberSheet({ m, onClose }: { m: Member; onClose: () => void }) {
  return (
    <>
      <div className="con-overlay" onClick={onClose} />
      <div className="con-sheet">
        <div className="con-sheet-handle" />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <div className="con-av lg">{m.initials}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#e6ded5', marginTop: 14, marginBottom: 4 }}>{m.name}</div>
          <span className={`con-tier ${TIER_CLASS[m.tier] ?? 'con-t-sig'}`}>{m.tier}</span>
        </div>

        <div className="con-info-row">
          <span className="con-info-k">Email</span>
          <span className="con-info-v">{m.email}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Phone</span>
          <span className="con-info-v">{m.phone}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Member Since</span>
          <span className="con-info-v">{m.joinedDate}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Total Bookings</span>
          <span className="con-info-v">{m.totalBookings}</span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Wallet Balance</span>
          <span className="con-info-v" style={{ color: '#1fa3a6' }}>
            ₦{(m.walletNgn / 1000).toFixed(0)}k
          </span>
        </div>
        <div className="con-info-row">
          <span className="con-info-k">Open Requests</span>
          <span className="con-info-v" style={{ color: m.openRequests > 0 ? '#f5a623' : '#e6ded5' }}>
            {m.openRequests}
          </span>
        </div>
        {m.notes && (
          <div className="con-info-row">
            <span className="con-info-k">Notes</span>
            <span className="con-info-v">{m.notes}</span>
          </div>
        )}

        <button className="con-sheet-btn outline" style={{ marginTop: 24 }} onClick={onClose}>Close</button>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MembersView() {
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Member | null>(null)

  const visible = MOCK_MEMBERS.filter(m => {
    if (filter === 'elite'     && m.tier !== 'Signature Elite') return false
    if (filter === 'plus'      && m.tier !== 'Signature Plus')  return false
    if (filter === 'signature' && m.tier !== 'Signature')       return false
    if (search) {
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total:  MOCK_MEMBERS.length,
    elite:  MOCK_MEMBERS.filter(m => m.tier === 'Signature Elite').length,
    active: MOCK_MEMBERS.filter(m => m.openRequests > 0).length,
  }

  return (
    <div className="con-page">
      {/* Top bar */}
      <div className="con-topbar">
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#1fa3a6', marginBottom: 4 }}>NSL Concierge</div>
          <div className="con-topbar-title">Members</div>
          <div className="con-topbar-sub">{MOCK_MEMBERS.length} registered members</div>
        </div>
      </div>

      {/* Stats */}
      <div className="con-stats">
        <div className="con-stat">
          <div className="con-stat-n">{stats.total}</div>
          <div className="con-stat-l">Total</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n gold">{stats.elite}</div>
          <div className="con-stat-l">Elite</div>
        </div>
        <div className="con-stat">
          <div className="con-stat-n teal">{stats.active}</div>
          <div className="con-stat-l">Active Reqs</div>
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
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="con-filters">
        {[
          { key: 'all',       label: 'All' },
          { key: 'elite',     label: 'Elite' },
          { key: 'plus',      label: 'Plus' },
          { key: 'signature', label: 'Signature' },
        ].map(f => (
          <button
            key={f.key}
            className={`con-filter ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key as Filter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="con-list">
        {visible.length === 0 && (
          <div className="con-empty">
            <div className="con-empty-icon">👥</div>
            <div className="con-empty-title">No members found</div>
            <div className="con-empty-sub">Try a different filter or search</div>
          </div>
        )}
        {visible.map(m => (
          <div key={m.id} className="con-card" onClick={() => setSelected(m)}>
            <div className="con-card-row">
              <div className="con-av sm">{m.initials}</div>
              <div className="con-card-info">
                <div className="con-card-name">{m.name}</div>
                <div className="con-card-meta">{m.email}</div>
              </div>
              <div className="con-card-right">
                <span className={`con-tier ${TIER_CLASS[m.tier] ?? 'con-t-sig'}`}>{m.tier}</span>
                {m.openRequests > 0 && (
                  <span className="con-badge con-b-received">{m.openRequests} open</span>
                )}
              </div>
            </div>
            <div className="con-card-foot" style={{ marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.35)' }}>
                {m.totalBookings} bookings · Since {m.joinedDate}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1fa3a6' }}>
                ₦{(m.walletNgn / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && <MemberSheet m={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
