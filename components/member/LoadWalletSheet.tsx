'use client'
/**
 * LoadWalletSheet
 *
 * Step 1 — Pick amount (quick pills + custom input)
 * Step 2 — Show bank transfer details + "I've transferred" confirm
 * Step 3 — Success / confirmation
 *
 * When Paystack is ready, Step 2 is replaced with the Paystack popup.
 */

import { useState } from 'react'

const QUICK_AMOUNTS = [10_000, 20_000, 50_000, 100_000, 200_000]
const MIN_AMOUNT    = 10_000
const MAX_AMOUNT    = 2_000_000

// ── Bank account details (update to real account) ────────────────────────────
const BANK_DETAILS = {
  accountName:   'Nigerent Lifestyle Ltd',
  accountNumber: '1308665551',
  bankName:      'Providus Bank',
  bankCode:      '101',
}

type Step = 'amount' | 'transfer' | 'success'

export default function LoadWalletSheet() {
  const [open, setOpen]     = useState(false)
  const [step, setStep]     = useState<Step>('amount')
  const [amount, setAmount] = useState(20_000)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')
  const [copied, setCopied] = useState(false)

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setAmount(Number(raw) || 0)
  }

  function handleOpen() {
    setStep('amount')
    setAmount(20_000)
    setErr('')
    setCopied(false)
    setOpen(true)
  }

  function handleClose() {
    if (busy) return
    setOpen(false)
    setStep('amount')
    setErr('')
  }

  async function handleConfirmTransfer() {
    setErr('')
    setBusy(true)
    try {
      const res  = await fetch('/api/wallet/load', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amountNGN: amount }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Something went wrong.'); return }
      setStep('success')
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function copyAccNum() {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isValid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT

  /* ── shared styles ── */
  const S = {
    label: {
      fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
      textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6,
    },
    detailRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 0',
      borderBottom: '1px solid rgba(0,0,0,.07)',
    },
    detailLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)' },
    detailValue: { fontSize: 13, fontWeight: 800, color: 'var(--dark)' },
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button className="wa wa-p" onClick={handleOpen} style={{ border: 'none', textAlign: 'left' }}>
        <div className="wa-ico wa-ico-w">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7-7 7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="wa-lbl">Load Wallet</div>
        <div className="wa-sub">Bank transfer · instant credit</div>
      </button>

      {/* ── Bottom sheet ── */}
      {open && (
        <div className="ov2" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
          <div className="sheet" style={{ maxHeight: '92dvh', overflowY: 'auto' }}>

            {/* ── STEP 1: Pick amount ── */}
            {step === 'amount' && (
              <>
                <div className="s-hdr">
                  <div className="s-ttl">Load Wallet</div>
                  <button className="s-cls" onClick={handleClose}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="ls-sub">
                  Transfer funds from your bank — your wallet updates within 1–2 business hours after we confirm receipt.
                </div>

                {/* Amount input */}
                <div className="ls-aw">
                  <div className="ls-al">Enter Amount</div>
                  <div className="ls-ad">
                    <span className="ls-cur">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amount > 0 ? amount.toLocaleString() : ''}
                      onChange={handleInput}
                      placeholder="0"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 42, fontWeight: 300,
                        color: 'var(--dark)', border: 'none',
                        background: 'transparent', textAlign: 'center',
                        width: '100%', outline: 'none',
                      }}
                    />
                  </div>
                  {!isValid && amount > 0 && (
                    <div style={{ fontSize: 10, color: '#d44', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
                      {amount < MIN_AMOUNT
                        ? `Minimum ₦${MIN_AMOUNT.toLocaleString()}`
                        : `Maximum ₦${MAX_AMOUNT.toLocaleString()}`}
                    </div>
                  )}
                </div>

                {/* Quick pills */}
                <div className="ls-quick" style={{ flexWrap: 'wrap' }}>
                  {QUICK_AMOUNTS.map(v => (
                    <button
                      key={v}
                      className={`lsq ${amount === v ? 'sel' : ''}`}
                      onClick={() => setAmount(v)}
                    >
                      ₦{v >= 1_000_000 ? `${v / 1_000_000}m` : `${v / 1000}k`}
                    </button>
                  ))}
                </div>

                {/* Transfer method info */}
                <div style={{ background: '#f7f5f2', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(31,163,166,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      🏦
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)' }}>Bank Transfer</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        Transfer to our account · We confirm within 1–2 business hours
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="ls-btn"
                  disabled={!isValid}
                  onClick={() => setStep('transfer')}
                  style={{ opacity: isValid ? 1 : 0.45 }}
                >
                  Continue — ₦{amount.toLocaleString()}
                </button>
              </>
            )}

            {/* ── STEP 2: Transfer instructions ── */}
            {step === 'transfer' && (
              <>
                <div className="s-hdr">
                  <button
                    onClick={() => setStep('amount')}
                    style={{ background: 'rgba(0,0,0,.05)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <div className="s-ttl">Transfer Details</div>
                  <button className="s-cls" onClick={handleClose}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Amount highlight */}
                <div style={{ background: 'linear-gradient(135deg, rgba(31,163,166,.08) 0%, rgba(31,163,166,.04) 100%)', border: '1px solid rgba(31,163,166,.15)', borderRadius: 16, padding: '16px 18px', textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 4 }}>Transfer exactly</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: 'var(--dark)' }}>
                    ₦{amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    The exact amount must match for instant approval
                  </div>
                </div>

                {/* Bank details card */}
                <div style={{ background: '#f7f5f2', borderRadius: 16, padding: '4px 16px 0', marginBottom: 16 }}>
                  <div style={S.detailRow}>
                    <div style={S.detailLabel}>Account Name</div>
                    <div style={S.detailValue}>{BANK_DETAILS.accountName}</div>
                  </div>

                  <div style={{ ...S.detailRow }}>
                    <div style={S.detailLabel}>Account Number</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...S.detailValue, fontFamily: 'monospace', fontSize: 17, letterSpacing: '1px' }}>
                        {BANK_DETAILS.accountNumber}
                      </div>
                      <button
                        onClick={copyAccNum}
                        style={{ padding: '4px 10px', borderRadius: 7, background: copied ? 'rgba(30,168,106,.12)' : 'rgba(31,163,166,.1)', border: 'none', color: copied ? '#1ea86a' : 'var(--teal)', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'all .2s' }}
                      >
                        {copied ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ ...S.detailRow, borderBottom: 'none' }}>
                    <div style={S.detailLabel}>Bank</div>
                    <div style={S.detailValue}>{BANK_DETAILS.bankName}</div>
                  </div>
                </div>

                {/* Narration tip */}
                <div style={{ display: 'flex', gap: 10, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#b8960f', marginBottom: 2 }}>Add narration</div>
                    <div style={{ fontSize: 11, color: '#a07a0a', lineHeight: 1.5 }}>
                      Use your registered email <strong>as the transfer narration</strong> so we can match your payment instantly.
                    </div>
                  </div>
                </div>

                {err && (
                  <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.06)', border: '1px solid rgba(255,80,80,.18)', borderRadius: 10, fontSize: 12, color: '#c0392b', marginBottom: 14 }}>
                    {err}
                  </div>
                )}

                <button
                  className="ls-btn"
                  disabled={busy}
                  onClick={handleConfirmTransfer}
                  style={{ opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? 'Submitting…' : `I've transferred ₦${amount.toLocaleString()}`}
                </button>

                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
                  Tapping this records your intent. Your balance updates once we verify the transfer.
                </div>
              </>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '32px 22px 24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(30,168,106,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                  ✓
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>
                  Transfer recorded!
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 28px' }}>
                  We&apos;ve noted your ₦{amount.toLocaleString()} transfer.
                  Your wallet will be credited within <strong>1–2 business hours</strong> once we confirm receipt.
                </div>

                <div style={{ background: '#f7f5f2', borderRadius: 14, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>What happens next</div>
                  {[
                    'Your transfer lands in our account',
                    'Our team matches it to your wallet',
                    'You get an in-app notification when credited',
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(31,163,166,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--dark)', paddingTop: 2, lineHeight: 1.5 }}>{s}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleClose}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--dark)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
