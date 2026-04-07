'use client'
/**
 * BookingsClient — tabbed reservations view
 * Tabs: Stays · Dining · Concierge
 * Each tab shows items sorted newest-first with status badges,
 * quick-action links, and graceful empty states.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Serialised shapes passed from the server page ────────────────────────────

export interface SerializedBooking {
  id:         string
  property:   string
  checkIn:    string
  checkOut:   string
  amount:     number     // kobo
  status:     string
  createdAt:  string
}

export interface SerializedDiningReq {
  id:             string
  restaurantName: string
  preferredDate:  string
  preferredTime:  string
  partySize:      number
  occasion:       string | null
  status:         string
  createdAt:      string
}

export interface SerializedConciergeReq {
  id:          string
  category:    string
  description: string
  status:      string
  priority:    string
  createdAt:   string
}

type Tab = 'stays' | 'dining' | 'concierge'

interface Props {
  stays:     SerializedBooking[]
  dining:    SerializedDiningReq[]
  concierge: SerializedConciergeReq[]
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const DINING_STATUS_LABEL: Record<string, string> = {
  RECEIVED:       'Received',
  IN_PROGRESS:    'In Progress',
  CONFIRMED:      'Confirmed',
  DECLINED:       'Declined',
  COMPLETED:      'Completed',
  CANCELLED:      'Cancelled',
}
const CONC_STATUS_LABEL: Record<string, string> = {
  RECEIVED:         'Open',
  IN_PROGRESS:      'In Progress',
  AWAITING_UPDATE:  'Awaiting Update',
  COMPLETED:        'Resolved',
  CANCELLED:        'Cancelled',
}

type BadgeTone = 'ok' | 'warn' | 'err' | 'mute' | 'gold'
const DINING_STATUS_TONE: Record<string, BadgeTone> = {
  RECEIVED:    'warn',
  IN_PROGRESS: 'warn',
  CONFIRMED:   'ok',
  DECLINED:    'err',
  COMPLETED:   'mute',
  CANCELLED:   'err',
}
const CONC_STATUS_TONE: Record<string, BadgeTone> = {
  RECEIVED:        'warn',
  IN_PROGRESS:     'warn',
  AWAITING_UPDATE: 'gold',
  COMPLETED:       'ok',
  CANCELLED:       'err',
}
const BOOKING_STATUS_TONE: Record<string, BadgeTone> = {
  confirmed:  'ok',
  active:     'ok',
  checked_in: 'gold',
  completed:  'mute',
  cancelled:  'err',
}

const TONE_STYLE: Record<BadgeTone, React.CSSProperties> = {
  ok:   { background: 'rgba(30,168,106,.12)',  color: '#1ea86a',  border: '1px solid rgba(30,168,106,.2)' },
  warn: { background: 'rgba(212,175,55,.12)',  color: '#d4af37',  border: '1px solid rgba(212,175,55,.2)' },
  err:  { background: 'rgba(255,80,80,.12)',   color: '#ff7070',  border: '1px solid rgba(255,80,80,.2)' },
  mute: { background: 'rgba(201,206,214,.08)', color: 'rgba(201,206,214,.4)', border: '1px solid rgba(201,206,214,.12)' },
  gold: { background: 'rgba(31,163,166,.12)',  color: '#1fa3a6',  border: '1px solid rgba(31,163,166,.2)' },
}

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  URGENT:   { color: '#ff7070' },
  HIGH:     { color: '#d4af37' },
  STANDARD: { color: 'rgba(201,206,214,.4)' },
}

const CATEGORY_EMOJI: Record<string, string> = {
  dining:           '🍽️',
  transport:        '🚗',
  wellness:         '🧖',
  accommodation:    '🏨',
  shopping:         '🛍️',
  entertainment:    '🎬',
  travel:           '✈️',
  healthcare:       '🏥',
  general:          '💬',
}

function catEmoji(cat: string): string {
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '💬'
}

// ─── Date formatters ───────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtNGN(kobo: number) {
  const ngn = Math.floor(kobo / 100)
  if (ngn >= 1_000_000) return `₦${(ngn / 1_000_000).toFixed(1)}m`
  if (ngn >= 1_000)     return `₦${Math.round(ngn / 1_000)}k`
  return `₦${ngn.toLocaleString()}`
}
function nightCount(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.round(diff / 86400000)
}
function isUpcoming(iso: string) {
  return new Date(iso).getTime() > Date.now()
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, ...TONE_STYLE[tone] }}>
      {label}
    </span>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function Empty({ emoji, title, sub, cta, ctaHref }: {
  emoji: string
  title: string
  sub: string
  cta: string
  ctaHref: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 42, marginBottom: 16 }}>{emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(201,206,214,.4)', marginBottom: 24, maxWidth: 240, margin: '0 auto 24px' }}>{sub}</div>
      <Link href={ctaHref} style={{ display: 'inline-block', padding: '11px 22px', borderRadius: 14, background: 'var(--teal)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
        {cta}
      </Link>
    </div>
  )
}

// ─── Section heading ───────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.25)', marginTop: 24, marginBottom: 10 }}>
      {label}
    </div>
  )
}

// ─── Stays tab ────────────────────────────────────────────────────────────────

function StaysTab({ stays }: { stays: SerializedBooking[] }) {
  if (stays.length === 0) {
    return (
      <Empty
        emoji="🏨"
        title="No stays yet"
        sub="Your Nigerent property bookings will appear here."
        cta="Chat with Concierge"
        ctaHref="/chat"
      />
    )
  }

  const upcoming = stays.filter(s => isUpcoming(s.checkIn))
  const past     = stays.filter(s => !isUpcoming(s.checkIn))

  return (
    <>
      {upcoming.length > 0 && <GroupLabel label="Upcoming" />}
      {upcoming.map(s => <StayCard key={s.id} stay={s} />)}
      {past.length > 0 && <GroupLabel label="Past Stays" />}
      {past.map(s => <StayCard key={s.id} stay={s} />)}
    </>
  )
}

function StayCard({ stay }: { stay: SerializedBooking }) {
  const nights = nightCount(stay.checkIn, stay.checkOut)
  const tone   = BOOKING_STATUS_TONE[stay.status.toLowerCase()] ?? 'mute'
  const active = isUpcoming(stay.checkIn) && stay.status.toLowerCase() !== 'cancelled'

  return (
    <div style={{ background: active ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${active ? 'rgba(201,206,214,.1)' : 'rgba(201,206,214,.06)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10 }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{stay.property}</div>
            <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)', marginTop: 2 }}>{nights} night{nights !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <Badge label={stay.status.replace(/_/g, ' ')} tone={tone} />
      </div>

      {/* Date bar */}
      <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,.04)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid rgba(201,206,214,.07)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Check-in</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>{fmtShort(stay.checkIn)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Check-out</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>{fmtShort(stay.checkOut)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', borderLeft: '1px solid rgba(201,206,214,.07)', textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)' }}>{fmtNGN(stay.amount)}</div>
        </div>
      </div>

      {/* Actions */}
      {active && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/chat" style={{ flex: 1, display: 'block', padding: '10px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)', color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Concierge
          </Link>
          <Link href="/chat" style={{ flex: 1, display: 'block', padding: '10px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(201,206,214,.1)', color: 'rgba(201,206,214,.6)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Modify
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Dining tab ───────────────────────────────────────────────────────────────

function DiningTab({ dining }: { dining: SerializedDiningReq[] }) {
  if (dining.length === 0) {
    return (
      <Empty
        emoji="🍽️"
        title="No dining reservations"
        sub="Submit a dining request to book a table at any of our partner restaurants."
        cta="Browse Restaurants"
        ctaHref="/dining"
      />
    )
  }

  const active = dining.filter(d => !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(d.status))
  const done   = dining.filter(d =>  ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(d.status))

  return (
    <>
      {active.length > 0 && <GroupLabel label="Active Requests" />}
      {active.map(d => <DiningCard key={d.id} req={d} />)}
      {done.length > 0 && <GroupLabel label="Past Reservations" />}
      {done.map(d => <DiningCard key={d.id} req={d} />)}
    </>
  )
}

function DiningCard({ req }: { req: SerializedDiningReq }) {
  const tone    = DINING_STATUS_TONE[req.status] ?? 'mute'
  const label   = DINING_STATUS_LABEL[req.status] ?? req.status
  const isActive = !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(req.status)

  return (
    <div style={{ background: isActive ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${isActive ? 'rgba(201,206,214,.1)' : 'rgba(201,206,214,.06)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,135,15,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍽️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{req.restaurantName}</div>
            {req.occasion && (
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)', marginTop: 2 }}>{req.occasion}</div>
            )}
          </div>
        </div>
        <Badge label={label} tone={tone} />
      </div>

      {/* Details bar */}
      <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,.04)', borderRadius: 12, overflow: 'hidden', marginBottom: isActive ? 12 : 0 }}>
        <div style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid rgba(201,206,214,.07)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Date</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cream)' }}>{fmtShort(req.preferredDate)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid rgba(201,206,214,.07)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Time</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cream)' }}>{req.preferredTime}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 4 }}>Guests</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cream)' }}>{req.partySize}</div>
        </div>
      </div>

      {isActive && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/chat" style={{ flex: 1, display: 'block', padding: '10px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)', color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Message Concierge
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Concierge tab ────────────────────────────────────────────────────────────

function ConciergeTab({ concierge }: { concierge: SerializedConciergeReq[] }) {
  if (concierge.length === 0) {
    return (
      <Empty
        emoji="💬"
        title="No requests yet"
        sub="Submit a concierge request for anything you need — transport, reservations, recommendations."
        cta="Chat with Concierge"
        ctaHref="/chat"
      />
    )
  }

  const active = concierge.filter(c => !['COMPLETED', 'CANCELLED'].includes(c.status))
  const done   = concierge.filter(c =>  ['COMPLETED', 'CANCELLED'].includes(c.status))

  return (
    <>
      {active.length > 0 && <GroupLabel label="Open Requests" />}
      {active.map(c => <ConciergeCard key={c.id} req={c} />)}
      {done.length > 0 && <GroupLabel label="Past Requests" />}
      {done.map(c => <ConciergeCard key={c.id} req={c} />)}
    </>
  )
}

function ConciergeCard({ req }: { req: SerializedConciergeReq }) {
  const tone    = CONC_STATUS_TONE[req.status] ?? 'mute'
  const label   = CONC_STATUS_LABEL[req.status] ?? req.status
  const isActive = !['COMPLETED', 'CANCELLED'].includes(req.status)

  return (
    <div style={{ background: isActive ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${isActive ? 'rgba(201,206,214,.1)' : 'rgba(201,206,214,.06)'}`, borderRadius: 18, padding: '16px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(31,163,166,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {catEmoji(req.category)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.3 }}>{req.category}</div>
            <div style={{ fontSize: 11, marginTop: 2, ...PRIORITY_STYLE[req.priority] }}>
              {req.priority.charAt(0) + req.priority.slice(1).toLowerCase()} Priority · {fmtDate(req.createdAt)}
            </div>
          </div>
        </div>
        <Badge label={label} tone={tone} />
      </div>

      {req.description && (
        <div style={{ fontSize: 12, color: 'rgba(201,206,214,.5)', lineHeight: 1.5, marginBottom: isActive ? 12 : 0, background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px' }}>
          {req.description.length > 120 ? req.description.slice(0, 120) + '…' : req.description}
        </div>
      )}

      {isActive && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/chat" style={{ flex: 1, display: 'block', padding: '10px 0', textAlign: 'center', borderRadius: 12, background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)', color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            View in Chat
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; countFn: (p: Props) => number }[] = [
  { key: 'stays',     label: 'Stays',     countFn: p => p.stays.length },
  { key: 'dining',    label: 'Dining',    countFn: p => p.dining.length },
  { key: 'concierge', label: 'Concierge', countFn: p => p.concierge.length },
]

export default function BookingsClient(props: Props) {
  const [tab, setTab] = useState<Tab>('dining')

  const activeCount = {
    stays:     props.stays.filter(s => isUpcoming(s.checkIn) && s.status.toLowerCase() !== 'cancelled').length,
    dining:    props.dining.filter(d => !['COMPLETED','CANCELLED','DECLINED'].includes(d.status)).length,
    concierge: props.concierge.filter(c => !['COMPLETED','CANCELLED'].includes(c.status)).length,
  }

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,.04)', borderRadius: 16, padding: 4, margin: '0 20px 24px' }}>
        {TABS.map(t => {
          const active = tab === t.key
          const count  = activeCount[t.key]
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 13,
                background: active ? 'rgba(31,163,166,.18)' : 'transparent',
                border: active ? '1px solid rgba(31,163,166,.25)' : '1px solid transparent',
                color: active ? 'var(--teal)' : 'rgba(201,206,214,.4)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Urbanist, sans-serif', transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'var(--teal)' : 'rgba(201,206,214,.15)',
                  color: active ? '#fff' : 'rgba(201,206,214,.5)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '0 20px' }}>
        {tab === 'stays'     && <StaysTab     stays={props.stays} />}
        {tab === 'dining'    && <DiningTab    dining={props.dining} />}
        {tab === 'concierge' && <ConciergeTab concierge={props.concierge} />}
      </div>
    </>
  )
}
