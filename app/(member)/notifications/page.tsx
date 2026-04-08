'use client'
/**
 * /notifications — Member Notifications Inbox
 * Filter pills: All · Offers · Concierge · Dining · System
 * Mark individual or all as read.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Filter = 'all' | 'offers' | 'concierge' | 'dining' | 'system'

interface Notification {
  id:        string
  type:      string
  title:     string
  body:      string
  readAt:    string | null
  ctaUrl:    string | null
  createdAt: string
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'offers',    label: 'Offers'    },
  { key: 'concierge', label: 'Concierge' },
  { key: 'dining',    label: 'Dining'    },
  { key: 'system',    label: 'System'    },
]

const TYPE_ICONS: Record<string, string> = {
  OFFER_NEW:           '✦',
  OFFER_EXPIRING:      '⏳',
  CONCIERGE_UPDATE:    '💬',
  CONCIERGE_RESOLVED:  '✓',
  DINING_UPDATE:       '🍽️',
  DINING_CONFIRMED:    '✅',
  DINING_DECLINED:     '✗',
  SYSTEM:              '⚙️',
  WELCOME:             '🎉',
  POINTS_EARNED:       '⭐',
  TIER_UPGRADE:        '🏆',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter]           = useState<Filter>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [markingAll, setMarkingAll]   = useState(false)

  const loadNotifications = useCallback(async (f: Filter) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/notifications?filter=${f}`)
      if (r.status === 401) { router.replace('/login?reason=session_expired'); return }
      if (r.ok) {
        const d = await r.json()
        setNotifications(d.notifications)
        setUnreadCount(d.unreadCount)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadNotifications(filter)
  }, [filter, loadNotifications])

  async function markRead(id: string) {
    // Optimistic update
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  async function markAllRead() {
    setMarkingAll(true)
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setNotifications(ns => ns.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
    setMarkingAll(false)
  }

  const unreadInView = notifications.filter(n => !n.readAt).length

  return (
    <div style={{ background: '#0f1a1a', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: 'max(28px, calc(env(safe-area-inset-top) + 10px)) 20px 0', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/home" style={{ background: 'rgba(201,206,214,.06)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,206,214,.5)', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 2 }}>
              Inbox
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cream)' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 8, background: 'var(--teal)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, verticalAlign: 'middle' }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadInView > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              style={{ background: 'rgba(31,163,166,.1)', border: '1px solid rgba(31,163,166,.2)', borderRadius: 10, padding: '8px 14px', color: 'var(--teal)', fontSize: 11, fontWeight: 700, cursor: markingAll ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', opacity: markingAll ? 0.6 : 1 }}
            >
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, msOverflowStyle: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: filter === f.key ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.12)',
                background: filter === f.key ? 'rgba(31,163,166,.12)' : 'rgba(255,255,255,.04)',
                color: filter === f.key ? 'var(--teal)' : 'rgba(201,206,214,.45)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'Urbanist, sans-serif',
                transition: 'all .15s',
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '0 20px' }}>

        {/* Loading skeletons */}
        {loading && (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="sk" style={{ height: 76, borderRadius: 16, marginBottom: 10 }} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>
              {filter === 'all' ? 'All caught up!' : `No ${filter} notifications`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(201,206,214,.4)', maxWidth: 240, margin: '0 auto' }}>
              {filter === 'all'
                ? 'We\'ll let you know when something needs your attention.'
                : `Your ${filter} notifications will appear here.`}
            </div>
          </div>
        )}

        {/* Notifications list */}
        {!loading && notifications.length > 0 && (
          <div>
            {notifications.map((n, idx) => {
              const isUnread = !n.readAt
              const icon = TYPE_ICONS[n.type] ?? '•'
              const isFirst = idx === 0
              const prevDate = idx > 0 ? new Date(notifications[idx - 1].createdAt).toDateString() : null
              const thisDate = new Date(n.createdAt).toDateString()
              const showDateSep = isFirst || prevDate !== thisDate

              return (
                <div key={n.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.25)', marginTop: idx === 0 ? 0 : 24, marginBottom: 10 }}>
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  )}

                  {/* Notification card */}
                  <div
                    onClick={() => {
                      if (isUnread) markRead(n.id)
                      if (n.ctaUrl) router.push(n.ctaUrl)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 16px',
                      background: isUnread ? 'rgba(31,163,166,.06)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${isUnread ? 'rgba(31,163,166,.14)' : 'rgba(201,206,214,.07)'}`,
                      borderRadius: 16,
                      marginBottom: 8,
                      cursor: (isUnread || n.ctaUrl) ? 'pointer' : 'default',
                      transition: 'background .15s',
                      position: 'relative',
                    }}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <div style={{ position: 'absolute', top: 14, right: 14, width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)' }} />
                    )}

                    {/* Icon */}
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isUnread ? 'rgba(31,163,166,.12)' : 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: isUnread ? 800 : 600, color: isUnread ? 'var(--cream)' : 'rgba(201,206,214,.7)', marginBottom: 3, lineHeight: 1.4 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(201,206,214,.45)', lineHeight: 1.45 }}>
                        {n.body}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, letterSpacing: '.5px', color: isUnread ? 'rgba(31,163,166,.6)' : 'rgba(201,206,214,.25)' }}>
                        {relativeTime(n.createdAt)}
                      </div>
                    </div>

                    {/* CTA arrow */}
                    {n.ctaUrl && (
                      <div style={{ alignSelf: 'center', color: 'rgba(201,206,214,.2)', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
