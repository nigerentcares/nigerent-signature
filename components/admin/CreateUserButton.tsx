'use client'
/**
 * CreateUserButton — opens a modal to create a new member or concierge account.
 */

import { useState, FormEvent } from 'react'

type Role = 'member' | 'concierge'

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano']

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,206,214,.15)',
  color: '#fff', fontFamily: 'Urbanist, sans-serif', outline: 'none', boxSizing: 'border-box',
}

export default function CreateUserButton() {
  const [open,      setOpen]      = useState(false)
  const [role,      setRole]      = useState<Role>('member')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [city,      setCity]      = useState('Lagos')
  const [busy,      setBusy]      = useState(false)
  const [err,       setErr]       = useState('')
  const [done,      setDone]      = useState(false)

  function reset() {
    setFirstName(''); setLastName(''); setEmail('')
    setPassword(''); setPhone(''); setCity('Lagos')
    setRole('member'); setErr(''); setDone(false)
  }

  function close() { setOpen(false); reset() }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErr('First name, last name, email, and password are required.')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    setErr(''); setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role, phone, city }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to create user.'); return }
      setDone(true)
      setTimeout(() => { close(); window.location.reload() }, 1400)
    } catch { setErr('Network error.') }
    finally { setBusy(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="adm-btn-primary"
        style={{ gap: 6 }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create User
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div style={{
            background: '#0f1117', border: '1px solid rgba(201,206,214,.1)',
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
            fontFamily: 'Urbanist, sans-serif',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 2 }}>Admin</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Create New User</div>
              </div>
              <button
                onClick={close}
                style={{ background: 'rgba(201,206,214,.08)', border: 'none', color: 'rgba(201,206,214,.5)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {done ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1ea86a' }}>User created successfully</div>
                <div style={{ fontSize: 12, color: 'rgba(201,206,214,.45)', marginTop: 6 }}>Refreshing the member list…</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Role toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {(['member', 'concierge'] as Role[]).map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        fontFamily: 'Urbanist,sans-serif', cursor: 'pointer', textTransform: 'capitalize',
                        border: role === r ? '1px solid #1fa3a6' : '1px solid rgba(201,206,214,.12)',
                        background: role === r ? 'rgba(31,163,166,.12)' : 'rgba(255,255,255,.03)',
                        color: role === r ? '#1fa3a6' : 'rgba(201,206,214,.5)',
                      }}
                    >
                      {r === 'member' ? '👤 Member' : '🎩 Concierge'}
                    </button>
                  ))}
                </div>

                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>First Name *</label>
                    <input
                      type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Emeka" style={inp} required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>Last Name *</label>
                    <input
                      type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Okonkwo" style={inp} required
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>Email Address *</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="emeka@example.com" style={inp} required
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>Password *</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" style={inp} required
                  />
                </div>

                {/* Phone + City */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>Phone</label>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000" style={inp}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>City</label>
                    <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Role note */}
                <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(31,163,166,.05)', border: '1px solid rgba(31,163,166,.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'rgba(201,206,214,.5)', lineHeight: 1.6 }}>
                    {role === 'member'
                      ? '👤 A Signature-tier membership will be created automatically. 500 welcome points will be awarded.'
                      : '🎩 The concierge will be able to log in to the concierge portal and manage member requests.'}
                  </div>
                </div>

                {err && (
                  <div style={{ padding: '8px 12px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 8, fontSize: 11, color: 'rgba(255,110,110,.9)', marginBottom: 14 }}>
                    {err}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button" onClick={close}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.1)', color: 'rgba(201,206,214,.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist,sans-serif' }}
                  >Cancel</button>
                  <button
                    type="submit" disabled={busy}
                    style={{ flex: 2, padding: '10px', borderRadius: 8, background: '#1fa3a6', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist,sans-serif', opacity: busy ? 0.7 : 1 }}
                  >
                    {busy ? 'Creating…' : `Create ${role === 'member' ? 'Member' : 'Concierge'}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
