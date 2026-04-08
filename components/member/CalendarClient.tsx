'use client'
/**
 * CalendarClient — Member itinerary planner.
 * Shows a month grid, upcoming events list, and an "Add Event" form.
 */

import { useState, useEffect, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type EventType = 'DINING' | 'EVENT' | 'PERSONAL' | 'EXPERIENCE'

interface CalEvent {
  id:          string
  title:       string
  description: string | null
  date:        string   // ISO string
  time:        string | null
  endTime:     string | null
  type:        EventType
  status:      string
  restaurantId: string | null
  restaurant?: { name: string; area: string; city: string } | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<EventType, { color: string; bg: string; label: string; icon: string }> = {
  DINING:     { color: '#d4af37', bg: 'rgba(212,175,55,.12)',  label: 'Dining',     icon: '🍽️' },
  EVENT:      { color: '#9b59b6', bg: 'rgba(155,89,182,.12)',  label: 'Event',      icon: '🎭' },
  PERSONAL:   { color: '#1fa3a6', bg: 'rgba(31,163,166,.12)',  label: 'Personal',   icon: '📌' },
  EXPERIENCE: { color: '#27ae60', bg: 'rgba(39,174,96,.12)',   label: 'Experience', icon: '✨' },
}

const DAYS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmtTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hNum = parseInt(h)
  const ampm = hNum >= 12 ? 'PM' : 'AM'
  return `${hNum % 12 || 12}:${m} ${ampm}`
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CalendarClient() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [events,      setEvents]      = useState<CalEvent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected,    setSelected]    = useState<string>(isoDate(today))
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState({
    title:       '',
    description: '',
    date:        isoDate(today),
    time:        '',
    endTime:     '',
    type:        'PERSONAL' as EventType,
  })

  // ── Fetch events ──────────────────────────────────────────────────────────

  useEffect(() => {
    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const from  = new Date(year, month - 1, 1).toISOString()
    const to    = new Date(year, month + 2, 0).toISOString()

    setLoading(true)
    fetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentDate])

  // ── Month grid ────────────────────────────────────────────────────────────

  const { daysInMonth, startDow } = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    return {
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      startDow:    new Date(y, m, 1).getDay(),
    }
  }, [currentDate])

  // Map ISO date → event count for dot indicators
  const eventDots = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of events) {
      const key = e.date.slice(0, 10)
      m[key] = (m[key] ?? 0) + 1
    }
    return m
  }, [events])

  // Events for the selected day
  const dayEvents = useMemo(() => {
    return events
      .filter(e => e.date.slice(0, 10) === selected)
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  }, [events, selected])

  // Upcoming events (next 14 days) for summary strip when nothing selected
  const upcoming = useMemo(() => {
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() + 14)
    return events
      .filter(e => {
        const d = new Date(e.date.slice(0, 10) + 'T00:00:00')
        return d >= today && d <= cutoff
      })
      .slice(0, 8)
  }, [events, today])

  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  // ── Save event ────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      if (res.ok) {
        const { event } = await res.json()
        setEvents(prev => [...prev, event])
        setSelected(form.date)
        setShowForm(false)
        setForm({ title: '', description: '', date: isoDate(today), time: '', endTime: '', type: 'PERSONAL' })
      }
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()

  return (
    <>
      {/* ── Header ── */}
      <div className="hdr" style={{ paddingBottom: 16 }}>
        <div className="pg-eye">Member Calendar</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 400,
          color: 'var(--cream)', paddingBottom: 8, lineHeight: 1.05,
        }}>
          Your Itinerary
        </div>
      </div>

      {/* ── Month Selector ── */}
      <div className="cal-month-row">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cal-month-lbl">{MONTHS[m]} {y}</div>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="cal-grid-wrap">
        {/* Day headers */}
        <div className="cal-grid">
          {DAYS.map(d => (
            <div key={d} className="cal-day-hdr">{d}</div>
          ))}
        </div>

        {/* Date cells */}
        <div className="cal-grid">
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`e-${i}`} className="cal-cell" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1
            const iso     = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = iso === isoDate(today)
            const isSel   = iso === selected
            const dots    = eventDots[iso] ?? 0

            return (
              <div
                key={iso}
                className={`cal-cell clickable ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}`}
                onClick={() => setSelected(iso)}
              >
                <span className={`cal-day-num ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}`}>
                  {day}
                </span>
                {dots > 0 && (
                  <div className="cal-dots">
                    {Array.from({ length: Math.min(dots, 3) }).map((_, di) => (
                      <div key={di} className="cal-dot" />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Selected Day Events ── */}
      <div className="sec">
        <div className="sh2">
          <div className="sh2-t">{fmtDate(selected)}</div>
          <button
            className="cal-add-btn"
            onClick={() => {
              setForm(f => ({ ...f, date: selected }))
              setShowForm(true)
            }}
          >
            + Add
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0', color: 'rgba(201,206,214,.3)', fontSize: 13, textAlign: 'center' }}>
            Loading…
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="cal-empty">
            <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>No events for this day.</div>
            <button
              className="cal-add-link"
              onClick={() => {
                setForm(f => ({ ...f, date: selected }))
                setShowForm(true)
              }}
            >
              + Add an event
            </button>
          </div>
        ) : (
          <div className="cal-events-list">
            {dayEvents.map(ev => {
              const s = TYPE_STYLE[ev.type]
              return (
                <div key={ev.id} className="cal-ev" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="cal-ev-left">
                    <div className="cal-ev-time">
                      {ev.time ? fmtTime(ev.time) : 'All day'}
                      {ev.endTime ? ` – ${fmtTime(ev.endTime)}` : ''}
                    </div>
                    <div className="cal-ev-title">{ev.title}</div>
                    {ev.restaurant && (
                      <div className="cal-ev-sub">📍 {ev.restaurant.name}, {ev.restaurant.area}</div>
                    )}
                    {ev.description && (
                      <div className="cal-ev-sub">{ev.description}</div>
                    )}
                  </div>
                  <div className="cal-ev-right">
                    <div
                      className="cal-ev-type"
                      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}
                    >
                      {s.icon} {s.label}
                    </div>
                    <button
                      className="cal-ev-del"
                      onClick={() => handleDelete(ev.id)}
                      aria-label="Delete event"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming (next 14 days) ── */}
      {upcoming.length > 0 && (
        <div className="sec">
          <div className="sh2">
            <div className="sh2-t">Upcoming</div>
          </div>
          <div className="cal-upcoming">
            {upcoming.map(ev => {
              const s = TYPE_STYLE[ev.type]
              return (
                <div
                  key={ev.id}
                  className="cal-up-item"
                  onClick={() => setSelected(ev.date.slice(0, 10))}
                >
                  <div
                    className="cal-up-ico"
                    style={{ background: s.bg, border: `1px solid ${s.color}30` }}
                  >
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                  </div>
                  <div className="cal-up-info">
                    <div className="cal-up-title">{ev.title}</div>
                    <div className="cal-up-meta">
                      {fmtDate(ev.date.slice(0, 10))}
                      {ev.time ? ` · ${fmtTime(ev.time)}` : ''}
                    </div>
                  </div>
                  <div className="cal-up-type" style={{ color: s.color }}>{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="gap" />
      <div className="gap" />

      {/* ── Add Event Sheet ── */}
      {showForm && (
        <div className="ov2" onClick={() => setShowForm(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="s-hdr">
              <div className="s-ttl">Add Event</div>
              <button className="s-cls" onClick={() => setShowForm(false)}>×</button>
            </div>

            <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div>
                <div className="ob-field-label">Event Title *</div>
                <input
                  className="ob-input"
                  style={{ background: '#f7f3ef', color: 'var(--dark)', border: '1.5px solid var(--border)' }}
                  placeholder="e.g. Dinner at Nok"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Type */}
              <div>
                <div className="ob-field-label">Type</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.keys(TYPE_STYLE) as EventType[]).map(t => {
                    const s = TYPE_STYLE[t]
                    const active = form.type === t
                    return (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: active ? s.bg : 'rgba(0,0,0,.04)',
                          border: active ? `1px solid ${s.color}40` : '1px solid rgba(0,0,0,.08)',
                          color: active ? s.color : 'var(--muted)',
                          cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                        }}
                      >
                        {s.icon} {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="ob-field-label">Date *</div>
                <input
                  type="date"
                  className="ob-input"
                  style={{ background: '#f7f3ef', color: 'var(--dark)', border: '1.5px solid var(--border)' }}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              {/* Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="ob-field-label">Start Time</div>
                  <input
                    type="time"
                    className="ob-input"
                    style={{ background: '#f7f3ef', color: 'var(--dark)', border: '1.5px solid var(--border)' }}
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="ob-field-label">End Time</div>
                  <input
                    type="time"
                    className="ob-input"
                    style={{ background: '#f7f3ef', color: 'var(--dark)', border: '1.5px solid var(--border)' }}
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="ob-field-label">Notes (optional)</div>
                <textarea
                  className="ob-input"
                  style={{
                    background: '#f7f3ef', color: 'var(--dark)', border: '1.5px solid var(--border)',
                    resize: 'none', height: 72, fontFamily: 'Urbanist, sans-serif',
                  }}
                  placeholder="Any notes or details…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <button
                className="ob-cta"
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.date}
              >
                {saving ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
