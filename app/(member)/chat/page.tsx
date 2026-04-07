'use client'
/**
 * /chat — Concierge Hub
 *
 * Three-view layout: Chat | New Request | My Bookings
 * Chat     — live thread, sends to /api/chat/send
 * Request  — structured form, posts to /api/chat/request
 * Bookings — member's stays + dining + concierge requests (fetches /api/bookings)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Shared types ─────────────────────────────────────────────────────────────

type View    = 'chat' | 'req' | 'book'
type BookTab = 'dining' | 'stays' | 'concierge'

interface Message {
  id:         string
  senderRole: 'MEMBER' | 'CONCIERGE' | 'SYSTEM'
  body:       string
  createdAt:  string
}

interface ApiBooking {
  id: string; property: string; checkIn: string; checkOut: string
  amount: number; status: string; createdAt: string
}
interface ApiDining {
  id: string; restaurantName: string; preferredDate: string
  preferredTime: string; partySize: number; occasion: string | null
  status: string; createdAt: string
}
interface ApiConcierge {
  id: string; category: string; description: string
  status: string; priority: string; createdAt: string
}

// ─── Static data ─────────────────────────────────────────────────────────────

const REQUEST_CATS = [
  { key: 'dining',    emoji: '🍽️', label: 'Dining',         sub: 'Restaurant bookings and dining experiences' },
  { key: 'transport', emoji: '🚗', label: 'Transport',       sub: 'Private cars, airport transfers, rides' },
  { key: 'events',    emoji: '🎟️', label: 'Events',          sub: 'Tickets, access, and event planning' },
  { key: 'gifts',     emoji: '🎁', label: 'Gifts',           sub: 'Curated gifts, surprises, and special touches' },
  { key: 'recs',      emoji: '✦',  label: 'Recommendations', sub: 'Curated places, experiences, and advice' },
  { key: 'stay',      emoji: '🏠', label: 'Stay Support',    sub: 'Help with your current Nigerent stay' },
  { key: 'errands',   emoji: '📦', label: 'Errands',         sub: 'Personal errands and task handling' },
  { key: 'custom',    emoji: '💬', label: 'Custom',          sub: 'Anything else on your mind — just ask' },
]

const QUICK_REPLIES = ['Any updates?', 'Confirm booking', 'Escalate', 'Thank you']

// ─── Status / badge helpers ───────────────────────────────────────────────────

const DINING_LABEL: Record<string, string> = {
  RECEIVED: 'Received', IN_PROGRESS: 'In Progress', CONFIRMED: 'Confirmed',
  DECLINED: 'Declined', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const CONC_LABEL: Record<string, string> = {
  RECEIVED: 'Open', IN_PROGRESS: 'In Progress', AWAITING_UPDATE: 'Awaiting',
  COMPLETED: 'Resolved', CANCELLED: 'Cancelled',
}

type Tone = 'ok' | 'warn' | 'err' | 'mute' | 'teal'
const DINING_TONE: Record<string, Tone> = {
  RECEIVED: 'warn', IN_PROGRESS: 'warn', CONFIRMED: 'ok',
  DECLINED: 'err',  COMPLETED: 'mute',   CANCELLED: 'err',
}
const CONC_TONE: Record<string, Tone> = {
  RECEIVED: 'warn', IN_PROGRESS: 'warn', AWAITING_UPDATE: 'teal',
  COMPLETED: 'ok',  CANCELLED: 'err',
}
const BOOKING_TONE: Record<string, Tone> = {
  confirmed: 'ok', active: 'ok', checked_in: 'teal',
  completed: 'mute', cancelled: 'err',
}

const TONE_S: Record<Tone, React.CSSProperties> = {
  ok:   { background: 'rgba(30,168,106,.12)',  color: '#1ea86a',  border: '1px solid rgba(30,168,106,.2)' },
  warn: { background: 'rgba(212,175,55,.12)',  color: '#d4af37',  border: '1px solid rgba(212,175,55,.2)' },
  err:  { background: 'rgba(255,80,80,.12)',   color: '#ff7070',  border: '1px solid rgba(255,80,80,.2)' },
  mute: { background: 'rgba(201,206,214,.07)', color: 'rgba(201,206,214,.4)', border: '1px solid rgba(201,206,214,.1)' },
  teal: { background: 'rgba(31,163,166,.12)',  color: '#1fa3a6',  border: '1px solid rgba(31,163,166,.2)' },
}

const PRIORITY_S: Record<string, React.CSSProperties> = {
  URGENT: { color: '#ff7070' }, HIGH: { color: '#d4af37' }, STANDARD: { color: 'rgba(201,206,214,.35)' },
}

const CAT_EMOJI: Record<string, string> = {
  dining: '🍽️', transport: '🚗', wellness: '🧖', accommodation: '🏨',
  shopping: '🛍️', entertainment: '🎬', travel: '✈️', healthcare: '🏥', general: '💬',
}
function catEmoji(c: string) {
  const k = c.toLowerCase()
  return Object.entries(CAT_EMOJI).find(([key]) => k.includes(key))?.[1] ?? '💬'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtNGN(k: number) {
  const n = Math.floor(k / 100)
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000)     return `₦${Math.round(n / 1_000)}k`
  return `₦${n.toLocaleString()}`
}
function nightCount(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}
function isUpcoming(iso: string) {
  return new Date(iso).getTime() > Date.now()
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', ...TONE_S[tone] }}>
      {label}
    </span>
  )
}

// ─── Booking sub-cards ────────────────────────────────────────────────────────

function StayCard({ s }: { s: ApiBooking }) {
  const nights = nightCount(s.checkIn, s.checkOut)
  const tone   = BOOKING_TONE[s.status.toLowerCase()] ?? 'mute'
  const active = isUpcoming(s.checkIn) && s.status.toLowerCase() !== 'cancelled'

  return (
    <div style={{
      background: active
        ? 'linear-gradient(135deg, rgba(212,175,55,.1) 0%, rgba(255,255,255,.06) 100%)'
        : 'rgba(255,255,255,.05)',
      border: `1px solid ${active ? 'rgba(212,175,55,.25)' : 'rgba(201,206,214,.14)'}`,
      borderLeft: active ? '3px solid rgba(212,175,55,.6)' : '3px solid rgba(201,206,214,.15)',
      borderRadius: 16,
      padding: '16px 16px 16px 14px',
      marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,175,55,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{s.property}</div>
            <div style={{ fontSize: 12, color: 'rgba(201,206,214,.6)', marginTop: 3 }}>
              {nights} night{nights !== 1 ? 's' : ''} · <span style={{ color: 'rgba(212,175,55,.9)', fontWeight: 700 }}>{fmtNGN(s.amount)}</span>
            </div>
          </div>
        </div>
        <Badge label={s.status.replace(/_/g, ' ')} tone={tone} />
      </div>

      {/* Date bar */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,.25)', borderRadius: 12, overflow: 'hidden', marginBottom: active ? 12 : 0 }}>
        <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid rgba(201,206,214,.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Check-in</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)' }}>{fmtShort(s.checkIn)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid rgba(201,206,214,.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Check-out</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)' }}>{fmtShort(s.checkOut)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Nights</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)' }}>{nights}</div>
        </div>
      </div>

      {active && (
        <Link href="/chat" onClick={e => e.stopPropagation()} style={{ display: 'block', padding: '11px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(31,163,166,.15)', border: '1px solid rgba(31,163,166,.3)', color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          💬 Message Concierge about this stay
        </Link>
      )}
    </div>
  )
}

