'use client'
/**
 * AdminMembersClient — member table with live search, tier filter,
 * Edit modal, and Award Points modal.
 */

import { useState, useMemo } from 'react'

interface Member {
  id:           string
  name:         string
  email:        string
  phone:        string | null
  city:         string
  role:         string
  isActive:     boolean
  createdAt:    string
  totalPoints:  number
  walletBalance: number
  membership: {
    tier: { name: string; slug: string }
    memberNumber: string
  } | null
}

interface Props {
  members: Member[]
}

const TIER_FILTERS = ['All', 'Signature', 'Signature Plus', 'Elite'] as const
const TIERS = [
  { label: 'Signature',       slug: 'signature' },
  { label: 'Signature Plus',  slug: 'plus'      },
  { label: 'Elite',           slug: 'elite'     },
]

function tierColor(slug?: string) {
  if (slug === 'elite') return { bg: 'rgba(200,168,75,.12)', color: 'var(--gold)' }
  if (slug === 'plus')  return { bg: 'rgba(212,175,55,.10)', color: 'var(--gold)' }
  return { bg: 'rgba(31,163,166,.10)', color: 'var(--teal)' }
}

// ── Shared modal overlay shell ────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1c2929', border: '1px solid rgba(201,206,214,.13)',
          borderRadius: 20, padding: 28, width: '100%', maxWidth: 440,
          boxShadow: '0 24px 80px rgba(0,0,0,.45)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cream)' }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(201,206,214,.08)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(201,206,214,.6)', fontSize: 18, fontFamily: 'Urbanist, sans-serif' }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.5)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.14)',
  borderRadius: 10, padding: '11px 14px', color: 'var(--cream)', fontSize: 14,
  fontFamily: 'Urbanist, sans-serif', outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer', appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23999' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
        background: disabled ? 'rgba(31,163,166,.3)' : 'var(--teal)',
        color: '#fff', fontSize: 14, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Urbanist, sans-serif', transition: 'opacity .15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Edit Member Modal ─────────────────────────────────────────────────────────

