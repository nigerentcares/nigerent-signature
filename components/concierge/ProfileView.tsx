'use client'

import { useRouter } from 'next/navigation'

// ─── Mock agent profile ───────────────────────────────────────────────────────

const AGENT = {
  name:             'Adaeze Nnadi',
  initials:         'AN',
  email:            'adaeze.nnadi@nsl.com',
  role:             'Senior Concierge Agent',
  shift:            'Morning (07:00 – 15:00)',
  joinedDate:       'March 2024',
  requestsHandled:  142,
  avgResponseTime:  '8 min',
  satisfactionScore: '97%',
}

export default function ProfileView() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="con-page">

      {/* Hero */}
      <div className="con-profile-hero">
        <div
          className="con-av lg"
          style={{ background: 'linear-gradient(135deg, #d4af37, #b8960f)', color: '#1c1c1c' }}
        >
          {AGENT.initials}
        </div>
        <div className="con-profile-name">{AGENT.name}</div>
        <div className="con-profile-role">{AGENT.role}</div>
      </div>

      {/* Stats */}
      <div className="con-profile-grid">
        <div className="con-profile-stat">
          <div className="con-profile-stat-n">{AGENT.requestsHandled}</div>
          <div className="con-profile-stat-l">Handled</div>
        </div>
        <div className="con-profile-stat">
          <div className="con-profile-stat-n" style={{ color: '#1fa3a6' }}>{AGENT.avgResponseTime}</div>
          <div className="con-profile-stat-l">Avg. Response</div>
        </div>
        <div className="con-profile-stat">
          <div className="con-profile-stat-n" style={{ color: '#d4af37' }}>{AGENT.satisfactionScore}</div>
          <div className="con-profile-stat-l">Satisfaction</div>
        </div>
      </div>

      {/* Account info */}
      <div className="con-menu-section">
        <div className="con-menu-section-label">Account</div>

        <div className="con-menu-item" style={{ cursor: 'default' }}>
          <div className="con-menu-ico">📧</div>
          <div style={{ flex: 1 }}>
            <div className="con-menu-label" style={{ fontSize: 13 }}>{AGENT.email}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.35)', marginTop: 2 }}>Email address</div>
          </div>
        </div>

        <div className="con-menu-item" style={{ cursor: 'default' }}>
          <div className="con-menu-ico">🕐</div>
          <div style={{ flex: 1 }}>
            <div className="con-menu-label" style={{ fontSize: 13 }}>{AGENT.shift}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.35)', marginTop: 2 }}>Current shift</div>
          </div>
        </div>

        <div className="con-menu-item" style={{ cursor: 'default' }}>
          <div className="con-menu-ico">📅</div>
          <div style={{ flex: 1 }}>
            <div className="con-menu-label" style={{ fontSize: 13 }}>Since {AGENT.joinedDate}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(230,222,213,.35)', marginTop: 2 }}>Member since</div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="con-menu-section">
        <div className="con-menu-section-label">Settings</div>

        <div className="con-menu-item">
          <div className="con-menu-ico">🔔</div>
          <div className="con-menu-label">Notifications</div>
          <div className="con-menu-arrow">›</div>
        </div>

        <div className="con-menu-item">
          <div className="con-menu-ico">🔒</div>
          <div className="con-menu-label">Change Password</div>
          <div className="con-menu-arrow">›</div>
        </div>

        <div className="con-menu-item">
          <div className="con-menu-ico">📱</div>
          <div className="con-menu-label">App Preferences</div>
          <div className="con-menu-arrow">›</div>
        </div>
      </div>

      {/* Support */}
      <div className="con-menu-section">
        <div className="con-menu-section-label">Support</div>

        <div className="con-menu-item">
          <div className="con-menu-ico">📖</div>
          <div className="con-menu-label">Staff Handbook</div>
          <div className="con-menu-arrow">›</div>
        </div>

        <div className="con-menu-item">
          <div className="con-menu-ico">💬</div>
          <div className="con-menu-label">Contact HR</div>
          <div className="con-menu-arrow">›</div>
        </div>
      </div>

      {/* Logout */}
      <div className="con-menu-section" style={{ paddingBottom: 12 }}>
        <button className="con-menu-item danger" style={{ width: '100%', border: 'none', textAlign: 'left' }} onClick={handleLogout}>
          <div className="con-menu-ico">🚪</div>
          <div className="con-menu-label">Sign Out</div>
        </button>
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '8px 0 12px', fontSize: 10, fontWeight: 600, color: 'rgba(230,222,213,.15)' }}>
        NSL Concierge Portal v2.0
      </div>
    </div>
  )
}