function DiningCard({ d }: { d: ApiDining }) {
  const tone   = DINING_TONE[d.status] ?? 'mute'
  const label  = DINING_LABEL[d.status] ?? d.status
  const active = !['COMPLETED','CANCELLED','DECLINED'].includes(d.status)

  return (
    <div style={{
      background: active
        ? 'linear-gradient(135deg, rgba(212,135,15,.1) 0%, rgba(255,255,255,.06) 100%)'
        : 'rgba(255,255,255,.05)',
      border: `1px solid ${active ? 'rgba(212,135,15,.25)' : 'rgba(201,206,214,.14)'}`,
      borderLeft: active ? '3px solid rgba(212,135,15,.7)' : '3px solid rgba(201,206,214,.15)',
      borderRadius: 16,
      padding: '16px 16px 16px 14px',
      marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,135,15,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🍽️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{d.restaurantName}</div>
            {d.occasion && (
              <div style={{ fontSize: 11, color: 'rgba(212,135,15,.8)', fontWeight: 700, marginTop: 2 }}>{d.occasion}</div>
            )}
          </div>
        </div>
        <Badge label={label} tone={tone} />
      </div>

      {/* Details row */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,.25)', borderRadius: 12, overflow: 'hidden', marginBottom: active ? 12 : 0 }}>
        <div style={{ flex: 1.2, padding: '10px 12px', borderRight: '1px solid rgba(201,206,214,.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Date</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cream)' }}>{fmtShort(d.preferredDate)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid rgba(201,206,214,.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Time</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cream)' }}>{d.preferredTime}</div>
        </div>
        <div style={{ flex: 0.8, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.45)', marginBottom: 4 }}>Guests</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cream)' }}>{d.partySize}</div>
        </div>
      </div>

      {active && (
        <Link href="/dining" style={{ display: 'block', padding: '11px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(31,163,166,.15)', border: '1px solid rgba(31,163,166,.3)', color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          + Book Another Restaurant
        </Link>
      )}
    </div>
  )
}

function ConciergeCard({ c }: { c: ApiConcierge }) {
  const tone   = CONC_TONE[c.status] ?? 'mute'
  const label  = CONC_LABEL[c.status] ?? c.status
  const active = !['COMPLETED','CANCELLED'].includes(c.status)

  const accentColor = c.priority === 'URGENT' ? 'rgba(255,80,80,.6)'
                    : c.priority === 'HIGH'   ? 'rgba(212,175,55,.6)'
                    : 'rgba(31,163,166,.5)'

  return (
    <div style={{
      background: active ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.04)',
      border: `1px solid ${active ? 'rgba(201,206,214,.18)' : 'rgba(201,206,214,.1)'}`,
      borderLeft: `3px solid ${active ? accentColor : 'rgba(201,206,214,.15)'}`,
      borderRadius: 16,
      padding: '16px 16px 16px 14px',
      marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: c.description ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(31,163,166,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {catEmoji(c.category)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{c.category}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 800, ...PRIORITY_S[c.priority] }}>
                {c.priority.charAt(0) + c.priority.slice(1).toLowerCase()}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(201,206,214,.35)' }}>·</span>
              <span style={{ fontSize: 10, color: 'rgba(201,206,214,.5)' }}>{fmtDate(c.createdAt)}</span>
            </div>
          </div>
        </div>
        <Badge label={label} tone={tone} />
      </div>

      {c.description && (
        <div style={{
          fontSize: 12, color: 'rgba(201,206,214,.7)', lineHeight: 1.6,
          background: 'rgba(0,0,0,.2)', borderRadius: 10,
          padding: '10px 12px', marginBottom: active ? 12 : 0,
          borderLeft: `2px solid ${accentColor}`,
        }}>
          {c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}
        </div>
      )}

      {active && (
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--teal)',
          textAlign: 'center', padding: '10px 0',
          background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)',
          borderRadius: 10,
        }}>
          ↑ Switch to Chat to follow up
        </div>
      )}
    </div>
  )
}

// ─── Bookings view ────────────────────────────────────────────────────────────

function BookingsView() {
  const [bookTab, setBookTab]   = useState<BookTab>('dining')
  const [stays,    setStays]    = useState<ApiBooking[]>([])
  const [dining,   setDining]   = useState<ApiDining[]>([])
  const [conc,     setConc]     = useState<ApiConcierge[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { setStays(d.stays ?? []); setDining(d.dining ?? []); setConc(d.concierge ?? []) })
      .finally(() => setLoading(false))
  }, [])

  const activeStays = stays.filter(s => isUpcoming(s.checkIn) && s.status.toLowerCase() !== 'cancelled')
  const activeDin   = dining.filter(d => !['COMPLETED','CANCELLED','DECLINED'].includes(d.status))
  const activeConc  = conc.filter(c => !['COMPLETED','CANCELLED'].includes(c.status))

  const counts: Record<BookTab, number> = { stays: activeStays.length, dining: activeDin.length, concierge: activeConc.length }

  const BOOK_TABS: { key: BookTab; label: string }[] = [
    { key: 'dining',    label: 'Dining'    },
    { key: 'stays',     label: 'Stays'     },
    { key: 'concierge', label: 'Requests'  },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, margin: '14px 0 20px' }}>
        {BOOK_TABS.map(t => {
          const active = bookTab === t.key
          const n      = counts[t.key]
          return (
            <button
              key={t.key}
              onClick={() => setBookTab(t.key)}
              style={{
                flex: 1, padding: '11px 6px', borderRadius: 14,
                background: active ? 'rgba(31,163,166,.18)' : 'rgba(255,255,255,.05)',
                border: active ? '1px solid rgba(31,163,166,.35)' : '1px solid rgba(201,206,214,.12)',
                color: active ? 'var(--teal)' : 'rgba(201,206,214,.55)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Urbanist, sans-serif', transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t.label}
              {n > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  background: active ? 'var(--teal)' : 'rgba(201,206,214,.2)',
                  color: active ? '#fff' : 'rgba(201,206,214,.7)',
                }}>
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="sk" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      )}

      {!loading && bookTab === 'dining' && (
        <>
          {dining.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,135,15,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🍽️</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cream)', marginBottom: 8 }}>No dining reservations yet</div>
              <div style={{ fontSize: 13, color: 'rgba(201,206,214,.5)', marginBottom: 24, lineHeight: 1.5 }}>Submit a dining request to book a table at any of our partner restaurants.</div>
              <Link href="/dining" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 14, background: 'var(--teal)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Browse Restaurants</Link>
            </div>
          ) : (
            dining.map(d => <DiningCard key={d.id} d={d} />)
          )}
        </>
      )}

      {!loading && bookTab === 'stays' && (
        <>
          {stays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,175,55,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🏨</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cream)', marginBottom: 8 }}>No stays booked</div>
              <div style={{ fontSize: 13, color: 'rgba(201,206,214,.5)', marginBottom: 24, lineHeight: 1.5 }}>Your Nigerent property bookings will appear here once confirmed.</div>
              <Link href="/chat" onClick={e => e.preventDefault()} style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 14, background: 'var(--teal)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Chat with Concierge</Link>
            </div>
          ) : (
            stays.map(s => <StayCard key={s.id} s={s} />)
          )}
        </>
      )}

      {!loading && bookTab === 'concierge' && (
        <>
          {conc.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(31,163,166,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cream)', marginBottom: 8 }}>No requests yet</div>
              <div style={{ fontSize: 13, color: 'rgba(201,206,214,.5)', marginBottom: 24, lineHeight: 1.5 }}>Submit a request for transport, reservations, or anything you need.</div>
            </div>
          ) : (
            conc.map(c => <ConciergeCard key={c.id} c={c} />)
          )}
        </>
      )}

      {/* View full history */}
      {!loading && (dining.length > 0 || stays.length > 0 || conc.length > 0) && (
        <Link href="/bookings" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 4, padding: '14px 0', borderRadius: 14,
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,206,214,.13)',
          color: 'rgba(201,206,214,.6)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          View full reservation history →
        </Link>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [view,        setView]        = useState<View>('chat')
  const [messages,    setMessages]    = useState<Message[]>([])
  const [inputVal,    setInputVal]    = useState('')
  const [sending,     setSending]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [selCat,      setSelCat]      = useState<(typeof REQUEST_CATS)[0] | null>(null)
  const [reqDetails,  setReqDetails]  = useState('')
  const [reqDate,     setReqDate]     = useState('')
  const [reqTime,     setReqTime]     = useState('')
  const [reqContact,  setReqContact]  = useState('app')
  const [reqPriority, setReqPriority] = useState('standard')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState<{ ref: string } | null>(null)

  const chatEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load thread on mount ──
  useEffect(() => {
    async function loadThread() {
      setLoading(true)
      try {
        const res = await fetch('/api/chat/thread')
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } finally {
        setLoading(false)
      }
    }
    loadThread()
  }, [])

  // ── Poll for new messages every 5 s while on chat view ──
  useEffect(() => {
    if (view !== 'chat' || loading) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/chat/thread')
        if (!res.ok) return
        const data = await res.json()
        setMessages(prev => {
          // Only replace if the server has more messages (new concierge reply arrived)
          if ((data.messages as Message[]).length > prev.length) return data.messages
          // Also update if the last message changed (e.g. optimistic → confirmed)
          const lastServer = data.messages[data.messages.length - 1]
          const lastLocal  = prev[prev.length - 1]
          if (lastServer && lastLocal && lastServer.id !== lastLocal.id) return data.messages
          return prev
        })
      } catch {
        // silently swallow — network blip shouldn't disrupt UX
      }
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [view, loading])

  // ── Scroll to bottom on new messages ──
  const scrollBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])
  useEffect(() => { if (view === 'chat') scrollBottom() }, [messages, view, scrollBottom])

  // ── Send message ──
  async function sendMsg(text?: string) {
    const body = (text ?? inputVal).trim()
    if (!body || sending) return
    const opt: Message = { id: `opt-${Date.now()}`, senderRole: 'MEMBER', body, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, opt])
    setInputVal('')
    setSending(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      const res = await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
      if (res.ok) { const msg = await res.json(); setMessages(prev => prev.map(m => m.id === opt.id ? msg : m)) }
    } finally { setSending(false) }
  }

  // ── Submit request ──
  async function submitRequest() {
    if (!selCat || !reqDetails.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/chat/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selCat.key, description: reqDetails.trim(), date: reqDate, time: reqTime, contactPref: reqContact, priority: reqPriority }),
      })
      if (res.ok) {
        const data = await res.json()
        setSubmitted({ ref: data.ref })
        setReqDetails(''); setReqDate(''); setReqTime('')
        setTimeout(async () => {
          setSubmitted(null); setSelCat(null); setView('chat')
          const r = await fetch('/api/chat/thread')
          if (r.ok) { const d = await r.json(); setMessages(d.messages) }
        }, 3000)
      }
    } finally { setSubmitting(false) }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'
  }

  // ── Group messages by date ──
  const grouped: Array<{ date: string; msgs: Message[] }> = []
  for (const m of messages) {
    const d = formatDate(m.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) last.msgs.push(m)
    else grouped.push({ date: d, msgs: [m] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div className="hdr" style={{ flexShrink: 0, paddingBottom: 0 }}>
        <div className="pe">Your Concierge</div>
        <div className="pt">Always <span className="pti">Available</span></div>
      </div>

      {/* ── View Toggle ── */}
      <div className="view-toggle">
        {(['chat', 'req', 'book'] as View[]).map(v => (
          <div key={v} className={`vt ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>
            {v === 'chat' ? 'Chat' : v === 'req' ? 'New Request' : 'My Bookings'}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════
          CHAT VIEW
      ════════════════════════════════════════ */}
      {view === 'chat' && (
        <>
          <div className="chat-view" style={{ flex: 1, overflowY: 'auto' }}>

            {loading && (
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: i % 2 === 0 ? 'row-reverse' : 'row' }}>
                    <div className="sk" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
                    <div className="sk" style={{ width: `${40 + i * 15}%`, height: 48, borderRadius: 12 }} />
                  </div>
                ))}
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="sys-note" style={{ margin: '24px 16px' }}>
                <div className="sys-note-txt">
                  Welcome to your concierge. Send a message or submit a request using the tab above — we&apos;re here for anything you need.
                </div>
              </div>
            )}

            {!loading && grouped.map(group => (
              <div key={group.date}>
                <div className="date-div">
                  <div className="date-div-line" />
                  <div className="date-div-txt">{group.date}</div>
                  <div className="date-div-line" />
                </div>
                {group.msgs.map((msg, i) => {
                  if (msg.senderRole === 'SYSTEM') {
                    return <div key={msg.id} className="sys-note"><div className="sys-note-txt">{msg.body}</div></div>
                  }
                  const isMember   = msg.senderRole === 'MEMBER'
                  const prevMsg    = group.msgs[i - 1]
                  const showSender = !isMember && (i === 0 || prevMsg?.senderRole !== 'CONCIERGE')
                  return (
                    <div key={msg.id} className={`msg-group ${isMember ? 'out' : 'in'}`}>
                      {showSender && <div className="msg-sender">Nigerent Concierge</div>}
                      <div className={`msg ${isMember ? 'out' : 'in'}`}>
                        <div className="msg-txt">{msg.body}</div>
                        <div className="msg-time">{formatTime(msg.createdAt)}{isMember ? ' · Sent' : ''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-wrap" style={{ position: 'sticky', bottom: 0 }}>
            <div className="chat-quick">
              {QUICK_REPLIES.map(q => (
                <div key={q} className="cq" onClick={() => sendMsg(q)}>{q}</div>
              ))}
            </div>
            <div className="chat-input-row">
              <div className="chat-attach" onClick={() => setView('req')} title="New Request" style={{ cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <textarea
                ref={textareaRef}
                className="chat-ta"
                rows={1}
                placeholder="Message your concierge…"
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); autoResize(e.target) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
              />
              <button className="chat-send" onClick={() => sendMsg()} disabled={sending || !inputVal.trim()}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          NEW REQUEST VIEW
      ════════════════════════════════════════ */}
      {view === 'req' && (
        <div className="req-view active" style={{ flex: 1, overflowY: 'auto' }}>

          <div className="req-intro">
            <div className="req-intro-orb" />
            <div className="req-intro-in">
              <div className="req-intro-eye">Submit a Request</div>
              <div className="req-intro-title">What can we arrange<br/>for you today?</div>
              <div className="req-intro-sub">Choose a category and we&apos;ll take it from there</div>
            </div>
          </div>

          {!selCat && !submitted && (
            <>
              <div className="req-cats-label">Request Category</div>
              <div className="req-cats">
                {REQUEST_CATS.map(cat => (
                  <div key={cat.key} className="req-cat" onClick={() => setSelCat(cat)}>
                    <div className="req-cat-ico">{cat.emoji}</div>
                    <div className="req-cat-lbl">{cat.label}</div>
                    <div className="req-cat-sub">{cat.sub}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selCat && !submitted && (
            <div className="req-form active">
              <div className="rf-back" onClick={() => setSelCat(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="#1fa3a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="rf-back-txt">Change category</span>
              </div>
              <div style={{ background: 'var(--dark)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(31,163,166,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {selCat.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 3 }}>Your Request</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: 'var(--cream)' }}>{selCat.label}</div>
                </div>
              </div>
              <div className="rf-field">
                <div className="rf-label">Tell us what you need</div>
                <textarea className="rf-input" rows={4} placeholder="Describe your request in as much detail as you'd like — the more context, the better we can serve you." value={reqDetails} onChange={e => setReqDetails(e.target.value)} />
              </div>
              <div className="rf-row">
                <div className="rf-field" style={{ marginBottom: 0 }}>
                  <div className="rf-label">Date (optional)</div>
                  <input type="date" className="rf-input" value={reqDate} onChange={e => setReqDate(e.target.value)} />
                </div>
                <div className="rf-field" style={{ marginBottom: 0 }}>
                  <div className="rf-label">Time (optional)</div>
                  <input type="time" className="rf-input" value={reqTime} onChange={e => setReqTime(e.target.value)} />
                </div>
              </div>
              <div className="rf-field" style={{ marginTop: 18 }}>
                <div className="rf-label">How should we respond?</div>
                <select className="rf-select" value={reqContact} onChange={e => setReqContact(e.target.value)}>
                  <option value="app">Via chat (preferred)</option>
                  <option value="phone">Call me on my phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="rf-field">
                <div className="rf-label">Priority level</div>
                <select className="rf-select" value={reqPriority} onChange={e => setReqPriority(e.target.value)}>
                  <option value="standard">Standard — within 2 hours</option>
                  <option value="urgent">Urgent — within 30 minutes</option>
                  <option value="flexible">Flexible — today or tomorrow</option>
                </select>
              </div>
              <button className="rf-submit" onClick={submitRequest} disabled={submitting || !reqDetails.trim()} style={{ opacity: submitting || !reqDetails.trim() ? 0.5 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          )}

          {submitted && (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
              <div className="suc-title">Request Submitted</div>
              <div className="suc-sub">Your concierge has received your request and will respond within 2 hours during business hours.</div>
              <div className="suc-ref">Ref: {submitted.ref}</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          MY BOOKINGS VIEW
      ════════════════════════════════════════ */}
      {view === 'book' && <BookingsView />}

    </div>
  )
}