function EditMemberModal({ member, onClose, onSaved }: {
  member:  Member
  onClose: () => void
  onSaved: (updated: Partial<Member>) => void
}) {
  const [name,     setName]     = useState(member.name)
  const [phone,    setPhone]    = useState(member.phone ?? '')
  const [tierSlug, setTierSlug] = useState(member.membership?.tier.slug ?? 'signature')
  const [isActive, setIsActive] = useState(member.isActive)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function save() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     name.trim(),
          phone:    phone.trim() || null,
          tierSlug: tierSlug !== member.membership?.tier.slug ? tierSlug : undefined,
          isActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Save failed')
        return
      }
      const tier = TIERS.find(t => t.slug === tierSlug)!
      onSaved({
        name:     name.trim(),
        phone:    phone.trim() || null,
        isActive,
        membership: {
          memberNumber: member.membership?.memberNumber ?? '',
          tier: { name: tier.label, slug: tierSlug },
        },
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Edit · ${member.name}`} onClose={onClose}>
      {/* Member badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,.04)', borderRadius: 12, marginBottom: 22 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(31,163,166,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'var(--teal)', flexShrink: 0 }}>
          {member.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>{member.email}</div>
          <div style={{ fontSize: 11, color: 'rgba(201,206,214,.45)', marginTop: 2 }}>{member.membership?.memberNumber}</div>
        </div>
      </div>

      <Field label="Full Name">
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
        />
      </Field>

      <Field label="Phone">
        <input
          style={inputStyle}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+234 …"
        />
      </Field>

      <Field label="Membership Tier">
        <select
          style={selectStyle}
          value={tierSlug}
          onChange={e => setTierSlug(e.target.value)}
        >
          {TIERS.map(t => (
            <option key={t.slug} value={t.slug} style={{ background: '#1c2929' }}>{t.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Account Status">
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(v => (
            <button
              key={String(v)}
              onClick={() => setIsActive(v)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                fontSize: 13, fontWeight: 700, border: '1px solid',
                background: isActive === v
                  ? (v ? 'rgba(30,168,106,.15)' : 'rgba(255,80,80,.1)')
                  : 'rgba(201,206,214,.04)',
                borderColor: isActive === v
                  ? (v ? 'rgba(30,168,106,.35)' : 'rgba(255,80,80,.25)')
                  : 'rgba(201,206,214,.1)',
                color: isActive === v
                  ? (v ? '#1ea86a' : '#ff7070')
                  : 'rgba(201,206,214,.4)',
              }}
            >
              {v ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </Field>

      {error && (
        <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 14, padding: '8px 12px', background: 'rgba(255,80,80,.08)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(201,206,214,.15)', background: 'rgba(201,206,214,.05)', color: 'rgba(201,206,214,.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
        >
          Cancel
        </button>
        <div style={{ flex: 2 }}>
          <PrimaryBtn onClick={save} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  )
}

// ── Award Points Modal ────────────────────────────────────────────────────────

function AwardPointsModal({ member, onClose, onAwarded }: {
  member:    Member
  onClose:   () => void
  onAwarded: (pts: number) => void
}) {
  const [amount,   setAmount]   = useState('')
  const [reason,   setReason]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  const pts = parseInt(amount) || 0
  const isDeduct = pts < 0

  async function award() {
    if (!pts || !reason.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/members/${member.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pts, reason: reason.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to award points')
        return
      }
      setSuccess(true)
      onAwarded(pts)
      setTimeout(onClose, 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Points · ${member.name}`} onClose={onClose}>
      {/* Current balance */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        <div style={{ flex: 1, background: 'rgba(31,163,166,.08)', border: '1px solid rgba(31,163,166,.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)' }}>{member.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(201,206,214,.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Balance</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(201,206,214,.1)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>{member.membership?.tier.name ?? 'Signature'}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(201,206,214,.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>Tier</div>
        </div>
      </div>

      <Field label="Points Amount (use − to deduct)">
        <input
          style={{
            ...inputStyle,
            color: isDeduct ? '#ff7070' : pts > 0 ? '#1ea86a' : 'var(--cream)',
            fontWeight: pts !== 0 ? 800 : 400,
          }}
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 500 or −200"
        />
        {pts !== 0 && (
          <div style={{ fontSize: 11, marginTop: 6, color: isDeduct ? '#ff7070' : '#1ea86a', fontWeight: 700 }}>
            {isDeduct
              ? `Will deduct ${Math.abs(pts).toLocaleString()} pts → new balance ${Math.max(0, member.totalPoints + pts).toLocaleString()}`
              : `Will add ${pts.toLocaleString()} pts → new balance ${(member.totalPoints + pts).toLocaleString()}`
            }
          </div>
        )}
      </Field>

      <Field label="Reason (shown to member)">
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Welcome bonus, campaign reward, correction…"
        />
      </Field>

      {error && (
        <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 14, padding: '8px 12px', background: 'rgba(255,80,80,.08)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ fontSize: 13, color: '#1ea86a', marginBottom: 14, padding: '10px 14px', background: 'rgba(30,168,106,.1)', borderRadius: 10, textAlign: 'center', fontWeight: 700 }}>
          ✓ Points updated successfully
        </div>
      )}

      {!success && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(201,206,214,.15)', background: 'rgba(201,206,214,.05)', color: 'rgba(201,206,214,.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
          >
            Cancel
          </button>
          <div style={{ flex: 2 }}>
            <PrimaryBtn
              onClick={award}
              disabled={saving || !pts || !reason.trim()}
            >
              {saving ? 'Processing…' : isDeduct ? `Deduct ${Math.abs(pts).toLocaleString()} pts` : `Award ${pts.toLocaleString()} pts`}
            </PrimaryBtn>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Main table component ──────────────────────────────────────────────────────

export default function AdminMembersClient({ members: initialMembers }: Props) {
  const [liveMembers, setLiveMembers] = useState<Member[]>(initialMembers)
  const [query,       setQuery]       = useState('')
  const [tierFilter,  setTierFilter]  = useState<string>('All')
  const [editTarget,  setEditTarget]  = useState<Member | null>(null)
  const [ptsTarget,   setPtsTarget]   = useState<Member | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return liveMembers.filter(m => {
      if (tierFilter !== 'All' && m.membership?.tier.name !== tierFilter) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q)          ||
        m.email.toLowerCase().includes(q)         ||
        (m.phone ?? '').toLowerCase().includes(q) ||
        (m.membership?.memberNumber ?? '').toLowerCase().includes(q)
      )
    })
  }, [liveMembers, query, tierFilter])

  function handleSaved(memberId: string, patch: Partial<Member>) {
    setLiveMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...patch } : m))
    if (editTarget?.id === memberId) setEditTarget(prev => prev ? { ...prev, ...patch } : null)
  }

  function handlePointsAwarded(memberId: string, pts: number) {
    setLiveMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, totalPoints: Math.max(0, m.totalPoints + pts) } : m
    ))
  }

  return (
    <>
      {/* Search + filter bar */}
      <div className="adm-hdr-actions" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="adm-search-bar" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="11" cy="11" r="8" stroke="var(--muted)" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email or member ID…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 13, fontFamily: 'Urbanist, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {TIER_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                fontFamily: 'Urbanist, sans-serif', cursor: 'pointer', transition: 'all .15s',
                background: tierFilter === t ? 'rgba(31,163,166,.18)' : 'rgba(201,206,214,.06)',
                border: tierFilter === t ? '1px solid rgba(31,163,166,.35)' : '1px solid rgba(201,206,214,.1)',
                color: tierFilter === t ? 'var(--teal)' : 'rgba(201,206,214,.5)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {(query || tierFilter !== 'All') && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ''}
          {tierFilter !== 'All' ? ` · ${tierFilter} tier` : ''}
        </div>
      )}

      {/* Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Tier</th>
                <th>Points</th>
                <th>Wallet</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'rgba(201,206,214,.3)', fontSize: 13 }}>
                    {query || tierFilter !== 'All' ? 'No members match your search.' : 'No members yet'}
                  </td>
                </tr>
              )}
              {filtered.map(m => {
                const tc = tierColor(m.membership?.tier.slug)
                const walletNaira = Math.floor(Math.abs(m.walletBalance) / 100)
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="adm-member-cell">
                        <div className="adm-avatar sm">{m.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="adm-cell-name">{m.name}</div>
                          <div className="adm-cell-sub">{m.email}</div>
                          {m.role !== 'member' && (
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '1px', marginTop: 2 }}>
                              {m.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="adm-tier-badge" style={{ background: tc.bg, color: tc.color }}>
                        {m.membership?.tier.name ?? 'Signature'}
                      </div>
                    </td>
                    <td className="adm-cell-num">{m.totalPoints.toLocaleString()} pts</td>
                    <td className="adm-cell-num">
                      {m.walletBalance < 0 ? '-' : ''}₦{walletNaira.toLocaleString()}
                    </td>
                    <td className="adm-cell-sub">
                      {new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <div className={`adm-status ${m.isActive ? 'adm-st-active' : 'adm-st-inactive'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button
                          className="adm-row-btn"
                          onClick={() => setEditTarget(m)}
                          style={{ cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', background: 'none', border: '1px solid rgba(201,206,214,.18)', borderRadius: 8, padding: '5px 10px', color: 'rgba(201,206,214,.7)', fontSize: 11, fontWeight: 700 }}
                        >
                          Edit
                        </button>
                        <button
                          className="adm-row-btn"
                          onClick={() => setPtsTarget(m)}
                          style={{ cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.25)', borderRadius: 8, padding: '5px 10px', color: 'var(--teal)', fontSize: 11, fontWeight: 700 }}
                        >
                          Points
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditMemberModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={patch => handleSaved(editTarget.id, patch)}
        />
      )}

      {/* Award / Deduct points modal */}
      {ptsTarget && (
        <AwardPointsModal
          member={ptsTarget}
          onClose={() => setPtsTarget(null)}
          onAwarded={pts => handlePointsAwarded(ptsTarget.id, pts)}
        />
      )}
    </>
  )
}
