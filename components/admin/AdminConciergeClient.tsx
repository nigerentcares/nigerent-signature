'use client'
/**
 * AdminConciergeClient
 *
 * Interactive admin concierge inbox.
 * - Filter tabs: All / Open / In Progress / Awaiting / Resolved
 * - Per-card actions: Take Request → In Progress, Reply (inline), Resolve with optional note
 * - Optimistic status updates; router.refresh() syncs server state after mutations
 */

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id:         string
  senderRole: string
  body:       string
  createdAt:  string
}

export type SerializedConciergeReq = {
  id:          string
  category:    string
  description: string
  status:      string
  priority:    string
  createdAt:   string
  user: {
    id:    string
    name:  string
    email: string
    tier:  string | null
  }
  messages: Message[]
}

type Props = {
  initialRequests: SerializedConciergeReq[]
  totalLoaded:     number
  totalSpent:      number
}

type Filter = 'all' | 'RECEIVED' | 'IN_PROGRESS' | 'AWAITING_UPDATE' | 'COMPLETED'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, string> = {
  DINING:          '🍽️',
  TRANSPORT:       '🚗',
  EVENTS:          '🎟️',
  GIFTS:           '🎁',
  RECOMMENDATIONS: '✦',
  STAY_SUPPORT:    '🏠',
  ERRANDS:         '📦',
  CUSTOM:          '💬',
  dining:          '🍽️',
  transport:       '🚗',
  events:          '🎟️',
  gifts:           '🎁',
  recs:            '✦',
  stay:            '🏠',
  errands:         '📦',
  custom:          '💬',
}

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  RECEIVED:        { bg: 'rgba(245,166,35,.12)',  color: '#d4870f',        label: 'Open'        },
  IN_PROGRESS:     { bg: 'rgba(31,163,166,.12)',  color: 'var(--teal)',    label: 'In Progress' },
  AWAITING_UPDATE: { bg: 'rgba(160,80,220,.12)',  color: '#c090f5',        label: 'Awaiting'    },
  COMPLETED:       { bg: 'rgba(31,163,166,.08)',  color: '#0d7c7e',        label: 'Resolved'    },
  CANCELLED:       { bg: '#f5f2ef',               color: 'var(--muted)',   label: 'Cancelled'   },
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',            label: 'All'         },
  { key: 'RECEIVED',       label: 'Open'        },
  { key: 'IN_PROGRESS',    label: 'In Progress' },
  { key: 'AWAITING_UPDATE',label: 'Awaiting'    },
  { key: 'COMPLETED',      label: 'Resolved'    },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminConciergeClient({ initialRequests }: Props) {
  const router = useRouter()

  const [requests,    setRequests]    = useState<SerializedConciergeReq[]>(initialRequests)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [query,       setQuery]       = useState('')
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [panel,       setPanel]       = useState<Record<string, 'thread' | 'reply' | 'resolve'>>({})
  const [replyText,   setReplyText]   = useState<Record<string, string>>({})
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({})
  const [busy,        setBusy]        = useState<Record<string, boolean>>({})
  const [flashId,     setFlashId]     = useState<string | null>(null)

  const replyRef = useRef<HTMLTextAreaElement>(null)

  // ── Derived counts ──────────────────────────────────────────────────────────

  const counts = {
    all:            requests.length,
    RECEIVED:       requests.filter(r => r.status === 'RECEIVED').length,
    IN_PROGRESS:    requests.filter(r => r.status === 'IN_PROGRESS').length,
    AWAITING_UPDATE:requests.filter(r => r.status === 'AWAITING_UPDATE').length,
    COMPLETED:      requests.filter(r => r.status === 'COMPLETED').length,
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!q) return true
      return (
        r.user.name.toLowerCase().includes(q)        ||
        r.user.email.toLowerCase().includes(q)       ||
        r.category.toLowerCase().includes(q)         ||
        r.description.toLowerCase().includes(q)
      )
    })
  }, [requests, filter, query])

  // ── Flash helper ────────────────────────────────────────────────────────────

  function flash(id: string) {
    setFlashId(id)
    setTimeout(() => setFlashId(null), 1200)
  }

  // ── Optimistic status update ────────────────────────────────────────────────

  function optimisticStatus(id: string, status: string) {
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status } : r)
    )
  }

  // ── Optimistic add message ──────────────────────────────────────────────────

  function optimisticMsg(id: string, body: string) {
    const msg: Message = {
      id:         `opt-${Date.now()}`,
      senderRole: 'CONCIERGE',
      body,
      createdAt:  new Date().toISOString(),
    }
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, messages: [...r.messages, msg] } : r)
    )
  }

  // ── Take request (RECEIVED → IN_PROGRESS) ──────────────────────────────────

  async function takeRequest(req: SerializedConciergeReq) {
    if (busy[req.id]) return
    setBusy(b => ({ ...b, [req.id]: true }))
    optimisticStatus(req.id, 'IN_PROGRESS')
    try {
      await fetch('/api/concierge/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: req.id, type: 'concierge', status: 'IN_PROGRESS' }),
      })
      flash(req.id)
      router.refresh()
    } catch {
      optimisticStatus(req.id, req.status) // rollback
    } finally {
      setBusy(b => ({ ...b, [req.id]: false }))
    }
  }

  // ── Send reply ──────────────────────────────────────────────────────────────

  async function sendReply(req: SerializedConciergeReq) {
    const body = (replyText[req.id] ?? '').trim()
    if (!body || busy[req.id]) return
    setBusy(b => ({ ...b, [req.id]: true }))
    optimisticMsg(req.id, body)
    setReplyText(t => ({ ...t, [req.id]: '' }))
    try {
      await fetch('/api/concierge/reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          requestId:   req.id,
          requestType: 'concierge',
          memberId:    req.user.id,
          body,
        }),
      })
      flash(req.id)
      setPanel(p => ({ ...p, [req.id]: 'thread' }))
      router.refresh()
    } finally {
      setBusy(b => ({ ...b, [req.id]: false }))
    }
  }

  // ── Resolve (optionally with a note) ───────────────────────────────────────

  async function resolveRequest(req: SerializedConciergeReq) {
    if (busy[req.id]) return
    setBusy(b => ({ ...b, [req.id]: true }))
    const note = (resolveNote[req.id] ?? '').trim()

    try {
      // 1. send closing note to member if provided
      if (note) {
        optimisticMsg(req.id, note)
        await fetch('/api/concierge/reply', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            requestId:   req.id,
            requestType: 'concierge',
            memberId:    req.user.id,
            body:        note,
          }),
        })
      }

      // 2. mark completed
      optimisticStatus(req.id, 'COMPLETED')
      await fetch('/api/concierge/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: req.id, type: 'concierge', status: 'COMPLETED' }),
      })

      flash(req.id)
      setResolveNote(n => ({ ...n, [req.id]: '' }))
      setPanel(p => ({ ...p, [req.id]: 'thread' }))
      setExpandedId(null)
      router.refresh()
    } finally {
      setBusy(b => ({ ...b, [req.id]: false }))
    }
  }

  // ── Toggle expand ───────────────────────────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
    if (!panel[id]) setPanel(p => ({ ...p, [id]: 'thread' }))
  }

  function openPanel(id: string, p: 'thread' | 'reply' | 'resolve') {
    setExpandedId(id)
    setPanel(prev => ({ ...prev, [id]: p }))
    if (p === 'reply') setTimeout(() => replyRef.current?.focus(), 80)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Stats bar ── */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#d4870f' }}>{counts.RECEIVED}</div>
          <div className="adm-mini-lbl">Open</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--teal)' }}>{counts.IN_PROGRESS}</div>
          <div className="adm-mini-lbl">In Progress</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#c090f5' }}>{counts.AWAITING_UPDATE}</div>
          <div className="adm-mini-lbl">Awaiting</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{counts.COMPLETED}</div>
          <div className="adm-mini-lbl">Resolved</div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="adm-search-bar" style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginRight: 6 }}>
          <circle cx="11" cy="11" r="8" stroke="var(--muted)" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by member name, email, category…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 13, fontFamily: 'Urbanist, sans-serif' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        )}
      </div>

      {query && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>
          {visible.length} request{visible.length !== 1 ? 's' : ''} matching &ldquo;{query}&rdquo;
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="adm-status-filter" style={{ marginBottom: 20 }}>
        {FILTERS.map(f => (
          <div
            key={f.key}
            className={`adm-sf ${filter === f.key ? 'on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span style={{
                marginLeft: 6,
                fontSize: 10,
                background: filter === f.key ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.06)',
                borderRadius: 20,
                padding: '1px 6px',
              }}>
                {counts[f.key]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {visible.length === 0 && (
        <div className="adm-card">
          <div className="adm-offer-empty">
            <div className="adm-offer-empty-ico">💬</div>
            <div className="adm-offer-empty-title">
              {filter === 'all' ? 'No requests yet' : `No ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()} requests`}
            </div>
            <div className="adm-offer-empty-sub">
              {filter === 'all'
                ? 'Concierge requests from members will appear here.'
                : 'Switch to All to see requests with other statuses.'}
            </div>
          </div>
        </div>
      )}

      {/* ── Request cards ── */}
      <div className="adm-req-list">
        {visible.map(req => {
          const ss       = STATUS_META[req.status] ?? STATUS_META.RECEIVED
          const isOpen   = expandedId === req.id
          const currPanel= panel[req.id] ?? 'thread'
          const isFlash  = flashId === req.id
          const isBusy   = !!busy[req.id]

          return (
            <div
              key={req.id}
              className="adm-req-card"
              style={{
                outline: isFlash ? '2px solid var(--teal)' : undefined,
                transition: 'outline .3s',
              }}
            >
              {/* ── Card header ── */}
              <div
                className="adm-req-card-top"
                onClick={() => toggleExpand(req.id)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="adm-req-cat-ico">
                  {CAT_ICONS[req.category] ?? '💬'}
                </div>

                <div className="adm-req-info" style={{ flex: 1 }}>
                  <div className="adm-req-member">
                    <span className="adm-cell-name">{req.user.name}</span>
                    {req.user.tier && (
                      <div className="adm-tier-badge sm" style={{
                        background: 'rgba(212,175,55,.1)',
                        color: 'var(--gold)',
                      }}>
                        {req.user.tier}
                      </div>
                    )}
                    {req.priority === 'URGENT' && (
                      <div className="adm-tier-badge sm" style={{ background: 'rgba(220,50,50,.1)', color: '#e05555' }}>
                        Urgent
                      </div>
                    )}
                  </div>
                  <div className="adm-cell-sub">
                    {req.category.replace(/_/g, ' ')} · {fmtDate(req.createdAt)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div className="adm-status" style={{ background: ss.bg, color: ss.color }}>
                    {ss.label}
                  </div>
                  <svg
                    width="14" height="14" fill="none" viewBox="0 0 24 24"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', opacity: .4 }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* ── Description ── */}
              {req.description && (
                <div className="adm-req-body" style={{ marginTop: 4 }}>
                  {req.description}
                </div>
              )}

              {/* ── Quick action buttons (always visible) ── */}
              <div className="adm-req-foot">
                <div className="adm-cell-sub">
                  {req.messages.length > 0
                    ? `${req.messages.length} message${req.messages.length > 1 ? 's' : ''}`
                    : 'No messages yet'}
                </div>
                <div className="adm-row-actions">
                  {req.status === 'RECEIVED' && (
                    <button
                      className="adm-row-btn teal"
                      disabled={isBusy}
                      onClick={e => { e.stopPropagation(); takeRequest(req) }}
                    >
                      {isBusy ? '…' : 'Take Request'}
                    </button>
                  )}
                  {(req.status === 'IN_PROGRESS' || req.status === 'AWAITING_UPDATE') && (
                    <button
                      className="adm-row-btn teal"
                      disabled={isBusy}
                      onClick={e => { e.stopPropagation(); openPanel(req.id, 'resolve') }}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                    <button
                      className="adm-row-btn"
                      onClick={e => { e.stopPropagation(); openPanel(req.id, 'reply') }}
                    >
                      Reply
                    </button>
                  )}
                  <button
                    className="adm-row-btn"
                    onClick={e => { e.stopPropagation(); openPanel(req.id, 'thread') }}
                  >
                    {isOpen && currPanel === 'thread' ? 'Collapse' : 'View Thread'}
                  </button>
                </div>
              </div>

              {/* ── Expanded panel ── */}
              {isOpen && (
                <div style={{
                  borderTop: '1px solid rgba(0,0,0,.06)',
                  marginTop: 12,
                  paddingTop: 16,
                }}>
                  {/* Panel tab switcher */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    {(['thread', 'reply', 'resolve'] as const)
                      .filter(p => {
                        if (p === 'resolve' && (req.status === 'COMPLETED' || req.status === 'CANCELLED')) return false
                        if (p === 'reply'   && (req.status === 'COMPLETED' || req.status === 'CANCELLED')) return false
                        return true
                      })
                      .map(p => (
                        <button
                          key={p}
                          onClick={() => setPanel(prev => ({ ...prev, [req.id]: p }))}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            padding: '4px 12px',
                            borderRadius: 20,
                            border: 'none',
                            cursor: 'pointer',
                            background: currPanel === p ? 'var(--teal)' : 'rgba(0,0,0,.06)',
                            color:      currPanel === p ? '#fff'        : 'var(--muted)',
                            transition: 'all .15s',
                          }}
                        >
                          {p === 'thread' ? 'Thread' : p === 'reply' ? 'Reply' : 'Resolve'}
                        </button>
                      ))}
                  </div>

                  {/* ── THREAD panel ── */}
                  {currPanel === 'thread' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {req.messages.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px 0',
                          color: 'rgba(0,0,0,.3)',
                          fontSize: 13,
                        }}>
                          No messages yet — reply to start the conversation
                        </div>
                      ) : (
                        req.messages.map(msg => {
                          const isConcierge = msg.senderRole === 'CONCIERGE'
                          const isSystem    = msg.senderRole === 'SYSTEM'
                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: isSystem ? 'block' : 'flex',
                                justifyContent: isConcierge ? 'flex-end' : 'flex-start',
                              }}
                            >
                              {isSystem ? (
                                <div style={{
                                  fontSize: 11,
                                  textAlign: 'center',
                                  color: 'rgba(0,0,0,.35)',
                                  padding: '4px 0',
                                  fontStyle: 'italic',
                                }}>
                                  {msg.body}
                                </div>
                              ) : (
                                <div style={{
                                  maxWidth: '75%',
                                  background: isConcierge ? 'var(--teal)' : '#f0ece8',
                                  color:      isConcierge ? '#fff'        : 'var(--dark)',
                                  borderRadius: isConcierge ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                  padding: '8px 12px',
                                  fontSize: 13,
                                  lineHeight: 1.45,
                                }}>
                                  <div>{msg.body}</div>
                                  <div style={{
                                    fontSize: 10,
                                    opacity: .6,
                                    marginTop: 4,
                                    textAlign: isConcierge ? 'right' : 'left',
                                  }}>
                                    {isConcierge ? 'Concierge' : req.user.name} · {fmtTime(msg.createdAt)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {/* ── REPLY panel ── */}
                  {currPanel === 'reply' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
                        Replying to <strong style={{ color: 'var(--dark)' }}>{req.user.name}</strong>
                        {' '}— this will appear in their concierge chat
                      </div>
                      <textarea
                        ref={replyRef}
                        rows={3}
                        placeholder="Type your message…"
                        value={replyText[req.id] ?? ''}
                        onChange={e => setReplyText(t => ({ ...t, [req.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1.5px solid rgba(0,0,0,.1)',
                          borderRadius: 10,
                          fontSize: 13,
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          outline: 'none',
                          background: '#faf8f6',
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.metaKey) sendReply(req)
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="adm-row-btn"
                          onClick={() => setPanel(p => ({ ...p, [req.id]: 'thread' }))}
                        >
                          Cancel
                        </button>
                        <button
                          className="adm-row-btn teal"
                          disabled={isBusy || !(replyText[req.id] ?? '').trim()}
                          onClick={() => sendReply(req)}
                          style={{ opacity: isBusy || !(replyText[req.id] ?? '').trim() ? .5 : 1 }}
                        >
                          {isBusy ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── RESOLVE panel ── */}
                  {currPanel === 'resolve' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{
                        background: 'rgba(31,163,166,.06)',
                        border: '1px solid rgba(31,163,166,.2)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#0a6e70',
                      }}>
                        Marking this request as <strong>Resolved</strong> will notify{' '}
                        <strong>{req.user.name}</strong>. You can add a closing note below (optional).
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Closing note for member — e.g. 'Your reservation at Osteria dei Nonni has been confirmed for 8 PM.' (optional)"
                        value={resolveNote[req.id] ?? ''}
                        onChange={e => setResolveNote(n => ({ ...n, [req.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1.5px solid rgba(0,0,0,.1)',
                          borderRadius: 10,
                          fontSize: 13,
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          outline: 'none',
                          background: '#faf8f6',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="adm-row-btn"
                          onClick={() => setPanel(p => ({ ...p, [req.id]: 'thread' }))}
                        >
                          Cancel
                        </button>
                        <button
                          className="adm-row-btn teal"
                          disabled={isBusy}
                          onClick={() => resolveRequest(req)}
                          style={{ opacity: isBusy ? .5 : 1 }}
                        >
                          {isBusy ? 'Resolving…' : '✓ Mark Resolved'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
