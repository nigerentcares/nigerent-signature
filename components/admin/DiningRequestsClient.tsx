'use client'
/**
 * DiningRequestsClient — admin table for managing dining reservation requests.
 * Supports status updates, filtering, and search.
 */

import { useState, useCallback, useMemo } from 'react'

interface DiningRequest {
  id: string
  status: string
  preferredDate: string
  preferredTime: string
  partySize: number
  occasion: string | null
  dietaryNotes: string | null
  seatingPref: string | null
  additionalNotes: string | null
  adminNotes: string | null
  assignedTo: string | null
  confirmedAt: string | null
  createdAt: string
  restaurant: { name: string; cuisine: string; area: string }
  user: { name: string | null; email: string; phone: string | null }
}

interface Props {
  initialRequests: DiningRequest[]
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED:    'Received',
  IN_PROGRESS: 'In Progress',
  CONFIRMED:   'Confirmed',
  DECLINED:    'Declined',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  RECEIVED:    { bg: 'rgba(212,175,55,.12)',  color: '#d4af37',  border: '1px solid rgba(212,175,55,.2)' },
  IN_PROGRESS: { bg: 'rgba(31,163,166,.12)',  color: '#1fa3a6',  border: '1px solid rgba(31,163,166,.2)' },
  CONFIRMED:   { bg: 'rgba(30,168,106,.12)',  color: '#1ea86a',  border: '1px solid rgba(30,168,106,.2)' },
  DECLINED:    { bg: 'rgba(255,80,80,.12)',   color: '#ff7070',  border: '1px solid rgba(255,80,80,.2)' },
  COMPLETED:   { bg: 'rgba(201,206,214,.07)', color: 'rgba(201,206,214,.6)', border: '1px solid rgba(201,206,214,.12)' },
  CANCELLED:   { bg: 'rgba(255,80,80,.08)',   color: 'rgba(255,80,80,.5)',   border: '1px solid rgba(255,80,80,.12)' },
}

