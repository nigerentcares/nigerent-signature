'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    key:   'requests',
    path:  '/concierge',
    exact: true,
    label: 'Requests',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key:   'bookings',
    path:  '/concierge/bookings',
    exact: false,
    label: 'Bookings',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="8"  cy="16" r="1" fill="currentColor"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
        <circle cx="16" cy="16" r="1" fill="currentColor"/>
        <circle cx="8"  cy="12" r="1" fill="currentColor"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    key:   'members',
    path:  '/concierge/members',
    exact: false,
    label: 'Members',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key:   'vendors',
    path:  '/concierge/vendors',
    exact: false,
    label: 'Vendors',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 9l1-5h16l1 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9a2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 11v8a1 1 0 001 1h12a1 1 0 001-1v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 15h4v5h-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key:   'profile',
    path:  '/concierge/profile',
    exact: false,
    label: 'Profile',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function ConciergeNav() {
  const pathname = usePathname()
  const router   = useRouter()

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.exact) return pathname === item.path
    return pathname.startsWith(item.path)
  }

  return (
    <nav className="con-nav">
      {NAV_ITEMS.map(item => {
        const active = isActive(item)
        return (
          <div
            key={item.key}
            className={`con-ni ${active ? 'on' : ''}`}
            onClick={() => router.push(item.path)}
          >
            <div className="con-ni-pip" />
            <div
              className="con-ni-ico"
              style={{ color: active ? 'var(--teal)' : 'rgba(201,206,214,.3)' }}
            >
              {item.icon}
            </div>
            <div className="con-ni-lbl">{item.label}</div>
          </div>
        )
      })}
    </nav>
  )
}
