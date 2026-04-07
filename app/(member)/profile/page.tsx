'use client'
/**
 * /profile — Member Profile
 * Displays account info + allows inline editing of name, phone, city, preferences.
 */

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ApiMe {
  id:          string
  name:        string
  email:       string
  phone?:      string | null
  city?:       string
  preferences?: string[]
  role?:        string
  membership?: {
    memberNumber?: string
    tier?: { name?: string }
  }
}

const TIER_BG: Record<string, string> = {
  'Signature':       'rgba(212,175,55,.12)',
  'Signature Plus':  'rgba(31,163,166,.12)',
  'Signature Elite': 'rgba(200,168,75,.12)',
}
const TIER_FG: Record<string, string> = {
  'Signature':       '#b8960f',
  'Signature Plus':  '#1fa3a6',
  'Signature Elite': '#c8a84b',
}

const PREFERENCE_OPTIONS = [
  'Fine Dining', 'Wellness & Spa', 'Nightlife', 'Golf', 'Art & Culture',
  'Fitness', 'Travel', 'Private Events', 'Family Activities', 'Wine & Spirits',
]

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan']

export default function ProfilePage() {
  const router              = useRouter()
  const [me, setMe]         = useState<ApiMe | null>(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy]     = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk]   = useState(false)

  // Edit form state
  const [editName,   setEditName]   = useState('')
  const [editPhone,  setEditPhone]  = useState('')
  const [editCity,   setEditCity]   = useState('')
  const [editPrefs,  setEditPrefs]  = useState<string[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.replace('/login?reason=session_expired'); return }
        setMe(d as ApiMe)
      })
      .catch(() => router.replace('/login?reason=session_expired'))
  }, [router])

  function startEdit() {
    if (!me) return
    setEditName(me.name)
    setEditPhone(me.phone ?? '')
    setEditCity(me.city ?? 'Lagos')
    setEditPrefs(me.preferences ?? [])
    setSaveErr('')
    setSaveOk(false)
    setEditing(true)
  }

  function togglePref(p: string) {
    setEditPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaveErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        editName.trim(),
          phone:       editPhone.trim() || null,
          city:        editCity,
          preferences: editPrefs,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveErr(data.error ?? 'Could not save changes.'); return }
      setMe(m => m ? { ...m, name: editName.trim(), phone: editPhone.trim() || null, city: editCity, preferences: editPrefs } : m)
      setSaveOk(true)
      setTimeout(() => { setEditing(false); setSaveOk(false) }, 800)
    } catch {
      setSaveErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setLogoutBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  /* ── derived values ── */
  const tierName = me?.membership?.tier?.name ?? 'Signature'
  const memberId = me?.membership?.memberNumber ?? (me?.id?.slice(0, 8).toUpperCase() ?? '—')
  const initial  = (me?.name ?? '?').charAt(0).toUpperCase()

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(201,206,214,.12)', borderRadius: 12,
    padding: '11px 14px', color: 'var(--cream)', fontSize: 13,
    fontFamily: 'Urbanist, sans-serif', outline: 'none', marginBottom: 4,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const,
    color: 'rgba(201,206,214,.35)', marginBottom: 5, display: 'block',
  }
  const prefPill = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: active ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.1)',
    background: active ? 'rgba(31,163,166,.1)' : 'rgba(255,255,255,.03)',
    color: active ? 'var(--teal)' : 'rgba(201,206,214,.4)',
    transition: 'all .15s', fontFamily: 'Urbanist, sans-serif',
  })

  return (
    <div className="pg" style={{ background: '#0f1a1a', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => editing ? setEditing(false) : router.back()}
          style={{ background: 'rgba(201,206,214,.06)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,206,214,.5)', flexShrink: 0 }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 2 }}>Account</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cream)' }}>
            {editing ? 'Edit Profile' : 'Profile'}
          </div>
        </div>
        {me && !editing && (
          <button
            onClick={startEdit}
            style={{ background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)', borderRadius: 10, padding: '8px 14px', color: 'var(--teal)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
          >
            Edit
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── Skeleton while loading ── */}
        {!me && (
          <>
            <div className="sk" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px' }} />
            <div className="sk" style={{ width: 140, height: 18, borderRadius: 8, margin: '0 auto 8px' }} />
            <div className="sk" style={{ width: 180, height: 12, borderRadius: 6, margin: '0 auto 30px' }} />
            {[1,2,3,4].map(i => <div key={i} className="sk" style={{ width: '100%', height: 56, borderRadius: 14, marginBottom: 10 }} />)}
          </>
        )}

        {/* ── EDIT MODE ── */}
        {me && editing && (
          <form onSubmit={handleSave}>

            {/* Avatar (non-editable, for now) */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1fa3a6 0%,#167a7d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                {initial}
              </div>
              <span style={{ background: TIER_BG[tierName] ?? 'rgba(212,175,55,.1)', color: TIER_FG[tierName] ?? '#d4af37', fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                {tierName}
              </span>
            </div>

            {/* Fields */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, padding: '20px 18px', marginBottom: 14 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Display Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} required maxLength={80} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Phone Number</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+234 …" style={inputStyle} maxLength={20} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <select value={editCity} onChange={e => setEditCity(e.target.value)} style={{ ...inputStyle, appearance: 'none', marginBottom: 0 }}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Preferences */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, padding: '20px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>Interests</div>
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)', marginBottom: 14 }}>
                Select your interests to personalise your experience.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PREFERENCE_OPTIONS.map(p => (
                  <button key={p} type="button" onClick={() => togglePref(p)} style={prefPill(editPrefs.includes(p))}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {saveErr && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 12, fontSize: 12, color: 'rgba(255,110,110,.9)', marginBottom: 14 }}>
                {saveErr}
              </div>
            )}
            {saveOk && (
              <div style={{ padding: '10px 14px', background: 'rgba(30,168,106,.08)', border: '1px solid rgba(30,168,106,.2)', borderRadius: 12, fontSize: 12, color: '#1ea86a', marginBottom: 14 }}>
                ✓ Profile saved!
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button" onClick={() => setEditing(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(201,206,214,.05)', border: '1px solid rgba(201,206,214,.1)', color: 'rgba(201,206,214,.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={busy}
                style={{ flex: 2, padding: '14px', borderRadius: 14, background: busy || saveOk ? (saveOk ? '#1ea86a' : 'rgba(31,163,166,.4)') : 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'background .2s' }}
              >
                {busy ? 'Saving…' : saveOk ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* ── VIEW MODE ── */}
        {me && !editing && (
          <>
            {/* Avatar card */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1fa3a6 0%,#167a7d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                {initial}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cream)', marginBottom: 4 }}>{me.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(201,206,214,.45)', marginBottom: 14 }}>{me.email}</div>
              <span style={{ background: TIER_BG[tierName] ?? 'rgba(212,175,55,.1)', color: TIER_FG[tierName] ?? '#d4af37', fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                {tierName}
              </span>
            </div>

            {/* Account info */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
              {([
                { label: 'Member ID', value: memberId },
                { label: 'Email',     value: me.email },
                { label: 'Phone',     value: me.phone ?? '—' },
                { label: 'City',      value: me.city ?? 'Lagos' },
                { label: 'Tier',      value: tierName },
              ] as const).map((row, i, arr) => (
                <div key={row.label} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid rgba(201,206,214,.06)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.35)', letterSpacing: '.5px' }}>{row.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: row.value === '—' ? 'rgba(201,206,214,.25)' : 'var(--cream)' }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Interests */}
            {(me.preferences ?? []).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.35)', letterSpacing: '.5px', marginBottom: 10 }}>INTERESTS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(me.preferences ?? []).map(p => (
                    <span key={p} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(31,163,166,.08)', border: '1px solid rgba(31,163,166,.15)', color: 'rgba(31,163,166,.9)', fontSize: 11, fontWeight: 700 }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation shortcuts */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
              {[
                { label: 'Reservations',   path: '/bookings',      icon: '📅' },
                { label: 'My Wallet',      path: '/wallet',        icon: '💳' },
                { label: 'Rewards',        path: '/wallet',        icon: '⭐' },
                { label: 'Notifications',  path: '/notifications', icon: '🔔' },
                { label: 'Concierge',      path: '/chat',          icon: '💬' },
              ].map((row, i, arr) => (
                <Link key={row.label} href={row.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid rgba(201,206,214,.06)' : 'none', textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(201,206,214,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{row.icon}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{row.label}</div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="rgba(201,206,214,.25)" strokeWidth="2" strokeLinecap="round"/></svg>
                </Link>
              ))}
            </div>

            {/* Admin Panel — only visible to admin / concierge roles */}
            {(me.role === 'admin' || me.role === 'concierge') && (
              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.15)', borderRadius: 16, textDecoration: 'none', marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚙️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>Admin Panel</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(212,175,55,.45)', marginTop: 2 }}>Manage members, offers &amp; concierge</div>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="rgba(212,175,55,.4)" strokeWidth="2" strokeLinecap="round"/></svg>
              </Link>
            )}

            {/* Sign out */}
            <button
              onClick={handleLogout}
              disabled={logoutBusy}
              style={{ width: '100%', padding: '15px', borderRadius: 16, background: 'rgba(255,80,80,.06)', border: '1px solid rgba(255,80,80,.14)', color: 'rgba(255,110,110,.85)', fontSize: 14, fontWeight: 700, cursor: logoutBusy ? 'not-allowed' : 'pointer', opacity: logoutBusy ? 0.6 : 1, letterSpacing: '.3px', marginBottom: 8, transition: 'opacity .2s', fontFamily: 'Urbanist, sans-serif' }}
            >
              {logoutBusy ? 'Signing out…' : 'Sign Out'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.13)', marginTop: 20 }}>
              Nigerent Signature Lifestyle · Private Members
            </div>
          </>
        )}
      </div>
    </div>
  )
}
