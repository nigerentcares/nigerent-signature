'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields:      'Please enter your email and password.',
  invalid_credentials: 'Incorrect email or password. Please try again.',
  invite_used:         'This invite link has already been used.',
  invite_expired:      'This invite link has expired. Please contact us.',
  session_expired:     'Your session has expired. Please sign in again.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError     = searchParams.get('error') ?? searchParams.get('reason') ?? ''

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(ERROR_MESSAGES[urlError] ?? '')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(ERROR_MESSAGES[data.error] ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Hard redirect — ensures browser picks up all Set-Cookie headers
      window.location.href = data.redirect || '/home'
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="ob-form-wrap" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <div className="ob-logo-line">Welcome back to</div>
        <div className="ob-logo">Nigerent Signature Lifestyle</div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background:    'rgba(212,175,55,.06)',
          border:        '1px solid rgba(212,175,55,.18)',
          borderRadius:  12,
          padding:       '12px 16px',
          marginBottom:  24,
          fontSize:      12,
          fontWeight:    600,
          color:         'rgba(212,175,55,.8)',
          lineHeight:    1.5,
        }}>
          {error}
        </div>
      )}

      <div className="ob-step-label">Member Access</div>
      <div className="ob-step-title" style={{ marginBottom: 32 }}>
        Sign in to your<br />account
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ob-field">
          <div className="ob-field-label">Email address</div>
          <input
            className="ob-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="ob-field">
          <div className="ob-field-label">Password</div>
          <input
            className="ob-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="ob-cta"
          style={{ marginTop: 8, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Footer */}
      <div className="ob-terms" style={{ marginTop: 24 }}>
        Don&apos;t have an account?{' '}
        <span style={{ color: 'var(--teal)', fontWeight: 700 }}>
          You need a personal invitation to join.
        </span>
      </div>

      <div style={{
        marginTop:      32,
        paddingTop:     24,
        borderTop:      '1px solid rgba(201,206,214,.08)',
        textAlign:      'center',
        fontSize:       9,
        fontWeight:     700,
        letterSpacing:  '2px',
        textTransform:  'uppercase' as const,
        color:          'rgba(201,206,214,.2)',
      }}>
        Nigerent Signature Lifestyle · Private Members
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="ob-form-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(201,206,214,.4)', fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
