import AdminShell from '@/components/admin/AdminShell'

export default function AdminLoading() {
  return (
    <AdminShell activeNav="dashboard">
      <div className="adm-pg-hdr">
        <div>
          <div className="sk" style={{ width: 60, height: 10, borderRadius: 6, marginBottom: 8 }} />
          <div className="sk" style={{ width: 120, height: 22, borderRadius: 8 }} />
        </div>
      </div>
      <div className="adm-stats-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="adm-stat">
            <div className="sk" style={{ width: '100%', height: 80, borderRadius: 12 }} />
          </div>
        ))}
      </div>
      <div className="adm-two-col">
        {[1,2].map(i => (
          <div key={i} className="adm-card">
            <div style={{ padding: 4 }}>
              {[1,2,3,4,5].map(j => (
                <div key={j} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                  <div className="sk" style={{ width: 38, height: 38, borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div className="sk" style={{ width: '55%', height: 11, borderRadius: 6, marginBottom: 6 }} />
                    <div className="sk" style={{ width: '35%', height: 9, borderRadius: 6 }} />
                  </div>
                  <div className="sk" style={{ width: 60, height: 22, borderRadius: 20 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
