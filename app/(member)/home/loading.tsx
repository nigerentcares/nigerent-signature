export default function HomeLoading() {
  return (
    <div className="pg" style={{ paddingBottom: 80 }}>
      {/* Header skeleton */}
      <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="sk" style={{ width: 80, height: 10, borderRadius: 6, marginBottom: 8 }} />
          <div className="sk" style={{ width: 160, height: 22, borderRadius: 8 }} />
        </div>
        <div className="sk" style={{ width: 40, height: 40, borderRadius: 12 }} />
      </div>
      {/* Wallet card skeleton */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="sk" style={{ width: '100%', height: 160, borderRadius: 20 }} />
      </div>
      {/* Quick actions skeleton */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="sk" style={{ flex: 1, height: 72, borderRadius: 14 }} />
        ))}
      </div>
      {/* List items skeleton */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="sk" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 16 }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <div className="sk" style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '60%', height: 12, borderRadius: 6, marginBottom: 8 }} />
              <div className="sk" style={{ width: '40%', height: 10, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
