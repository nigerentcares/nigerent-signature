'use client'
/**
 * ProfileView — concierge agent profile, stats, and sign-out.
 */

import { useRouter } from 'next/navigation'

type Profile = {
  id:        string
  name:      string
  email:     string
  role:      string
  lastLogin: string | null
  stats: {
    todayDone:  number
    weekDone:   number
    monthDone:  number
    totalOpen:  number
  }
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:       'Super Admin',
  CONCIERGE_AGENT:   'Concierge Agent',
  OFFERS_MANAGER:    'Offers Manager',
  PARTNER_MANAGER:   'Partner Manager',
  SUPPORT_ADMIN:     'Support Admin',
}

export default function ProfileView({ profile }: { profile: Profile }) {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="con-page">

      {/* Header */}
      <div className="con-page-hdr">
        <div>
          <div className="con-page-title">Profile</div>
          <div className="con-page-sub">Agent dashboard</div>
        </div>
      </div>

      {/* Agent card */}
      <div className="con-info-card" style={{ marginBottom: 12 }}>
        <div className="con-member-row" style={{ marginBottom: 16 }}>
          <div className="con-av" style={{ width: 56, height: 56, fontSize: 22, borderRadius: 16 }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="con-member-info">
            <div className="con-member-name" style={{ fontSize: 17 }}>{profile.name}</div>
            <div className="con-member-email">{profile.email}</div>
          </div>
        </div>

        <div className="con-kv-list">
          <div className="con-kv">
            <span className="con-kv-k">Role</span>
            <span className="con-kv-v">{ROLE_LABEL[profile.role] ?? profile.role}</span>
          </div>
          {profile.lastLogin && (
            <div className="con-kv">
              <span className="con-kv-k">Last login</span>
              <span className="con-kv-v">
                {new Date(profile.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Activity stats */}
      <div className="con-stats-section">
        <div className="con-info-label" style={{ padding: '0 16px 10px' }}>Activity</div>

        <div className="con-stat-cards">
          <div className="con-stat-card">
            <div className="con-stat-card-n">{profile.stats.todayDone}</div>
            <div className="con-stat-card-l">Resolved Today</div>
          </div>
          <div className="con-stat-card">
            <div className="con-stat-card-n" style={{ color: '#1fa3a6' }}>{profile.stats.weekDone}</div>
            <div className="con-stat-card-l">This Week</div>
          </div>
          <div className="con-stat-card">
            <div className="con-stat-card-n" style={{ color: '#d4af37' }}>{profile.stats.monthDone}</div>
            <div className="con-stat-card-l">This Month</div>
          </div>
          <div className="con-stat-card">
            <div className="con-stat-card-n" style={{ color: '#e74c3c' }}>{profile.stats.totalOpen}</div>
            <div className="con-stat-card-l">Open Now</div>
          </div>
        </div>
      </div>

      {/* NSL branding */}
      <div className="con-profile-brand">
        <div className="con-brand-mark" style={{ width: 44, height: 44, fontSize: 13, borderRadius: 13, margin: '0 auto 10px' }}>NSL</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(230,222,213,.7)', marginBottom: 4 }}>Nigerent Signature</div>
        <div style={{ fontSize: 10, color: 'rgba(230,222,213,.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Concierge Portal</div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 16px 32px' }}>
        <button className="con-signout-btn" onClick={handleSignOut}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}
