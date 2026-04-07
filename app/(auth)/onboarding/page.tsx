'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

// ─────────────────────────────
// Types
// ─────────────────────────────

type Step = 2 | 3 | 4

interface AccountForm {
  firstName: string
  lastName: string
  phone: string
  password: string
}

interface PreferencesForm {
  interests: string[]
  city: 'Lagos' | 'Abuja'
}

interface WelcomeData {
  name: string
  memberNumber: string
  tier: string
  points: number
}

// ─────────────────────────────
// Preference options (from HTML prototype)
// ─────────────────────────────

const PREFERENCES = [
  { key: 'dining',      emoji: '🍽️', label: 'Dining',      sub: 'Restaurant bookings & culinary experiences' },
  { key: 'wellness',    emoji: '🧖', label: 'Wellness',     sub: 'Spas, fitness & health experiences' },
  { key: 'nightlife',   emoji: '🥂', label: 'Nightlife',    sub: 'Premium lounges & rooftop bars' },
  { key: 'experiences', emoji: '🌇', label: 'Experiences',  sub: 'Events, culture & local adventures' },
  { key: 'transport',   emoji: '🚗', label: 'Transport',    sub: 'Premium rides & airport transfers' },
  { key: 'shopping',    emoji: '🛍️', label: 'Shopping',     sub: 'Curated luxury fashion & lifestyle' },
]

// ─────────────────────────────
// Password strength helper
// ─────────────────────────────

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0
  if (pw.length < 6) return 1
  if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return 2
  return 3
}

