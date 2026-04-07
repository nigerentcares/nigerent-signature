export default function DiningLoading() {
  return (
    <div className="pg" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div className="sk" style={{ width: 60, height: 10, borderRadius: 6, marginBottom: 8 }} />
        <div className="sk" style={{ width: 130, height: 22, borderRadius: 8, marginBottom: 20 }} />
        {/* Search */}
        <div className="sk" style={{ width: '100%', height: 50, borderRadius: 16, marginBottom: 14 }} />
        {/* Occasion pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'hidden', marginBottom: 20 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="sk" style={{ minWidth: 80, height: 34, borderRadius: 20, flexShrink: 0 }} />
          ))}
        </div>
        {/* Hero card */}
        <div className="sk" style={{ width: '100%', height: 220, borderRadius: 20, marginBottom: 24 }} />
        {/* List */}
        <div className="sk" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 14 }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <div className="sk" style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '60%', height: 13, borderRadius: 6, marginBottom: 8 }} />
              <div className="sk" style={{ width: '40%', height: 10, borderRadius: 6, marginBottom: 10 }} />
              <div className="sk" style={{ width: 80, height: 28, borderRadius: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
