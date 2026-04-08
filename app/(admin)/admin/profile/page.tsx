'use client'
/**
 * /admin/profile — Admin Profile & Account
 * Shows admin account info, role, and a prominent sign-out button.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

interface AdminMe {
  id:    string
  name:  string
  email: string
  phone?: string | null
  city?:  string
  role?:  string
  membership?: {
    memberNumber?: string
    tier?: { name?: string }
  }
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [me, setMe]             = useState<AdminMe | null>(null)
  const [logoutBusy, setLogoutBusy] = useState(false)

  // Password change
  const [pwOpen, setPwOpen]       = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy, setPwBusy]       = useState(false)
  const [pwErr, setPwErr]         = useState('')
  const [pwOk, setPwOk]           = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.replace('/login?reason=session_expired'); return }
        setMe(d as AdminMe)
      })
      .catch(() => router.replace('/login?reason=session_expired'))
  }, [router])

  async function handleLogout() {
    setLogoutBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwErr('')
    if (newPw.length < 8) { setPwErr('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwErr('Passwords do not match.'); return }
    setPwBusy(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) { setPwErr(data.error ?? 'Could not change password.'); return }
      setPwOk(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwOpen(false); setPwOk(false) }, 1500)
    } catch {
      setPwErr('Network error.')
    } finally {
      setPwBusy(false)
    }
  }

  const initial = (me?.name ?? '?').charAt(0).toUpperCase()
  const roleBadge = me?.role === 'admin' ? 'Administrator' : me?.role === 'concierge' ? 'Concierge' : 'Staff'

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(201,206,214,.12)', borderRadius: 12,
    padding: '11px 14px', color: 'var(--cream)', fontSize: 13,
    fontFamily: 'Urbanist, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <AdminShell activeNav="profile">
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 60px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 4 }}>Account</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cream)' }}>Admin Profile</div>
        </div>

        {/* Loading skeleton */}
        {!me && (
          <>
            <div className="sk" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px' }} />
            <div className="sk" style={{ width: 160, height: 18, borderRadius: 8, margin: '0 auto 8px' }} />
            <div className="sk" style={{ width: 200, height: 12, borderRadius: 6, margin: '0 auto 30px' }} />
            {[1,2,3].map(i => <div key={i} className="sk" style={{ width: '100%', height: 56, borderRadius: 14, marginBottom: 10 }} />)}
          </>
        )}

        {me && (
          <>
            {/* Avatar + name card */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, padding: '28px 20px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#d4af37 0%,#b8960f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                {initial}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cream)', marginBottom: 4 }}>{me.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(201,206,214,.45)', marginBottom: 12 }}>{me.email}</div>
              <span style={{ background: 'rgba(212,175,55,.1)', color: '#d4af37', fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,.2)' }}>
                {roleBadge}
              </span>
            </div>

            {/* Account details */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
              {([
                { label: 'Name',  value: me.name },
                { label: 'Email', value: me.email },
                { label: 'Phone', value: me.phone ?? '—' },
                { label: 'City',  value: me.city ?? '—' },
                { label: 'Role',  value: roleBadge },
              ] as const).map((row, i, arr) => (
                <div key={row.label} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid rgba(201,206,214,.06)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.35)', letterSpacing: '.5px' }}>{row.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: row.value === '—' ? 'rgba(201,206,214,.25)' : 'var(--cream)' }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Change password */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,206,214,.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
              <button
                onClick={() => { setPwOpen(o => !o); setPwErr(''); setPwOk(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(201,206,214,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>&#128272;</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>Change Password</div>
                  {!pwOpen && <div style={{ fontSize: 10, color: 'rgba(201,206,214,.3)', marginTop: 1 }}>Update your login password</div>}
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ transform: pwOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="M9 5l7 7-7 7" stroke="rgba(201,206,214,.25)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {pwOpen && (
                <form onSubmit={handlePasswordChange} style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(201,206,214,.06)' }}>
                  {[
                    { label: 'Current Password', value: currentPw, setter: setCurrentPw },
                    { label: 'New Password',      value: newPw,     setter: setNewPw },
                    { label: 'Confirm Password',  value: confirmPw, setter: setConfirmPw },
                  ].map(({ label, value, setter }) => (
                    <div key={label} style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(201,206,214,.35)', marginBottom: 5, display: 'block' }}>{label}</label>
                      <input type="password" value={value} onChange={e => setter(e.target.value)} required minLength={label === 'Current Password' ? 1 : 8} style={inputStyle} />
                    </div>
                  ))}
                  {pwErr && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,110,110,.9)' }}>{pwErr}</div>}
                  {pwOk && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(30,168,106,.08)', border: '1px solid rgba(30,168,106,.2)', borderRadius: 10, fontSize: 12, color: '#1ea86a' }}>&#10003; Password updated!</div>}
                  <button type="submit" disabled={pwBusy || pwOk} style={{ marginTop: 14, width: '100%', padding: '12px', borderRadius: 12, background: pwOk ? '#1ea86a' : 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: pwBusy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', opacity: pwBusy ? 0.7 : 1 }}>
                    {pwBusy ? 'Updating...' : pwOk ? '&#10003; Done' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleLogout}
              disabled={logoutBusy}
              style={{
                width: '100%', padding: '16px', borderRadius: 16,
                background: 'rgba(255,80,80,.06)', border: '1px solid rgba(255,80,80,.14)',
                color: 'rgba(255,110,110,.85)', fontSize: 14, fontWeight: 700,
                cursor: logoutBusy ? 'not-allowed' : 'pointer',
                opacity: logoutBusy ? 0.6 : 1, letterSpacing: '.3px',
                transition: 'opacity .2s', fontFamily: 'Urbanist, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {logoutBusy ? 'Signing out...' : 'Sign Out'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.13)', marginTop: 24 }}>
              Nigerent Signature Lifestyle &middot; Admin Panel
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}
