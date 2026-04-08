'use client'
/**
 * AdminShell — bottom-tab layout wrapper for all admin pages.
 * Matches the member app's bottom-nav pattern.
 * Primary tabs: Dashboard, Members, Offers, Restaurants, More
 * "More" expands a slide-up sheet with remaining nav items + sign out.
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type NavKey = 'dashboard' | 'members' | 'offers' | 'restaurants' | 'concierge' | 'wallet' | 'invites' | 'partners' | 'reports' | 'rewards' | 'profile'

// Primary bottom-bar tabs (max 5)
const PRIMARY_TABS: { key: NavKey; label: string; path: string; icon: JSX.Element }[] = [
  {
    key: 'dashboard', label: 'Dashboard', path: '/admin',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    key: 'members', label: 'Members', path: '/admin/members',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    key: 'offers', label: 'Offers', path: '/admin/offers',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  },
  {
    key: 'restaurants', label: 'Dining', path: '/admin/restaurants',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

// Items in the "More" sheet
const MORE_ITEMS: { key: NavKey; label: string; path: string; icon: string }[] = [
  { key: 'partners',   label: 'Partners',     path: '/admin/partners',   icon: '🤝' },
  { key: 'concierge',  label: 'Concierge',    path: '/admin/concierge',  icon: '💬' },
  { key: 'wallet',     label: 'Wallet',       path: '/admin/wallet',     icon: '💳' },
  { key: 'rewards',    label: 'Rewards',      path: '/admin/rewards',    icon: '⭐' },
  { key: 'reports',    label: 'Reports',      path: '/admin/reports',    icon: '📊' },
  { key: 'invites',    label: 'Invites',      path: '/admin/invites',    icon: '✉️' },
  { key: 'profile',    label: 'Profile',      path: '/admin/profile',    icon: '👤' },
]

// All nav keys for "More" to detect active state
const MORE_KEYS = new Set(MORE_ITEMS.map(i => i.key))

function resolveActiveNav(pathname: string): NavKey {
  if (pathname === '/admin') return 'dashboard'
  for (const item of [...PRIMARY_TABS, ...MORE_ITEMS]) {
    if (pathname.startsWith(item.path) && item.path !== '/admin') return item.key
  }
  return 'dashboard'
}

export default function AdminShell({
  children,
  activeNav,
}: {
  children: React.ReactNode
  activeNav: NavKey
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const resolved = activeNav || resolveActiveNav(pathname)
  const moreActive = MORE_KEYS.has(resolved)

  function isTabActive(key: NavKey) {
    return resolved === key
  }

  return (
    <div className="adm-app">
      {/* ── Page header (simplified top bar) ── */}
      <div className="adm-top-header">
        <div className="adm-top-brand">
          <div className="adm-brand-mark">NSL</div>
          <div>
            <div className="adm-brand-name" style={{ fontSize: 13 }}>Signature</div>
            <div className="adm-brand-sub">Admin Panel</div>
          </div>
        </div>
        <Link href="/home" className="adm-member-link">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Member App
        </Link>
      </div>

      {/* ── Main content ── */}
      <main className="adm-body">
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="adm-bnav">
        {PRIMARY_TABS.map(tab => {
          const active = isTabActive(tab.key)
          return (
            <div
              key={tab.key}
              className={`adm-bni ${active ? 'on' : ''}`}
              onClick={() => { setMoreOpen(false); router.push(tab.path) }}
            >
              <div className="adm-bni-pip" />
              <div className="adm-bni-ico" style={{ color: active ? 'var(--teal)' : 'rgba(201,206,214,.35)' }}>
                {tab.icon}
              </div>
              <div className="adm-bni-lbl">{tab.label}</div>
            </div>
          )
        })}

        {/* More button */}
        <div
          className={`adm-bni ${moreActive || moreOpen ? 'on' : ''}`}
          onClick={() => setMoreOpen(o => !o)}
        >
          <div className="adm-bni-pip" />
          <div className="adm-bni-ico" style={{ color: moreActive || moreOpen ? 'var(--teal)' : 'rgba(201,206,214,.35)' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="adm-bni-lbl">More</div>
        </div>
      </nav>

      {/* ── More Sheet (slide-up overlay) ── */}
      {moreOpen && (
        <>
          <div className="adm-more-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="adm-more-sheet">
            <div className="adm-more-handle" />
            <div className="adm-more-list">
              {MORE_ITEMS.map(item => (
                <Link
                  key={item.key}
                  href={item.path}
                  className={`adm-more-item ${resolved === item.key ? 'on' : ''}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <div className="adm-more-ico">{item.icon}</div>
                  <div className="adm-more-lbl">{item.label}</div>
                  {resolved === item.key && <div className="adm-more-active-dot" />}
                </Link>
              ))}
            </div>
            <div className="adm-more-divider" />
            <button
              className="adm-more-signout"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/login'
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
