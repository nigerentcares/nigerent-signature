export default function WalletLoading() {
  return (
    <div className="pg" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div className="sk" style={{ width: 60, height: 10, borderRadius: 6, marginBottom: 8 }} />
        <div className="sk" style={{ width: 120, height: 22, borderRadius: 8, marginBottom: 20 }} />
        <div className="sk" style={{ width: '100%', height: 170, borderRadius: 20, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div className="sk" style={{ flex: 1, height: 48, borderRadius: 14 }} />
          <div className="sk" style={{ flex: 1, height: 48, borderRadius: 14 }} />
        </div>
        <div className="sk" style={{ width: 140, height: 12, borderRadius: 6, marginBottom: 16 }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '55%', height: 12, borderRadius: 6, marginBottom: 6 }} />
              <div className="sk" style={{ width: '35%', height: 10, borderRadius: 6 }} />
            </div>
            <div className="sk" style={{ width: 60, height: 14, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
