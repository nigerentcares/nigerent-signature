export default function ExploreLoading() {
  return (
    <div className="pg" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div className="sk" style={{ width: '100%', height: 50, borderRadius: 16, marginBottom: 16 }} />
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'hidden', marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="sk" style={{ minWidth: 80, height: 34, borderRadius: 20, flexShrink: 0 }} />
          ))}
        </div>
        {/* Dining banner */}
        <div className="sk" style={{ width: '100%', height: 80, borderRadius: 18, marginBottom: 20 }} />
        {/* Featured card */}
        <div className="sk" style={{ width: '100%', height: 200, borderRadius: 20, marginBottom: 20 }} />
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="sk" style={{ height: 140, borderRadius: 18 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
