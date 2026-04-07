'use client'
/**
 * AdminShell — sidebar layout wrapper for all admin pages.
 * Responsive: sidebar on desktop, top bar on mobile.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type NavKey = 'dashboard' | 'members' | 'offers' | 'restaurants' | 'concierge' | 'wallet' | 'invites'

const NAV: { key: NavKey; label: string; path: string; icon: string }[] = [
  { key: 'dashboard',   label: 'Dashboard',   path: '/admin',                icon: '⬛' },
  { key: 'members',     label: 'Members',      path: '/admin/members',        icon: '👥' },
  { key: 'offers',      label: 'Offers',       path: '/admin/offers',         icon: '✦'  },
  { key: 'restaurants', label: 'Restaurants',  path: '/admin/restaurants',    icon: '🍽️' },
  { key: 'concierge',   label: 'Concierge',    path: '/admin/concierge',      icon: '💬' },
  { key: 'wallet',      label: 'Wallet',       path: '/admin/wallet',         icon: '💳' },
  { key: 'invites',     label: 'Invites',      path: '/admin/invites',        icon: '✉️' },
]

export default function AdminShell({
  children,
  activeNav,
}: {
  children: React.ReactNode
  activeNav: NavKey
}) {
  const router = useRouter()

  return (
    <div className="adm-layout">
      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-mark">NSL</div>
          <div>
            <div className="adm-brand-name">Signature</div>
            <div className="adm-brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV.map(item => (
            <Link
              key={item.key}
              href={item.path}
              className={`adm-nav-item ${activeNav === item.key ? 'on' : ''}`}
            >
              <span className="adm-nav-ico">{item.icon}</span>
              <span className="adm-nav-lbl">{item.label}</span>
              {activeNav === item.key && <div className="adm-nav-pip" />}
            </Link>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <Link href="/home" className="adm-back-member">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Member App
          </Link>
          <button
            className="adm-logout-btn"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="adm-main">
        {/* Mobile top bar */}
        <div className="adm-topbar">
          <div className="adm-brand-name" style={{ fontSize: 14 }}>NSL Admin</div>
          <div className="adm-topbar-nav">
            {NAV.map(item => (
              <div
                key={item.key}
                className={`adm-topbar-item ${activeNav === item.key ? 'on' : ''}`}
                onClick={() => router.push(item.path)}
              >
                {item.icon}
              </div>
            ))}
            {/* Sign out — mobile only */}
            <div
              className="adm-topbar-item"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/login'
              }}
              title="Sign out"
              style={{ color: 'rgba(255,100,100,.7)' }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="adm-content">
          {children}
        </div>
      </main>
    </div>
  )
}
