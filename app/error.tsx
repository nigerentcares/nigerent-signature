'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="nf-wrap">
      <div className="nf-orb nf-orb1" />
      <div className="nf-orb nf-orb2" />
      <div className="nf-inner">
        <div className="nf-mark">N</div>
        <div className="nf-code" style={{ fontSize: 72 }}>Oops</div>
        <div className="nf-title">Something went wrong</div>
        <div className="nf-sub">
          We encountered an unexpected error.<br />
          Our team has been notified.
        </div>
        <div className="nf-actions">
          <button
            onClick={reset}
            className="nf-btn-primary"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            Try Again
          </button>
          <Link href="/home" className="nf-btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
