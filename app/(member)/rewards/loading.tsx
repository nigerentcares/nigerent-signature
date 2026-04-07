export default function RewardsLoading() {
  return (
    <div className="pg" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div className="sk" style={{ width: 60, height: 10, borderRadius: 6, marginBottom: 8 }} />
        <div className="sk" style={{ width: 140, height: 22, borderRadius: 8, marginBottom: 20 }} />
        {/* Points card */}
        <div className="sk" style={{ width: '100%', height: 170, borderRadius: 20, marginBottom: 20 }} />
        {/* Tier row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'hidden' }}>
          {[1,2,3].map(i => (
            <div key={i} className="sk" style={{ minWidth: 150, height: 120, borderRadius: 18, flexShrink: 0 }} />
          ))}
        </div>
        {/* Earn grid */}
        <div className="sk" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="sk" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        {/* History list */}
        <div className="sk" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 16 }} />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
            <div className="sk" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '50%', height: 11, borderRadius: 6, marginBottom: 6 }} />
              <div className="sk" style={{ width: '30%', height: 9, borderRadius: 6 }} />
            </div>
            <div className="sk" style={{ width: 50, height: 13, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