function PasswordBars({ strength }: { strength: 0 | 1 | 2 | 3 }) {
  const colors: Record<number, string> = {
    0: 'rgba(201,206,214,.1)',
    1: 'rgba(255,80,80,.6)',
    2: 'var(--gold)',
    3: 'var(--green)',
  }
  return (
    <div className="ob-pw-strength">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="pw-bar"
          style={{ background: i <= strength ? colors[strength] : 'rgba(201,206,214,.1)' }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────
// Back button arrow SVG
// ─────────────────────────────

function BackArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M15 19l-7-7 7-7" stroke="rgba(201,206,214,.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────
// Progress bar
// ─────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  // Step 2 = seg 1 done, step 3 = segs 1+2 done, step 4 = all done
  const doneCount = step - 2 // 0, 1, 2 for steps 2, 3, 4
  const activeIdx = doneCount  // which segment is currently active

  return (
    <div className="ob-progress">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`ob-prog-seg ${i < doneCount ? 'done' : i === activeIdx ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────
// Step 2 — Create Account
// ─────────────────────────────

function StepCreateAccount({
  email,
  form,
  onChange,
  onNext,
  onBack,
  error,
  loading,
}: {
  email: string
  form: AccountForm
  onChange: (f: Partial<AccountForm>) => void
  onNext: () => void
  onBack: () => void
  error: string
  loading: boolean
}) {
  const pwStrength = getPasswordStrength(form.password)

  return (
    <div className="ob-form-wrap">
      <div className="ob-back" onClick={onBack}>
        <BackArrow />
        <span className="ob-back-txt">Back</span>
      </div>

      <div className="ob-step-label">Step 1 of 3</div>
      <div className="ob-step-title">Create your<br />account</div>

      {/* Email — pre-verified, read-only */}
      <div className="ob-field">
        <div className="ob-field-label">Email address</div>
        <div className="ob-email-field">
          <span className="ob-email-lock">🔒</span>
          <span className="ob-email-txt">{email}</span>
          <span className="ob-email-tag">Pre-verified</span>
        </div>
      </div>

      {/* First + Last name */}
      <div className="ob-row">
        <div className="ob-field">
          <div className="ob-field-label">First name</div>
          <input
            className="ob-input"
            type="text"
            placeholder="Adaeze"
            value={form.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            autoComplete="given-name"
          />
        </div>
        <div className="ob-field">
          <div className="ob-field-label">Last name</div>
          <input
            className="ob-input"
            type="text"
            placeholder="Okonkwo"
            value={form.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="ob-field">
        <div className="ob-field-label">Phone number</div>
        <div className="ob-input-pre">
          <span className="ob-pre-badge">🇳🇬 +234</span>
          <input
            className="ob-input no-border"
            type="tel"
            placeholder="080 0000 0000"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Password */}
      <div className="ob-field">
        <div className="ob-field-label">Create password</div>
        <input
          className="ob-input"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => onChange({ password: e.target.value })}
          autoComplete="new-password"
        />
        <PasswordBars strength={pwStrength} />
      </div>

      {error && <div className="ob-error">{error}</div>}

      <button
        className="ob-cta"
        style={{ marginTop: 8 }}
        onClick={onNext}
        disabled={loading}
      >
        {loading ? 'Creating account…' : 'Continue'}
      </button>
    </div>
  )
}

// ─────────────────────────────
// Step 3 — Preferences
// ─────────────────────────────

function StepPreferences({
  form,
  onChange,
  onNext,
  onBack,
  error,
  loading,
}: {
  form: PreferencesForm
  onChange: (f: Partial<PreferencesForm>) => void
  onNext: () => void
  onBack: () => void
  error: string
  loading: boolean
}) {
  function toggleInterest(key: string) {
    const next = form.interests.includes(key)
      ? form.interests.filter((k) => k !== key)
      : [...form.interests, key]
    onChange({ interests: next })
  }

  return (
    <div className="ob-prefs-scroll">
      <div className="ob-back" onClick={onBack}>
        <BackArrow />
        <span className="ob-back-txt">Back</span>
      </div>

      <div className="ob-step-label">Step 2 of 3</div>
      <div className="ob-step-title">Your lifestyle<br />preferences</div>

      {/* Interests grid */}
      <div
        style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'rgba(201,206,214,.4)',
          marginBottom: 12,
        }}
      >
        Interests (select all that apply)
      </div>

      <div className="ob-prefs-grid">
        {PREFERENCES.map((pref) => (
          <div
            key={pref.key}
            className={`ob-pref ${form.interests.includes(pref.key) ? 'sel' : ''}`}
            onClick={() => toggleInterest(pref.key)}
          >
            <div className="ob-pref-ico">{pref.emoji}</div>
            <div className="ob-pref-lbl">{pref.label}</div>
            <div className="ob-pref-sub">{pref.sub}</div>
          </div>
        ))}
      </div>

      {/* City selection */}
      <div
        style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'rgba(201,206,214,.4)',
          marginBottom: 12,
        }}
      >
        Primary City
      </div>

      <div className="ob-city-row">
        {(['Lagos', 'Abuja'] as const).map((city) => (
          <div
            key={city}
            className={`ob-city ${form.city === city ? 'sel' : ''}`}
            onClick={() => onChange({ city })}
          >
            <div className="ob-city-ico">{city === 'Lagos' ? '🏙️' : '🏛️'}</div>
            <div className="ob-city-lbl">{city}</div>
            <div className="ob-city-sub">
              {city === 'Lagos'
                ? 'Victoria Island, Lekki, Ikoyi & more'
                : 'Maitama, Wuse, Asokoro & more'}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="ob-error">{error}</div>}

      <button
        className="ob-cta"
        style={{ marginTop: 8 }}
        onClick={onNext}
        disabled={loading}
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}

// ─────────────────────────────
// Step 4 — Welcome
// ─────────────────────────────

function StepWelcome({
  data,
  onFinish,
}: {
  data: WelcomeData
  onFinish: () => void
}) {
  // Format member number as 4-digit padded number
  const memberNum = data.memberNumber.slice(-4).toUpperCase()

  return (
    <div className="ob-welcome">
      {/* Welcome card */}
      <div className="ob-welcome-card">
        <div className="wc-o1" />
        <div className="wc-o2" />
        <div className="wc-lines" />
        <div className="wc-in">
          <div className="wc-confetti">🎉</div>
          <div className="wc-tier-badge">
            <span style={{ color: 'var(--gold)', fontSize: 11 }}>✦</span>
            <span className="wc-tier-lbl">{data.tier} Member</span>
          </div>
          <div className="wc-greeting">Welcome to the club,</div>
          <div className="wc-name">{data.name}</div>
          <div className="wc-divider" />
          <div className="wc-stats">
            <div className="wcs">
              <div className="wcs-lbl">Points</div>
              <div className="wcs-val">{data.points.toLocaleString()}</div>
              <div className="wcs-sub">Welcome gift</div>
            </div>
            <div className="wcs">
              <div className="wcs-lbl">Tier</div>
              <div
                className="wcs-val"
                style={{ fontSize: 14, paddingTop: 4, fontWeight: 800, fontFamily: 'Urbanist' }}
              >
                {data.tier}
              </div>
              <div className="wcs-sub">Active now</div>
            </div>
            <div className="wcs">
              <div className="wcs-lbl">Member No.</div>
              <div
                className="wcs-val"
                style={{ fontSize: 14, paddingTop: 4, fontWeight: 700, fontFamily: 'Urbanist', letterSpacing: 1 }}
              >
                {memberNum}
              </div>
              <div className="wcs-sub">NSL ID</div>
            </div>
          </div>
        </div>
      </div>

      {/* Points notice */}
      <div className="ob-pts-notice">
        <div className="ob-pts-ico">✦</div>
        <div className="ob-pts-txt">
          <div className="ob-pts-title">{data.points} welcome points credited</div>
          <div className="ob-pts-sub">Use them on your first partner offer redemption</div>
        </div>
      </div>

      {/* Enter app CTA */}
      <button className="ob-cta gold-btn" onClick={onFinish}>
        Enter Signature Lifestyle ✦
      </button>
    </div>
  )
}

// ─────────────────────────────
// Main Onboarding Component
// ─────────────────────────────

function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token') ?? ''
  const email = decodeURIComponent(searchParams.get('email') ?? '')

  const [step, setStep] = useState<Step>(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Form state
  const [accountForm, setAccountForm] = useState<AccountForm>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
  })
  const [prefsForm, setPrefsForm] = useState<PreferencesForm>({
    interests: [],
    city: 'Lagos',
  })
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null)

  // ── Step 2 validation + API call ──
  async function handleStep2Next() {
    setError('')
    const { firstName, lastName, password, phone } = accountForm

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    // Move to step 3 (preferences collected first, then we call signup)
    setStep(3)
  }

  // ── Step 3 validation + signup API call ──
  async function handleStep3Next() {
    setError('')
    if (prefsForm.interests.length === 0) {
      setError('Please select at least one interest.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          firstName: accountForm.firstName,
          lastName: accountForm.lastName,
          phone: accountForm.phone,
          password: accountForm.password,
          preferences: prefsForm.interests,
          city: prefsForm.city,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setWelcomeData({
        name: `${accountForm.firstName} ${accountForm.lastName}`,
        memberNumber: data.memberNumber,
        tier: data.tier,
        points: data.points,
      })
      setStep(4)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    if (step === 2) router.back()
    else if (step === 3) { setError(''); setStep(2) }
  }

  function handleFinish() {
    router.push('/home')
  }

  // Redirect if no token/email
  if (!token || !email) {
    return (
      <div className="ob-form-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(201,206,214,.5)', fontSize: 14, textAlign: 'center' }}>
          Invalid invite link. Please check your email for the correct link.
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Progress bar — shown on steps 2 and 3 */}
      {step < 4 && <ProgressBar step={step} />}

      {step === 2 && (
        <StepCreateAccount
          email={email}
          form={accountForm}
          onChange={(f) => setAccountForm((prev) => ({ ...prev, ...f }))}
          onNext={handleStep2Next}
          onBack={handleBack}
          error={error}
          loading={false}
        />
      )}

      {step === 3 && (
        <StepPreferences
          form={prefsForm}
          onChange={(f) => setPrefsForm((prev) => ({ ...prev, ...f }))}
          onNext={handleStep3Next}
          onBack={handleBack}
          error={error}
          loading={loading}
        />
      )}

      {step === 4 && welcomeData && (
        <StepWelcome data={welcomeData} onFinish={handleFinish} />
      )}
    </>
  )
}

// ─────────────────────────────
// Page export (wrapped in Suspense for useSearchParams)
// ─────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="ob-form-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(201,206,214,.4)', fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <OnboardingFlow />
    </Suspense>
  )
}
