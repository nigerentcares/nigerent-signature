'use client'
/**
 * PartnersClient — full partner directory management.
 * Search, filter, create, edit, toggle active/inactive.
 */

import { useState, useMemo, FormEvent } from 'react'

interface Partner {
  id:          string
  name:        string
  category:    string
  city:        string
  area:        string | null
  description: string | null
  imageUrl:    string | null
  isActive:    boolean
  offerCount:  number
  createdAt:   string
  contactInfo: Record<string, string> | null
}

const CATEGORIES = [
  'Restaurant', 'Wellness & Spa', 'Arts & Culture', 'Entertainment',
  'Nature & Adventure', 'Nightlife', 'Supermarket', 'Pharmacy',
  'Hospital & Medical', 'Transport', 'Hotel', 'Other',
]

const CAT_EMOJI: Record<string, string> = {
  'Restaurant': '🍽️', 'Wellness & Spa': '🧖', 'Arts & Culture': '🎭',
  'Entertainment': '🎬', 'Nature & Adventure': '🌿', 'Nightlife': '🥂',
  'Supermarket': '🛒', 'Pharmacy': '💊', 'Hospital & Medical': '🏥',
  'Transport': '🚗', 'Hotel': '🏨', 'Other': '🏢',
}

const EMPTY_FORM = {
  name: '', category: 'Restaurant', city: 'Lagos', area: '',
  description: '', imageUrl: '', phone: '', email: '', website: '', address: '',
}

export default function PartnersClient({ partners: initial }: { partners: Partner[] }) {
  const [partners,   setPartners]   = useState<Partner[]>(initial)
  const [query,      setQuery]      = useState('')
  const [catFilter,  setCatFilter]  = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<'All' | 'Lagos' | 'Abuja'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Partner | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [busy,       setBusy]       = useState(false)
  const [err,        setErr]        = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return partners.filter(p => {
      if (catFilter  && p.category !== catFilter) return false
      if (cityFilter !== 'All' && p.city !== cityFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.area ?? '').toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      )
    })
  }, [partners, query, catFilter, cityFilter])

  const active   = filtered.filter(p => p.isActive)
  const inactive = filtered.filter(p => !p.isActive)

  function openCreate() {
    setForm(EMPTY_FORM); setErr(''); setEditing(null); setShowCreate(true)
  }
  function openEdit(p: Partner) {
    const ci = p.contactInfo ?? {}
    setForm({
      name: p.name, category: p.category, city: p.city, area: p.area ?? '',
      description: p.description ?? '', imageUrl: p.imageUrl ?? '',
      phone: ci.phone ?? '', email: ci.email ?? '',
      website: ci.website ?? '', address: ci.address ?? '',
    })
    setErr(''); setEditing(p); setShowCreate(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    const payload = {
      name: form.name.trim(), category: form.category, city: form.city,
      area: form.area.trim() || undefined, description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      contactInfo: {
        phone:   form.phone.trim()   || undefined,
        email:   form.email.trim()   || undefined,
        website: form.website.trim() || undefined,
        address: form.address.trim() || undefined,
      },
    }
    try {
      const url    = editing ? `/api/admin/partners/${editing.id}` : '/api/admin/partners'
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed.'); return }

      if (editing) {
        setPartners(ps => ps.map(p => p.id === editing.id ? { ...p, ...payload, contactInfo: payload.contactInfo as Record<string,string>, offerCount: p.offerCount } : p))
      } else {
        setPartners(ps => [{ ...data.partner, offerCount: 0, createdAt: new Date().toISOString() }, ...ps])
      }
      setShowCreate(false)
    } catch { setErr('Network error.') }
    finally { setBusy(false) }
  }

  async function toggleActive(p: Partner) {
    const res = await fetch(`/api/admin/partners/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    if (res.ok) setPartners(ps => ps.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,206,214,.15)',
    color: '#fff', fontFamily: 'Urbanist, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block',
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search partners…"
          style={{ ...inp, maxWidth: 280 }}
        />
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value as 'All'|'Lagos'|'Abuja')} style={{ ...inp, maxWidth: 140, color: cityFilter === 'All' ? 'rgba(201,206,214,.5)' : '#fff' }}>
          <option value="All">All Cities</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja</option>
        </select>
        <select value={catFilter ?? ''} onChange={e => setCatFilter(e.target.value || null)} style={{ ...inp, maxWidth: 180, color: catFilter ? '#fff' : 'rgba(201,206,214,.5)' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'rgba(201,206,214,.4)', whiteSpace: 'nowrap' }}>{filtered.length} partner{filtered.length !== 1 ? 's' : ''}</div>
        <button onClick={openCreate} className="adm-btn-primary">+ New Partner</button>
      </div>

      {/* ── Partner Table ── */}
      {filtered.length === 0 ? (
        <div className="adm-empty" style={{ padding: '40px 0', textAlign: 'center' }}>No partners found.</div>
      ) : (
        <>
          {[{ label: 'Active', list: active }, { label: 'Inactive', list: inactive }].map(({ label, list }) =>
            list.length === 0 ? null : (
              <div key={label} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,206,214,.35)', marginBottom: 10 }}>{label}</div>
                <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(201,206,214,.06)' }}>
                        {['Partner', 'Category', 'City / Area', 'Offers', 'Status', ''].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: i < list.length - 1 ? '1px solid rgba(201,206,214,.04)' : 'none' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(31,163,166,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                                {CAT_EMOJI[p.category] ?? '🏢'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'rgba(201,206,214,.9)' }}>{p.name}</div>
                                {p.description && <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)', marginTop: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'rgba(201,206,214,.6)' }}>{p.category}</td>
                          <td style={{ padding: '12px 14px', color: 'rgba(201,206,214,.6)' }}>{p.city}{p.area ? ` · ${p.area}` : ''}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: 'rgba(31,163,166,.1)', color: '#1fa3a6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{p.offerCount}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: p.isActive ? 'rgba(30,168,106,.1)' : 'rgba(201,206,214,.07)', color: p.isActive ? '#1ea86a' : 'rgba(201,206,214,.35)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openEdit(p)} className="adm-btn-outline" style={{ padding: '4px 10px', fontSize: 11 }}>Edit</button>
                              <button onClick={() => toggleActive(p)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(201,206,214,.12)', background: 'transparent', color: p.isActive ? 'rgba(231,76,60,.7)' : '#1ea86a', cursor: 'pointer', fontFamily: 'Urbanist,sans-serif', fontWeight: 700 }}>
                                {p.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ background: '#16202a', border: '1px solid rgba(201,206,214,.1)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{editing ? 'Edit Partner' : 'New Partner'}</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(201,206,214,.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Partner Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={inp} placeholder="e.g. Four Points Spa" />
                </div>
                <div>
                  <label style={lbl}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>City *</label>
                  <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                    {['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Area / Neighbourhood</label>
                  <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} style={inp} placeholder="e.g. Victoria Island" />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} placeholder="+234…" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} placeholder="partner@example.com" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Website</label>
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={inp} placeholder="https://…" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inp} placeholder="Full address" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Short description of this partner" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Image URL</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} style={inp} placeholder="https://…" />
                </div>
              </div>

              {err && <div style={{ padding: '8px 12px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 8, fontSize: 12, color: 'rgba(255,110,110,.9)', marginBottom: 14 }}>{err}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.1)', color: 'rgba(201,206,214,.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist,sans-serif' }}>Cancel</button>
                <button type="submit" disabled={busy} style={{ flex: 2, padding: '11px', borderRadius: 10, background: busy ? 'rgba(31,163,166,.4)' : '#1fa3a6', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist,sans-serif' }}>
                  {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
