'use client'
/**
 * ConciergePortal — full interactive concierge staff portal.
 *
 * Left panel  : request queue with filter tabs + search
 * Right panel : selected request detail, status controls, reply thread, member sidebar
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id:         string
  senderRole: string
  body:       string
  createdAt:  string
}

type BookingItem = {
  id:       string
  property: string
  checkIn:  string
  checkOut: string
  status:   string
}

type RequestItem = {
  id:          string
  type:        'concierge' | 'dining'
  category:    string
  description: string
  status:      string
  priority:    string
  isUrgent:    boolean
  timeAgo:     string
  createdAt:   string
  member: {
    id:        string
    name:      string
    email:     string
    tier:      string
    walletNgn: number
    bookings:  BookingItem[]
  }
  extra: Record<string, string | number | undefined>
  messages: Message[]
}

type Filter = 'all' | 'dining' | 'concierge' | 'urgent'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_ICON: Record<string, string> = {
  Dining:          '🍽️',
  Transport:       '🚗',
  Events:          '🎟️',
  Gifts:           '🎁',
  Recommendations: '⭐',
  'Stay Support':  '🏨',
  Errands:         '📦',
  Custom:          '✨',
}

const STATUS_FLOW = ['RECEIVED', 'IN_PROGRESS', 'AWAITING_UPDATE', 'COMPLETED']
const DINING_FLOW = ['RECEIVED', 'IN_PROGRESS', 'CONFIRMED', 'COMPLETED']

const STATUS_LABEL: Record<string, string> = {
  RECEIVED:        'Received',
  IN_PROGRESS:     'In Progress',
  AWAITING_UPDATE: 'Awaiting Update',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
  DECLINED:        'Declined',
}

const STATUS_COLOR: Record<string, string> = {
  RECEIVED:        '#f5a623',
  IN_PROGRESS:     '#1fa3a6',
  AWAITING_UPDATE: '#9b59b6',
  CONFIRMED:       '#27ae60',
  COMPLETED:       '#27ae60',
  CANCELLED:       '#e74c3c',
  DECLINED:        '#e74c3c',
}

const TIER_COLOR: Record<string, string> = {
  'Signature':       '#b8960f',
  'Signature Plus':  '#1fa3a6',
  'Signature Elite': '#c8a84b',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="cp-badge" style={{ background: `${STATUS_COLOR[status] ?? '#999'}18`, color: STATUS_COLOR[status] ?? '#999' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="cp-tier" style={{ background: `${TIER_COLOR[tier] ?? '#d4af37'}14`, color: TIER_COLOR[tier] ?? '#d4af37' }}>
      {tier}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConciergePortal({
  items: initialItems,
  stats,
  agentId,
}: {
  items:   RequestItem[]
  stats:   { total: number; urgent: number; dining: number; concierge: number }
  agentId: string
}) {
  const router = useRouter()
  const [items,    setItems]    = useState<RequestItem[]>(initialItems)
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<RequestItem | null>(items[0] ?? null)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [updating, setUpdating] = useState(false)
  const taRef  = useRef<HTMLTextAreaElement>(null)
  const listRef= useRef<HTMLDivElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [reply])

  // Scroll thread to bottom when selected changes
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [selected?.id])

  // Filtered list
  const visible = items.filter(item => {
    if (filter === 'dining'    && item.type !== 'dining')    return false
    if (filter === 'concierge' && item.type !== 'concierge') return false
    if (filter === 'urgent'    && !item.isUrgent)            return false
    if (search) {
      const q = search.toLowerCase()
      return (
        item.member.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)    ||
        item.description.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Update selected when items change
  const syncSelected = useCallback((updated: RequestItem[]) => {
    if (selected) {
      const fresh = updated.find(i => i.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  }, [selected])

  async function handleStatusUpdate(newStatus: string) {
    if (!selected || updating) return
    setUpdating(true)
    try {
      const res = await fetch('/api/concierge/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: selected.id, type: selected.type, status: newStatus }),
      })
      if (res.ok) {
        const updated = items.map(i =>
          i.id === selected.id ? { ...i, status: newStatus } : i
        )
        setItems(updated)
        syncSelected(updated)
      }
    } finally {
      setUpdating(false)
    }
  }

  async function handleSendReply() {
    if (!selected || !reply.trim() || sending) return
    setSending(true)
    const body = reply.trim()
    setReply('')
    try {
      const res = await fetch('/api/concierge/reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          requestId:   selected.id,
          requestType: selected.type,
          memberId:    selected.member.id,
          body,
          agentId,
        }),
      })
      if (res.ok) {
        const msg: Message = await res.json()
        const updated = items.map(i =>
          i.id === selected.id
            ? { ...i, messages: [...i.messages, msg] }
            : i
        )
        setItems(updated)
        syncSelected(updated)
        setTimeout(() => {
          if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
        }, 50)
      } else {
        setReply(body) // restore on failure
      }
    } finally {
      setSending(false)
    }
  }

  async function handleReplyAndAdvance() {
    if (!selected || sending) return
    const flow = selected.type === 'dining' ? DINING_FLOW : STATUS_FLOW
    const idx  = flow.indexOf(selected.status)
    const nextStatus = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null

    setSending(true)
    const body = reply.trim()
    setReply('')

    try {
      // Send reply
      if (body) {
        const res = await fetch('/api/concierge/reply', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            requestId:   selected.id,
            requestType: selected.type,
            memberId:    selected.member.id,
            body,
            agentId,
          }),
        })
        if (res.ok) {
          const msg: Message = await res.json()
          const updated = items.map(i =>
            i.id === selected.id ? { ...i, messages: [...i.messages, msg] } : i
          )
          setItems(updated)
          syncSelected(updated)
        }
      }

      // Advance status
      if (nextStatus) {
        await fetch('/api/concierge/update-status', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ id: selected.id, type: selected.type, status: nextStatus }),
        })
        const updated2 = items.map(i =>
          i.id === selected.id ? { ...i, status: nextStatus } : i
        )
        setItems(updated2)
        syncSelected(updated2)
      }

      setTimeout(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
      }, 50)
    } finally {
      setSending(false)
    }
  }

  const flow     = selected?.type === 'dining' ? DINING_FLOW : STATUS_FLOW
  const flowIdx  = selected ? flow.indexOf(selected.status) : -1
  const nextStep = flowIdx >= 0 && flowIdx < flow.length - 1 ? flow[flowIdx + 1] : null

  return (
    <div className="cp-layout">

      {/* ══ LEFT — Request Queue ══ */}
      <aside className="cp-sidebar">

        {/* Header */}
        <div className="cp-sidebar-hdr">
          <div className="cp-brand">
            <div className="cp-brand-mark">NSL</div>
            <div>
              <div className="cp-brand-name">Concierge</div>
              <div className="cp-brand-sub">Staff Portal</div>
            </div>
          </div>

          {/* Logout */}
          <button className="cp-logout-btn" onClick={handleLogout} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>

          {/* Mini stats */}
          <div className="cp-mini-stats">
            <div className="cp-ms"><span className="cp-ms-n">{stats.total}</span><span className="cp-ms-l">Open</span></div>
            <div className="cp-ms"><span className="cp-ms-n" style={{ color: '#e74c3c' }}>{stats.urgent}</span><span className="cp-ms-l">Urgent</span></div>
            <div className="cp-ms"><span className="cp-ms-n">{stats.dining}</span><span className="cp-ms-l">Dining</span></div>
          </div>

          {/* Search */}
          <div className="cp-search-wrap">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(201,206,214,.35)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              className="cp-search"
              placeholder="Search member or request…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="cp-filters">
            {(['all', 'dining', 'concierge', 'urgent'] as Filter[]).map(f => (
              <button key={f} className={`cp-filter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="cp-filter-count">
                    {f === 'dining'    ? stats.dining    :
                     f === 'concierge' ? stats.concierge :
                     f === 'urgent'    ? stats.urgent    : 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Queue list */}
        <div className="cp-queue" ref={listRef}>
          {visible.length === 0 && (
            <div className="cp-empty">
              <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
              <div className="cp-empty-title">No requests</div>
              <div className="cp-empty-sub">All clear for this filter</div>
            </div>
          )}
          {visible.map(item => (
            <div
              key={item.id}
              className={`cp-card ${selected?.id === item.id ? 'on' : ''}`}
              onClick={() => setSelected(item)}
            >
              <div className="cp-card-top">
                <div className="cp-cat-ico">{CAT_ICON[item.category] ?? '✨'}</div>
                <div className="cp-card-mid">
                  <div className="cp-card-name">{item.member.name}</div>
                  <div className="cp-card-cat">{item.category}</div>
                </div>
                <div className="cp-card-right">
                  <StatusBadge status={item.status} />
                  {item.isUrgent && <span className="cp-urgent-dot" />}
                </div>
              </div>
              <div className="cp-card-desc">{item.description}</div>
              <div className="cp-card-foot">
                <TierBadge tier={item.member.tier} />
                <span className="cp-card-time">{item.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ RIGHT — Detail Panel ══ */}
      {selected ? (
        <main className="cp-detail">

          {/* ── Detail header ── */}
          <div className="cp-detail-hdr">
            <div className="cp-detail-hdr-left">
              <div className="cp-cat-ico lg">{CAT_ICON[selected.category] ?? '✨'}</div>
              <div>
                <div className="cp-detail-title">{selected.category}</div>
                <div className="cp-detail-meta">
                  <span>{selected.member.name}</span>
                  <span className="cp-dot">·</span>
                  <TierBadge tier={selected.member.tier} />
                  <span className="cp-dot">·</span>
                  <span>{selected.timeAgo}</span>
                  {selected.isUrgent && <span className="cp-urgent-pill">URGENT</span>}
                </div>
              </div>
            </div>
            <div className="cp-detail-hdr-right">
              <StatusBadge status={selected.status} />
              <a href="/home" className="cp-member-app-link">← Member App</a>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div className="cp-detail-body">

            {/* Left: request info + status flow + thread + reply */}
            <div className="cp-detail-main">

              {/* Request details card */}
              <div className="cp-info-card">
                <div className="cp-info-label">Request Details</div>
                <div className="cp-info-desc">{selected.description || '—'}</div>

                {/* Dining extras */}
                {selected.type === 'dining' && Object.entries(selected.extra).filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="cp-info-row">
                    <span className="cp-info-k">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                    <span className="cp-info-v">{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Status flow stepper */}
              <div className="cp-stepper">
                {flow.map((s, i) => {
                  const done    = i < flowIdx
                  const current = i === flowIdx
                  return (
                    <div key={s} className="cp-step-item">
                      <div className={`cp-step-dot ${done ? 'done' : current ? 'current' : ''}`} />
                      {i < flow.length - 1 && <div className={`cp-step-line ${done ? 'done' : ''}`} />}
                      <div className={`cp-step-lbl ${current ? 'current' : done ? 'done' : ''}`}>
                        {STATUS_LABEL[s] ?? s}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Status action buttons */}
              <div className="cp-status-actions">
                {flow.filter(s => s !== selected.status && s !== 'COMPLETED').map(s => (
                  <button
                    key={s}
                    className={`cp-status-btn ${s === nextStep ? 'primary' : 'outline'}`}
                    onClick={() => handleStatusUpdate(s)}
                    disabled={updating}
                  >
                    {updating ? '…' : `→ ${STATUS_LABEL[s]}`}
                  </button>
                ))}
                <button
                  className="cp-status-btn danger"
                  onClick={() => handleStatusUpdate(selected.type === 'dining' ? 'DECLINED' : 'CANCELLED')}
                  disabled={updating}
                >
                  {selected.type === 'dining' ? 'Decline' : 'Cancel'}
                </button>
              </div>

              {/* Reply thread */}
              <div className="cp-thread-wrap">
                <div className="cp-thread-label">Reply Thread</div>
                <div className="cp-thread" ref={threadRef}>
                  {selected.messages.length === 0 && (
                    <div className="cp-thread-empty">No messages yet — start the conversation</div>
                  )}
                  {selected.messages.map(m => {
                    const isAgent = m.senderRole === 'CONCIERGE' || m.senderRole === 'SYSTEM'
                    return (
                      <div key={m.id} className={`cp-msg ${isAgent ? 'agent' : 'member'}`}>
                        <div className="cp-msg-bubble">
                          <div className="cp-msg-body">{m.body}</div>
                          <div className="cp-msg-time">
                            {isAgent ? 'Concierge' : selected.member.name}
                            {' · '}
                            {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply input */}
                <div className="cp-reply-box">
                  <textarea
                    ref={taRef}
                    className="cp-reply-ta"
                    placeholder="Type a reply to the member…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() }
                    }}
                    rows={2}
                  />
                  <div className="cp-reply-actions">
                    <button
                      className="cp-reply-send"
                      onClick={handleSendReply}
                      disabled={sending || !reply.trim()}
                    >
                      {sending ? '…' : 'Send'}
                    </button>
                    {nextStep && (
                      <button
                        className="cp-reply-advance"
                        onClick={handleReplyAndAdvance}
                        disabled={sending}
                        title={`Send reply and move to ${STATUS_LABEL[nextStep]}`}
                      >
                        {sending ? '…' : `Send + → ${STATUS_LABEL[nextStep]}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Member context sidebar */}
            <div className="cp-member-ctx">
              <div className="cp-ctx-label">Member</div>

              {/* Avatar + name */}
              <div className="cp-ctx-avatar-row">
                <div className="cp-ctx-av">
                  {selected.member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="cp-ctx-name">{selected.member.name}</div>
                  <div className="cp-ctx-email">{selected.member.email}</div>
                </div>
              </div>

              {/* Tier */}
              <div className="cp-ctx-row">
                <span className="cp-ctx-k">Membership</span>
                <TierBadge tier={selected.member.tier} />
              </div>

              {/* Wallet */}
              <div className="cp-ctx-row">
                <span className="cp-ctx-k">Wallet</span>
                <span className="cp-ctx-v">
                  {selected.member.walletNgn >= 1000
                    ? `₦${(selected.member.walletNgn / 1000).toFixed(0)}k`
                    : `₦${selected.member.walletNgn.toLocaleString()}`}
                </span>
              </div>

              {/* Priority */}
              <div className="cp-ctx-row">
                <span className="cp-ctx-k">Priority</span>
                <span className="cp-ctx-v" style={{ color: selected.isUrgent ? '#e74c3c' : 'inherit' }}>
                  {selected.isUrgent ? '🔴 Urgent' : 'Standard'}
                </span>
              </div>

              {/* Request ID */}
              <div className="cp-ctx-row">
                <span className="cp-ctx-k">Request ID</span>
                <span className="cp-ctx-v" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                  {selected.id.slice(0, 12)}…
                </span>
              </div>

              {/* Booking history */}
              <div className="cp-ctx-label" style={{ marginTop: 20 }}>Booking History</div>
              {selected.member.bookings.length === 0 ? (
                <div style={{ fontSize: 11, color: 'rgba(28,28,28,.35)', marginBottom: 14 }}>No bookings yet</div>
              ) : (
                <div className="cp-ctx-bookings">
                  {selected.member.bookings.map(b => (
                    <div key={b.id} className="cp-ctx-booking">
                      <div className="cp-ctx-booking-prop">{b.property}</div>
                      <div className="cp-ctx-booking-dates">
                        {new Date(b.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {new Date(b.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span className="cp-ctx-booking-status" data-status={b.status.toLowerCase()}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              <div className="cp-ctx-label" style={{ marginTop: 20 }}>Quick Actions</div>
              <div className="cp-ctx-actions">
                <button className="cp-ctx-btn" onClick={() => handleStatusUpdate('COMPLETED')}>
                  ✓ Mark Complete
                </button>
                <button
                  className="cp-ctx-btn danger"
                  onClick={() => handleStatusUpdate(selected.type === 'dining' ? 'DECLINED' : 'CANCELLED')}
                >
                  ✕ {selected.type === 'dining' ? 'Decline' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="cp-detail cp-detail-empty">
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div className="cp-empty-title">Select a request</div>
            <div className="cp-empty-sub">Choose a request from the queue to view details</div>
          </div>
        </main>
      )}
    </div>
  )
}
