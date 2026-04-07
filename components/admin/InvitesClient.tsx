'use client'
/**
 * InvitesClient — invite link generator + list.
 */

import { useState, useCallback, FormEvent } from 'react'

interface Invite {
  id: string
  token: string
  email: string
  createdAt: string
  expiresAt: string
  usedAt: string | null
  createdBy: string
}

interface Props {
  initialInvites: Invite[]
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

function inviteUrl(token: string) {
  return `${APP_URL}/invite/${token}`
}

function statusInfo(invite: Invite): { label: string; bg: string; color: string } {
  if (invite.usedAt) return { label: 'Used', bg: 'rgba(31,163,166,.1)', color: 'var(--teal)' }
  if (new Date(invite.expiresAt) < new Date()) return { label: 'Expired', bg: 'rgba(201,206,214,.07)', color: 'rgba(201,206,214,.35)' }
  return { label: 'Active', bg: 'rgba(30,168,106,.12)', color: '#1ea86a' }
}

export default function InvitesClient({ initialInvites }: Props) {
  const [invites, setInvites] = useState(initialInvites)
  const [email, setEmail]     = useState('')
  const [days, setDays]       = useState(14)
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')
  const [newInvite, setNewInvite] = useState<{ url: string; email: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/invites')
      if (r.ok) {
        const d = await r.json()
        setInvites(d.invites.map((i: Invite) => ({
          ...i,
          createdAt: typeof i.createdAt === 'string' ? i.createdAt : new Date(i.createdAt as unknown as Date).toISOString(),
          expiresAt: typeof i.expiresAt === 'string' ? i.expiresAt : new Date(i.expiresAt as unknown as Date).toISOString(),
          usedAt:    i.usedAt ? (typeof i.usedAt === 'string' ? i.usedAt : new Date(i.usedAt as unknown as Date).toISOString()) : null,
        })))
      }
    } catch { /* ignore */ }
  }, [])

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    setNewInvite(null)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiryDays: days }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 409) {
        setErr(data.error ?? 'Failed to generate invite.')
        return
      }
      setNewInvite({ url: data.inviteUrl, email })
      setEmail('')
      refresh()
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const active  = invites.filter(i => !i.usedAt && new Date(i.expiresAt) > new Date()).length
  const used    = invites.filter(i => !!i.usedAt).length

  const label: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(201,206,214,.4)', marginBottom: 6, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,206,214,.12)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--cream)', fontSize: 13,
    fontFamily: 'Urbanist, sans-serif', outline: 'none',
  }

  return (
    <>
      {/* Stats */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{invites.length}</div>
          <div className="adm-mini-lbl">Total Sent</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#1ea86a' }}>{active}</div>
          <div className="adm-mini-lbl">Active</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--teal)' }}>{used}</div>
          <div className="adm-mini-lbl">Accepted</div>
        </div>
      </div>

      {/* Generator card */}
      <div className="adm-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', marginBottom: 4 }}>Generate Invite Link</div>
        <div style={{ fontSize: 12, color: 'rgba(201,206,214,.4)', marginBottom: 20 }}>
          Create a unique invite link for a prospective member. Links expire after the set period.
        </div>
        <form onSubmit={handleGenerate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={label}>Email Address *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="member@example.com" style={{ ...inputStyle, width: '100%' }} required
              />
            </div>
            <div>
              <label style={label}>Expires In</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ ...inputStyle, appearance: 'none', minWidth: 110 }}>
                {[3, 7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <button
              type="submit" disabled={busy}
              style={{ padding: '10px 20px', borderRadius: 10, background: busy ? 'rgba(31,163,166,.4)' : 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', whiteSpace: 'nowrap', height: 42 }}
            >
              {busy ? 'Generating…' : '+ Generate'}
            </button>
          </div>

          {err && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,110,110,.9)' }}>
              {err}
            </div>
          )}
        </form>

        {/* New invite success */}
        {newInvite && (
          <div style={{ marginTop: 18, padding: '16px 18px', background: 'rgba(30,168,106,.07)', border: '1px solid rgba(30,168,106,.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1ea86a', marginBottom: 8 }}>
              ✓ Invite ready for {newInvite.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, color: 'rgba(201,206,214,.7)', background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '9px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {newInvite.url}
              </div>
              <button
                onClick={() => copyLink(newInvite.url)}
                style={{ padding: '8px 16px', borderRadius: 8, background: copied ? 'rgba(30,168,106,.15)' : 'rgba(31,163,166,.12)', border: `1px solid ${copied ? 'rgba(30,168,106,.3)' : 'rgba(31,163,166,.25)'}`, color: copied ? '#1ea86a' : 'var(--teal)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', whiteSpace: 'nowrap', transition: 'all .2s' }}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invites table */}
      <div className="adm-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 16 }}>
          All Invite Links
        </div>
        {invites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(201,206,214,.3)', fontSize: 13 }}>
            No invites generated yet
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(invite => {
                  const st = statusInfo(invite)
                  const url = inviteUrl(invite.token)
                  return (
                    <tr key={invite.id}>
                      <td className="adm-cell-name">{invite.email}</td>
                      <td className="adm-cell-sub">
                        {new Date(invite.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="adm-cell-sub">
                        {new Date(invite.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <div className="adm-status" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                          {invite.usedAt && (
                            <span style={{ marginLeft: 4, fontSize: 9 }}>
                              {new Date(invite.usedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {!invite.usedAt && new Date(invite.expiresAt) > new Date() ? (
                          <button
                            onClick={() => copyLink(url)}
                            className="adm-row-btn"
                            style={{ cursor: 'pointer' }}
                          >
                            Copy
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'rgba(201,206,214,.25)' }}>—</span>
                        )}
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
