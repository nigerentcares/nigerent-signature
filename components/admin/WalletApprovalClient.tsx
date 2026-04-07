'use client'
/**
 * WalletApprovalClient — pending bank-transfer approval queue.
 * Used in /admin/wallet page.
 */

import { useState, useCallback } from 'react'

interface Txn {
  id:            string
  userId:        string
  type:          string
  amount:        number  // kobo
  status:        string
  description:   string
  paymentMethod: string | null
  createdAt:     string
  user: { name: string; email: string }
}

interface Props {
  initialPending: Txn[]
  initialAll:     Txn[]
  totalLoaded:    number
  totalSpent:     number
}

function fmtAmt(kobo: number) {
  return '₦' + Math.floor(Math.abs(kobo) / 100).toLocaleString()
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: 'rgba(30,168,106,.1)',   color: '#1ea86a' },
  PENDING:   { bg: 'rgba(245,166,35,.09)',  color: '#d4870f' },
  FAILED:    { bg: 'rgba(255,80,80,.08)',   color: 'rgba(255,90,90,.8)' },
  CANCELLED: { bg: 'rgba(201,206,214,.07)', color: 'rgba(201,206,214,.4)' },
}

export default function WalletApprovalClient({ initialPending, initialAll, totalLoaded, totalSpent }: Props) {
  const [pending, setPending]   = useState(initialPending)
  const [all, setAll]           = useState(initialAll)
  const [acting, setActing]     = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // Re-fetch pending via existing GET route for simplicity
    const r = await fetch('/api/admin/offers') // just a lightweight check; wallet has no GET yet
    void r
  }, [])

  async function handleAction(txnId: string, action: 'approve' | 'reject', note?: string) {
    setActing(txnId)
    try {
      const res = await fetch('/api/admin/wallet/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ txnId, action, note }),
      })
      if (res.ok) {
        const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED'
        setPending(prev => prev.filter(t => t.id !== txnId))
        setAll(prev => prev.map(t => t.id === txnId ? { ...t, status: newStatus } : t))
        setRejectId(null)
        setRejectNote('')
      }
    } catch { /* ignore */ }
    setActing(null)
  }

  const pendingTotal = pending.reduce((s, t) => s + t.amount, 0)

  return (
    <>
      {/* Stats */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: pending.length > 0 ? '#d4870f' : 'var(--cream)' }}>{pending.length}</div>
          <div className="adm-mini-lbl">Pending Approval</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--teal)' }}>₦{Math.floor(totalLoaded / 100).toLocaleString()}</div>
          <div className="adm-mini-lbl">Total Loaded</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val">₦{Math.floor(totalSpent / 100).toLocaleString()}</div>
          <div className="adm-mini-lbl">Total Spent</div>
        </div>
      </div>

      {/* Pending approval queue */}
      {pending.length > 0 && (
        <div className="adm-card" style={{ marginBottom: 20, border: '1px solid rgba(245,166,35,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)' }}>Pending Bank Transfers</div>
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)', marginTop: 2 }}>
                {pending.length} transfer{pending.length !== 1 ? 's' : ''} awaiting confirmation · {fmtAmt(pendingTotal)} total
              </div>
            </div>
            <div style={{ background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.25)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#d4870f' }}>
              ⏳ Needs Action
            </div>
          </div>

          {pending.map(t => (
            <div key={t.id} style={{ padding: '16px', background: 'rgba(245,166,35,.04)', border: '1px solid rgba(245,166,35,.1)', borderRadius: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div className="adm-cell-name">{t.user.name}</div>
                  <div className="adm-cell-sub">{t.user.email}</div>
                  <div className="adm-cell-sub" style={{ marginTop: 4 }}>
                    {new Date(t.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--cream)' }}>{fmtAmt(t.amount)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(201,206,214,.4)', marginTop: 2 }}>Bank transfer</div>
                </div>
              </div>

              {rejectId === t.id ? (
                /* Reject flow */
                <div>
                  <input
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 8, padding: '8px 12px', color: 'var(--cream)', fontSize: 12, fontFamily: 'Urbanist, sans-serif', outline: 'none', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setRejectId(null); setRejectNote('') }} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(201,206,214,.06)', border: 'none', color: 'rgba(201,206,214,.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>Cancel</button>
                    <button onClick={() => handleAction(t.id, 'reject', rejectNote)} disabled={acting === t.id} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,80,80,.12)', border: '1px solid rgba(255,80,80,.25)', color: 'rgba(255,90,90,.9)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', opacity: acting === t.id ? 0.5 : 1 }}>
                      {acting === t.id ? '…' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Action buttons */
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleAction(t.id, 'approve')}
                    disabled={!!acting}
                    style={{ flex: 2, padding: '10px', borderRadius: 10, background: acting === t.id ? 'rgba(30,168,106,.3)' : 'rgba(30,168,106,.12)', border: '1px solid rgba(30,168,106,.25)', color: '#1ea86a', fontSize: 12, fontWeight: 800, cursor: acting ? 'wait' : 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'all .15s', opacity: acting && acting !== t.id ? 0.5 : 1 }}
                  >
                    {acting === t.id ? '✓ Approving…' : '✓ Approve Transfer'}
                  </button>
                  <button
                    onClick={() => setRejectId(t.id)}
                    disabled={!!acting}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,80,80,.06)', border: '1px solid rgba(255,80,80,.14)', color: 'rgba(255,90,90,.7)', fontSize: 12, fontWeight: 700, cursor: acting ? 'wait' : 'pointer', fontFamily: 'Urbanist, sans-serif', opacity: acting ? 0.5 : 1 }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ background: 'rgba(30,168,106,.05)', border: '1px solid rgba(30,168,106,.12)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>✓</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1ea86a' }}>All transfers confirmed — no pending approvals</div>
        </div>
      )}

      {/* All transactions table */}
      <div className="adm-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 16 }}>All Transactions</div>
        {all.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(201,206,214,.3)', fontSize: 13 }}>No transactions yet</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map(t => {
                  const isCredit = ['LOAD', 'REFUND', 'ADJUSTMENT'].includes(t.type)
                  const ss = STATUS_STYLE[t.status] ?? STATUS_STYLE.CANCELLED
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="adm-cell-name">{t.user.name}</div>
                        <div className="adm-cell-sub">{t.user.email}</div>
                      </td>
                      <td className="adm-cell-sub">{t.description}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isCredit ? '#1ea86a' : 'var(--cream)' }}>
                          {isCredit ? '+' : '−'}{fmtAmt(t.amount)}
                        </div>
                      </td>
                      <td className="adm-cell-sub">{t.paymentMethod ?? '—'}</td>
                      <td className="adm-cell-sub">
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <div className="adm-status" style={{ background: ss.bg, color: ss.color }}>{t.status}</div>
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
