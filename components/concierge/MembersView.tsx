'use client'
/**
 * MembersView — searchable member directory with profile sheet.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type MemberData = {
  id:             string
  name:           string
  email:          string
  phone:          string
  city:           string
  tier:           string
  activeRequests: number
  lastMessage:    { body: string; sentAt: string; fromRole: string } | null
  preferences:    string[]
  joinedAt:       string
}

const TIER_COLOR: Record<string, string> = {
  'Signature':       '#b8960f',
  'Signature Plus':  '#1fa3a6',
  'Signature Elite': '#c8a84b',
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="con-av"
      style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: size * 0.28 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function MemberSheet({
  member,
  onClose,
  onNewRequest,
}: {
  member:         MemberData
  onClose:        () => void
  onNewRequest:   () => void
}) {
  const tierColor = TIER_COLOR[member.tier] ?? '#d4af37'

  return (
    <div className="con-sheet">
      {/* Header */}
      <div className="con-sheet-hdr">
        <button className="con-sheet-back" onClick={onClose}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="con-sheet-title-wrap">
          <div className="con-sheet-cat">
            <span className="con-sheet-cat-name">{member.name}</span>
          </div>
          <div className="con-sheet-meta">{member.email}</div>
        </div>
        <span className="con-tier" style={{ background: `${tierColor}18`, color: tierColor }}>
          {member.tier}
        </span>
      </div>

      <div className="con-sheet-body">

        {/* Profile card */}
        <div className="con-info-card">
          <div className="con-member-row" style={{ marginBottom: 16 }}>
            <Avatar name={member.name} size={52} />
            <div className="con-member-info">
              <div className="con-member-name">{member.name}</div>
              <div className="con-member-email">{member.email}</div>
              {member.phone && <div className="con-member-email">{member.phone}</div>}
            </div>
          </div>

          <div className="con-kv-list">
            {member.city && (
              <div className="con-kv">
                <span className="con-kv-k">City</span>
                <span className="con-kv-v">{member.city}</span>
              </div>
            )}
            <div className="con-kv">
              <span className="con-kv-k">Member since</span>
              <span className="con-kv-v">
                {new Date(member.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="con-kv">
              <span className="con-kv-k">Active requests</span>
              <span className="con-kv-v" style={{ color: member.activeRequests > 0 ? '#e74c3c' : 'inherit' }}>
                {member.activeRequests}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        {member.preferences.length > 0 && (
          <div className="con-info-card">
            <div className="con-info-label">Preferences</div>
            <div className="con-vendor-tags" style={{ marginTop: 0 }}>
              {member.preferences.map((p, i) => (
                <span key={i} className="con-vendor-tag">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Last interaction */}
        {member.lastMessage && (
          <div className="con-info-card">
            <div className="con-info-label">Last Interaction</div>
            <div className="con-info-desc" style={{ fontSize: 13 }}>"{member.lastMessage.body}{member.lastMessage.body.length >= 60 ? '…' : ''}"</div>
            <div style={{ fontSize: 10, color: 'rgba(28,28,28,.35)', marginTop: 6 }}>
              {member.lastMessage.fromRole === 'MEMBER' ? 'From member' : 'From concierge'}
              {' · '}
              {timeAgo(member.lastMessage.sentAt)}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="con-actions-card">
          <div className="con-info-label">Quick Actions</div>
          <div className="con-action-btns">
            <button className="con-action-btn primary" onClick={onNewRequest}>
              + New Request
            </button>
            {member.phone && (
              <a href={`tel:${member.phone}`} className="con-action-btn outline">
                📞 Call Member
              </a>
            )}
            <a href={`mailto:${member.email}`} className="con-action-btn outline">
              ✉️ Email Member
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MembersView({ members }: { members: MemberData[] }) {
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<MemberData | null>(null)
  const router = useRouter()

  const visible = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q)  ||
      m.email.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q)
    )
  })

  // Group by first letter
  const grouped = visible.reduce<Record<string, MemberData[]>>((acc, m) => {
    const letter = m.name.charAt(0).toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(m)
    return acc
  }, {})

  const sortedLetters = Object.keys(grouped).sort()

  return (
    <>
      <div className="con-page">

        {/* Header */}
        <div className="con-page-hdr">
          <div>
            <div className="con-page-title">Members</div>
            <div className="con-page-sub">{members.length} members</div>
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
            placeholder="Search by name, email, or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="con-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* Member list */}
        <div className="con-member-list">
          {sortedLetters.map(letter => (
            <div key={letter} className="con-member-group">
              <div className="con-member-letter">{letter}</div>
              {grouped[letter].map(m => {
                const tierColor = TIER_COLOR[m.tier] ?? '#d4af37'
                return (
                  <div
                    key={m.id}
                    className="con-member-item"
                    onClick={() => setSelected(m)}
                  >
                    <Avatar name={m.name} size={42} />
                    <div className="con-member-item-info">
                      <div className="con-member-item-name">{m.name}</div>
                      <div className="con-member-item-meta">
                        {m.city && <span>{m.city} · </span>}
                        {m.lastMessage
                          ? <span>{timeAgo(m.lastMessage.sentAt)}</span>
                          : <span>No messages</span>
                        }
                      </div>
                    </div>
                    <div className="con-member-item-right">
                      <span className="con-tier" style={{ background: `${tierColor}18`, color: tierColor }}>
                        {m.tier.replace('Signature ', '').replace('Signature', 'Sig.')}
                      </span>
                      {m.activeRequests > 0 && (
                        <span className="con-req-badge">{m.activeRequests}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {visible.length === 0 && (
            <div className="con-empty">
              <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
              <div className="con-empty-title">No members found</div>
              <div className="con-empty-sub">Try a different search</div>
            </div>
          )}
        </div>
      </div>

      {/* Member profile sheet */}
      {selected && (
        <div className="con-sheet-overlay">
          <MemberSheet
            member={selected}
            onClose={() => setSelected(null)}
            onNewRequest={() => {
              setSelected(null)
              router.push('/concierge')
            }}
          />
        </div>
      )}
    </>
  )
}
