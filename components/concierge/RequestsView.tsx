'use client'
/**
 * RequestsView — mobile-first concierge requests interface.
 *
 * List view: stats strip + filter tabs + search + request cards
 * Detail view: full-screen overlay when a card is tapped
 */

import { useState, useRef, useEffect, useCallback } from 'react'

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

export type RequestItem = {
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

type Filter = 'all' | 'dining' | 'events' | 'travel' | 'urgent'

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

const STATUS_FLOW  = ['RECEIVED', 'IN_PROGRESS', 'AWAITING_UPDATE', 'COMPLETED']
const DINING_FLOW  = ['RECEIVED', 'IN_PROGRESS', 'CONFIRMED', 'COMPLETED']

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

const URGENCY_COLOR: Record<string, string> = {
  same_day: '#e74c3c',
  day2:     '#f5a623',
  planned:  '#1fa3a6',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyLevel(createdAt: string): 'same_day' | 'day2' | 'planned' {
  const hrs = (Date.now() - new Date(createdAt).getTime()) / 3600000
  if (hrs < 24)  return 'same_day'
  if (hrs < 48)  return 'day2'
  return 'planned'
}

function fmtWallet(ngn: number) {
  if (ngn >= 1_000_000) return `₦${(ngn / 1_000_000).toFixed(1)}M`
  if (ngn >= 1_000)     return `₦${(ngn / 1_000).toFixed(0)}k`
  return `₦${ngn.toLocaleString()}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#999'
  return (
    <span className="con-badge" style={{ background: `${color}18`, color }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLOR[tier] ?? '#d4af37'
  return (
    <span className="con-tier" style={{ background: `${color}18`, color }}>
      {tier}
    </span>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DetailSheet({
  item,
  agentId,
  onClose,
  onUpdate,
}: {
  item:     RequestItem
  agentId:  string
  onClose:  () => void
  onUpdate: (updated: RequestItem) => void
}) {
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [updating, setUpdating] = useState(false)
  const [tab,      setTab]      = useState<'details' | 'thread'>('details')
  const threadRef = useRef<HTMLDivElement>(null)
  const taRef     = useRef<HTMLTextAreaElement>(null)

  const flow    = item.type === 'dining' ? DINING_FLOW : STATUS_FLOW
  const flowIdx = flow.indexOf(item.status)
  const nextStep = flowIdx >= 0 && flowIdx < flow.length - 1 ? flow[flowIdx + 1] : null

  useEffect(() => {
    if (tab === 'thread' && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [tab, item.messages.length])

  // auto-resize textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [reply])

  async function handleStatusUpdate(newStatus: string) {
    if (updating) return
    setUpdating(true)
    try {
      const res = await fetch('/api/concierge/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: item.id, type: item.type, status: newStatus }),
      })
      if (res.ok) onUpdate({ ...item, status: newStatus })
    } finally {
      setUpdating(false)
    }
  }

  async function handleSendReply(advanceStatus?: string) {
    if (sending) return
    const body = reply.trim()
    if (!body && !advanceStatus) return
    setSending(true)
    setReply('')

    try {
      let updatedItem = { ...item }

      if (body) {
        const res = await fetch('/api/concierge/reply', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            requestId:   item.id,
            requestType: item.type,
            memberId:    item.member.id,
            body,
            agentId,
          }),
        })
        if (res.ok) {
          const msg: Message = await res.json()
          updatedItem = { ...updatedItem, messages: [...updatedItem.messages, msg] }
        } else {
          setReply(body)
        }
      }

      if (advanceStatus) {
        await fetch('/api/concierge/update-status', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ id: item.id, type: item.type, status: advanceStatus }),
        })
        updatedItem = { ...updatedItem, status: advanceStatus }
      }

      onUpdate(updatedItem)
      setTimeout(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
      }, 50)
    } finally {
      setSending(false)
    }
  }

  const urgLevel = urgencyLevel(item.createdAt)

  return (
    <div className="con-sheet">
      {/* Sheet header */}
      <div className="con-sheet-hdr">
        <button className="con-sheet-back" onClick={onClose}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="con-sheet-title-wrap">
          <div className="con-sheet-cat">
            <span style={{ fontSize: 18 }}>{CAT_ICON[item.category] ?? '✨'}</span>
            <span className="con-sheet-cat-name">{item.category}</span>
          </div>
          <div className="con-sheet-meta">
            <span>{item.member.name}</span>
            <span className="con-dot">·</span>
            <span>{item.timeAgo}</span>
            {item.isUrgent && <span className="con-urgent-pill">URGENT</span>}
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Urgency strip */}
      <div
        className="con-urgency-strip"
        style={{ background: `${URGENCY_COLOR[urgLevel]}18`, borderColor: `${URGENCY_COLOR[urgLevel]}30` }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: URGENCY_COLOR[urgLevel], flexShrink: 0 }} />
        <span style={{ color: URGENCY_COLOR[urgLevel] }}>
          {urgLevel === 'same_day' ? 'Same-day request' : urgLevel === 'day2' ? '24–48 hr request' : 'Planned request'}
        </span>
        <TierBadge tier={item.member.tier} />
      </div>

      {/* Tab switcher */}
      <div className="con-sheet-tabs">
        <button className={`con-sheet-tab ${tab === 'details' ? 'on' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`con-sheet-tab ${tab === 'thread'  ? 'on' : ''}`} onClick={() => setTab('thread')}>
          Thread {item.messages.length > 0 && <span className="con-sheet-tab-count">{item.messages.length}</span>}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="con-sheet-body">

        {tab === 'details' && (
          <>
            {/* Request description */}
            <div className="con-info-card">
              <div className="con-info-label">Request Details</div>
              <div className="con-info-desc">{item.description || '—'}</div>
              {item.type === 'dining' && Object.entries(item.extra).filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="con-info-row">
                  <span className="con-info-k">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span className="con-info-v">{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Status stepper */}
            <div className="con-stepper-card">
              <div className="con-info-label">Progress</div>
              <div className="con-stepper">
                {flow.map((s, i) => {
                  const done    = i < flowIdx
                  const current = i === flowIdx
                  return (
                    <div key={s} className="con-step">
                      <div className="con-step-col">
                        <div className={`con-step-dot ${done ? 'done' : current ? 'current' : ''}`} />
                        {i < flow.length - 1 && <div className={`con-step-line ${done ? 'done' : ''}`} />}
                      </div>
                      <div className={`con-step-lbl ${current ? 'current' : done ? 'done' : ''}`}>
                        {STATUS_LABEL[s] ?? s}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status action buttons */}
            <div className="con-actions-card">
              <div className="con-info-label">Update Status</div>
              <div className="con-action-btns">
                {flow.filter(s => s !== item.status && s !== 'COMPLETED').map(s => (
                  <button
                    key={s}
                    className={`con-action-btn ${s === nextStep ? 'primary' : 'outline'}`}
                    onClick={() => handleStatusUpdate(s)}
                    disabled={updating}
                  >
                    {updating ? '…' : `→ ${STATUS_LABEL[s]}`}
                  </button>
                ))}
                <button
                  className="con-action-btn complete"
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={updating}
                >
                  ✓ Mark Complete
                </button>
                <button
                  className="con-action-btn danger"
                  onClick={() => handleStatusUpdate(item.type === 'dining' ? 'DECLINED' : 'CANCELLED')}
                  disabled={updating}
                >
                  ✕ {item.type === 'dining' ? 'Decline' : 'Cancel'}
                </button>
              </div>
            </div>

            {/* Member context */}
            <div className="con-member-card">
              <div className="con-info-label">Member</div>
              <div className="con-member-row">
                <div className="con-member-av">{item.member.name.charAt(0).toUpperCase()}</div>
                <div className="con-member-info">
                  <div className="con-member-name">{item.member.name}</div>
                  <div className="con-member-email">{item.member.email}</div>
                </div>
              </div>
              <div className="con-kv-list">
                <div className="con-kv"><span className="con-kv-k">Tier</span><TierBadge tier={item.member.tier} /></div>
                <div className="con-kv"><span className="con-kv-k">Wallet</span><span className="con-kv-v">{fmtWallet(item.member.walletNgn)}</span></div>
                <div className="con-kv"><span className="con-kv-k">Priority</span><span className="con-kv-v" style={{ color: item.isUrgent ? '#e74c3c' : 'inherit' }}>{item.isUrgent ? '🔴 Urgent' : 'Standard'}</span></div>
                <div className="con-kv"><span className="con-kv-k">Request ID</span><span className="con-kv-v" style={{ fontFamily: 'monospace', fontSize: 10 }}>{item.id.slice(0, 12)}…</span></div>
              </div>
              {item.member.bookings.length > 0 && (
                <>
                  <div className="con-info-label" style={{ marginTop: 16 }}>Bookings</div>
                  {item.member.bookings.map(b => (
                    <div key={b.id} className="con-booking-row">
                      <div className="con-booking-prop">{b.property}</div>
                      <div className="con-booking-dates">
                        {new Date(b.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {new Date(b.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span className="con-booking-status" data-status={b.status.toLowerCase()}>{b.status}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {tab === 'thread' && (
          <div className="con-thread-wrap">
            <div className="con-thread" ref={threadRef}>
              {item.messages.length === 0 ? (
                <div className="con-thread-empty">No messages yet — start the conversation</div>
              ) : (
                item.messages.map(m => {
                  const isAgent = m.senderRole === 'CONCIERGE' || m.senderRole === 'SYSTEM'
                  return (
                    <div key={m.id} className={`con-msg ${isAgent ? 'agent' : 'member'}`}>
                      <div className="con-msg-bubble">
                        <div className="con-msg-body">{m.body}</div>
                        <div className="con-msg-time">
                          {isAgent ? 'Concierge' : item.member.name}
                          {' · '}
                          {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Reply box */}
            <div className="con-reply-box">
              <textarea
                ref={taRef}
                className="con-reply-ta"
                placeholder="Reply to member…"
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() }
                }}
                rows={2}
              />
              <div className="con-reply-actions">
                <button
                  className="con-reply-send"
                  onClick={() => handleSendReply()}
                  disabled={sending || !reply.trim()}
                >
                  {sending ? '…' : 'Send'}
                </button>
                {nextStep && (
                  <button
                    className="con-reply-advance"
                    onClick={() => handleSendReply(nextStep)}
                    disabled={sending}
                  >
                    {sending ? '…' : `Send + → ${STATUS_LABEL[nextStep]}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RequestsView({
  items: initialItems,
  stats,
  agentId,
}: {
  items:   RequestItem[]
  stats:   { total: number; urgent: number; dining: number; concierge: number }
  agentId: string
}) {
  const [items,    setItems]    = useState<RequestItem[]>(initialItems)
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<RequestItem | null>(null)

  // Re-compute live stats
  const liveStats = {
    open:      items.filter(i => !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(i.status)).length,
    inProgress:items.filter(i => i.status === 'IN_PROGRESS').length,
    urgent:    items.filter(i => i.isUrgent).length,
    dining:    items.filter(i => i.type === 'dining').length,
  }

  const handleUpdate = useCallback((updated: RequestItem) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSelected(updated)
  }, [])

  const visible = items.filter(item => {
    if (filter === 'urgent' && !item.isUrgent) return false
    if (filter === 'dining' && item.type !== 'dining') return false
    if (filter === 'events' && item.category !== 'Events') return false
    if (filter === 'travel' && item.category !== 'Transport') return false
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

  // Filter tab config
  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: 'all',    label: 'All',    count: items.length },
    { key: 'dining', label: 'Dining', count: liveStats.dining },
    { key: 'events', label: 'Events', count: items.filter(i => i.category === 'Events').length },
    { key: 'travel', label: 'Travel', count: items.filter(i => i.category === 'Transport').length },
    { key: 'urgent', label: 'Urgent', count: liveStats.urgent },
  ]

  return (
    <>
      {/* ── Page content ── */}
      <div className="con-page">

        {/* Header */}
        <div className="con-page-hdr">
          <div className="con-page-brand">
            <div className="con-brand-mark">NSL</div>
            <div>
              <div className="con-page-title">Concierge</div>
              <div className="con-page-sub">Staff Portal</div>
            </div>
          </div>
          <div className="con-hdr-date">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Stats strip */}
        <div className="con-stats-strip">
          <div className="con-stat">
            <span className="con-stat-n">{liveStats.open}</span>
            <span className="con-stat-l">Open</span>
          </div>
          <div className="con-stat-div" />
          <div className="con-stat">
            <span className="con-stat-n" style={{ color: '#1fa3a6' }}>{liveStats.inProgress}</span>
            <span className="con-stat-l">In Progress</span>
          </div>
          <div className="con-stat-div" />
          <div className="con-stat">
            <span className="con-stat-n" style={{ color: '#e74c3c' }}>{liveStats.urgent}</span>
            <span className="con-stat-l">Urgent</span>
          </div>
          <div className="con-stat-div" />
          <div className="con-stat">
            <span className="con-stat-n" style={{ color: '#27ae60' }}>
              {items.filter(i => i.status === 'COMPLETED').length}
            </span>
            <span className="con-stat-l">Done Today</span>
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
            placeholder="Search member or request…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="con-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="con-filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`con-filter-tab ${filter === f.key ? 'on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className="con-filter-count">{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Request cards */}
        <div className="con-queue">
          {visible.length === 0 && (
            <div className="con-empty">
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <div className="con-empty-title">No requests</div>
              <div className="con-empty-sub">
                {search ? 'No matches for your search' : 'All clear for this filter'}
              </div>
            </div>
          )}
          {visible.map(item => {
            const urgLevel = urgencyLevel(item.createdAt)
            const urgColor = URGENCY_COLOR[urgLevel]
            return (
              <div
                key={item.id}
                className="con-req-card"
                onClick={() => setSelected(item)}
              >
                <div className="con-req-top">
                  <div className="con-req-ico">{CAT_ICON[item.category] ?? '✨'}</div>
                  <div className="con-req-mid">
                    <div className="con-req-name">{item.member.name}</div>
                    <div className="con-req-cat">{item.category}</div>
                  </div>
                  <div className="con-req-right">
                    <StatusBadge status={item.status} />
                    <div
                      className="con-urgency-dot"
                      style={{ background: urgColor }}
                      title={urgLevel === 'same_day' ? 'Same-day' : urgLevel === 'day2' ? '24–48hr' : 'Planned'}
                    />
                  </div>
                </div>
                <div className="con-req-desc">{item.description}</div>
                <div className="con-req-foot">
                  <TierBadge tier={item.member.tier} />
                  <span className="con-req-time">{item.timeAgo}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Detail sheet overlay ── */}
      {selected && (
        <div className="con-sheet-overlay">
          <DetailSheet
            item={selected}
            agentId={agentId}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}
    </>
  )
}