const STATUSES = ['All', 'RECEIVED', 'IN_PROGRESS', 'CONFIRMED', 'DECLINED', 'COMPLETED', 'CANCELLED'] as const

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DiningRequestsClient({ initialRequests }: Props) {
  const [requests, setRequests]       = useState(initialRequests)
  const [query, setQuery]             = useState('')
  const [statusFilter, setStatus]     = useState<string>('All')
  const [updating, setUpdating]       = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.restaurant.name.toLowerCase().includes(q) ||
        (r.user.name?.toLowerCase().includes(q) ?? false) ||
        r.user.email.toLowerCase().includes(q) ||
        (r.occasion?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [requests, query, statusFilter])

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/dining')
      if (r.ok) {
        const d = await r.json()
        setRequests(d.requests)
      }
    } catch { /* ignore */ }
  }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/dining/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await refresh()
    } catch { /* ignore */ }
    setUpdating(null)
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of requests) c[r.status] = (c[r.status] ?? 0) + 1
    return c
  }, [requests])

  return (
    <>
      {/* Stats */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{requests.length}</div>
          <div className="adm-mini-lbl">Total</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#d4af37' }}>{counts.RECEIVED ?? 0}</div>
          <div className="adm-mini-lbl">Pending</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#1ea86a' }}>{counts.CONFIRMED ?? 0}</div>
          <div className="adm-mini-lbl">Confirmed</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#1fa3a6' }}>{counts.IN_PROGRESS ?? 0}</div>
          <div className="adm-mini-lbl">In Progress</div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="adm-search-bar" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="11" cy="11" r="8" stroke="var(--muted)" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by restaurant, member, occasion…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--dark)', fontSize: 13, fontFamily: 'Urbanist, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                fontFamily: 'Urbanist, sans-serif', cursor: 'pointer', transition: 'all .15s',
                background: statusFilter === s ? 'rgba(31,163,166,.18)' : 'rgba(201,206,214,.06)',
                border: statusFilter === s ? '1px solid rgba(31,163,166,.35)' : '1px solid rgba(201,206,214,.1)',
                color: statusFilter === s ? 'var(--teal)' : 'rgba(28,28,28,.45)',
              }}
            >{s === 'All' ? 'All' : STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="adm-card">
        {requests.length === 0 ? (
          <div className="adm-offer-empty">
            <div className="adm-offer-empty-ico">🍽️</div>
            <div className="adm-offer-empty-title">No dining requests yet</div>
            <div className="adm-offer-empty-sub">Reservation requests from members will appear here.</div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Restaurant</th>
                  <th>Date / Time</th>
                  <th>Party</th>
                  <th>Occasion</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'rgba(28,28,28,.3)', fontSize: 13 }}>
                      No requests match your filter.
                    </td>
                  </tr>
                )}
                {filtered.map(r => {
                  const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED
                  const isUpdating = updating === r.id
                  return (
                    <tr key={r.id} style={{ opacity: isUpdating ? 0.5 : 1, transition: 'opacity .2s' }}>
                      <td>
                        <div className="adm-cell-name">{r.user.name ?? 'Member'}</div>
                        <div className="adm-cell-sub">{r.user.email}</div>
                      </td>
                      <td>
                        <div className="adm-cell-name">{r.restaurant.name}</div>
                        <div className="adm-cell-sub">{r.restaurant.cuisine}</div>
                      </td>
                      <td>
                        <div className="adm-cell-name">{fmtDate(r.preferredDate)}</div>
                        <div className="adm-cell-sub">{r.preferredTime}</div>
                      </td>
                      <td className="adm-cell-num">{r.partySize}</td>
                      <td className="adm-cell-sub">{r.occasion ?? '—'}</td>
                      <td>
                        <div className="adm-status" style={{ background: sc.bg, color: sc.color, border: sc.border }}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </div>
                      </td>
                      <td>
                        <div className="adm-row-actions" style={{ gap: 4 }}>
                          {r.status === 'RECEIVED' && (
                            <>
                              <button
                                className="adm-row-btn"
                                onClick={() => updateStatus(r.id, 'IN_PROGRESS')}
                                disabled={isUpdating}
                                style={{ cursor: 'pointer', color: '#1fa3a6', borderColor: 'rgba(31,163,166,.2)' }}
                              >Process</button>
                              <button
                                className="adm-row-btn"
                                onClick={() => updateStatus(r.id, 'CONFIRMED')}
                                disabled={isUpdating}
                                style={{ cursor: 'pointer', color: '#1ea86a', borderColor: 'rgba(30,168,106,.2)' }}
                              >Confirm</button>
                            </>
                          )}
                          {r.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                className="adm-row-btn"
                                onClick={() => updateStatus(r.id, 'CONFIRMED')}
                                disabled={isUpdating}
                                style={{ cursor: 'pointer', color: '#1ea86a', borderColor: 'rgba(30,168,106,.2)' }}
                              >Confirm</button>
                              <button
                                className="adm-row-btn"
                                onClick={() => updateStatus(r.id, 'DECLINED')}
                                disabled={isUpdating}
                                style={{ cursor: 'pointer', color: '#ff7070', borderColor: 'rgba(255,80,80,.2)' }}
                              >Decline</button>
                            </>
                          )}
                          {r.status === 'CONFIRMED' && (
                            <button
                              className="adm-row-btn"
                              onClick={() => updateStatus(r.id, 'COMPLETED')}
                              disabled={isUpdating}
                              style={{ cursor: 'pointer', color: 'var(--muted)' }}
                            >Complete</button>
                          )}
                          {['RECEIVED', 'IN_PROGRESS', 'CONFIRMED'].includes(r.status) && (
                            <button
                              className="adm-row-btn"
                              onClick={() => {
                                if (confirm(`Cancel this reservation at ${r.restaurant.name}?`)) {
                                  updateStatus(r.id, 'CANCELLED')
                                }
                              }}
                              disabled={isUpdating}
                              style={{ cursor: 'pointer', color: '#ff7070', borderColor: 'rgba(255,80,80,.15)', background: 'rgba(255,80,80,.04)' }}
                            >Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
