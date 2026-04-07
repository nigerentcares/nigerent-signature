'use client'

import { useRouter } from 'next/navigation'

interface InviteLandingProps {
  email: string
  token: string
}

/**
 * Step 1 of the onboarding flow — faithful port of the HTML prototype.
 * Exact class names, orbs, grid overlay, and copy from nigerent_complete_app.html.
 */
export default function InviteLanding({ email, token }: InviteLandingProps) {
  const router = useRouter()

  function handleAccept() {
    // Pass the invite token and email to the onboarding flow via query params.
    // The onboarding page will read these to pre-fill the email field.
    router.push(`/onboarding?token=${token}&email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="ob-hero">
      {/* Background effects */}
      <div className="ob-orb1" />
      <div className="ob-orb2" />
      <div className="ob-grid" />

      {/* Logo area */}
      <div className="ob-logo-area">
        <div className="ob-logo-line">An exclusive invitation from</div>
        <div className="ob-logo">Nigerent</div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Private Member Invitation badge */}
        <div className="ob-invite-badge">
          <span style={{ color: 'var(--gold)', fontSize: 11 }}>✦</span>
          <span className="ob-invite-badge-lbl">Private Member Invitation</span>
        </div>

        {/* Hero headline */}
        <div className="ob-h1">
          Access a life<br />lived <em>better.</em>
        </div>

        {/* Subtitle */}
        <div className="ob-sub">
          You&apos;ve been personally invited to join Nigerent Signature
          Lifestyle — a private member experience curated for guests who
          expect more.
        </div>

        {/* Pre-verified email chip */}
        <div className="ob-invite-chip">
          <span className="ob-email-val">{email}</span>
          <span className="ob-verified">✓ Verified</span>
        </div>

        {/* Accept CTA */}
        <button className="ob-cta" onClick={handleAccept}>
          Accept Your Invitation
        </button>

        {/* Terms */}
        <div className="ob-terms">
          By accepting you agree to the Nigerent Membership Terms.
          Your invite expires in 14 days.
        </div>
      </div>
    </div>
  )
}
