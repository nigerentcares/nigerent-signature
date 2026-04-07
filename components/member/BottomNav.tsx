'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Bottom navigation bar.
 * Rewards tab replaced with Notifications (bell + unread badge).
 */

const NAV_ITEMS = [
  {
    key:   'home',
    path:  '/home',
    label: 'Home',
    icon:  (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key:   'explore',
    path:  '/explore',
    label: 'Explore',
    icon:  (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key:   'wallet',
    path:  '/wallet',
    label: 'Wallet',
    icon:  (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 2H8a2 2 0 00-2 2v3h12V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="17" cy="14" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    key:   'notifications',
    path:  '/notifications',
    label: 'Alerts',
    icon:  (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key:   'chat',
    path:  '/chat',
    label: 'Concierge',
    icon:  (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [unread, setUnread] = useState(0)

  // Fetch unread notification count on mount (and refresh when navigating)
  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [pathname])

  function isActive(path: string) {
    return pathname.startsWith(path)
  }

  return (
    <nav className="nav">
      {NAV_ITEMS.map((item) => {
        const active  = isActive(item.path)
        const badge   = item.key === 'notifications' && unread > 0
        return (
          <div
            key={item.key}
            className={`ni ${active ? 'on' : ''}`}
            onClick={() => router.push(item.path)}
          >
            <div className="ni-pip" />
            {/* Icon wrapper — relative so badge can sit top-right */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <div
                className="ni-ico"
                style={{ color: active ? 'var(--teal)' : 'rgba(201,206,214,.35)' }}
              >
                {item.icon}
              </div>
              {badge && (
                <div style={{
                  position: 'absolute', top: -3, right: -5,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#e74c3c', border: '1.5px solid var(--dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                  padding: '0 3px', lineHeight: 1,
                }}>
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </div>
            <div className="ni-lbl">{item.label}</div>
          </div>
        )
      })}
    </nav>
  )
}
