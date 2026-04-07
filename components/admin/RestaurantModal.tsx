'use client'
/**
 * RestaurantModal — create / edit a restaurant.
 * Used by /admin/restaurants page.
 */

import { useState, useEffect, FormEvent } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const AMBIANCE_OPTIONS = ['Fine Dining', 'Casual', 'Rooftop', 'Bar', 'Live Music', 'Outdoor', 'Private Dining', 'Waterfront', 'Lounge', 'Family Friendly']

interface RestaurantData {
  id?: string
  name: string
  cuisine: string
  city: string
  area: string
  description: string
  imageUrls: string[]
  ambianceTags: string[]
  memberBenefit: string
  priceLevel: number
  openingHours: Record<string, string>
  reservationNotes: string
  mapLink: string
  isActive: boolean
  isFeatured: boolean
}

const EMPTY: RestaurantData = {
  name: '', cuisine: '', city: 'Lagos', area: '', description: '',
  imageUrls: [], ambianceTags: [], memberBenefit: '', priceLevel: 2,
  openingHours: {}, reservationNotes: '', mapLink: '',
  isActive: true, isFeatured: false,
}

interface Props {
  restaurant?: RestaurantData & { id: string }
  onClose: () => void
  onSaved: () => void
}

export default function RestaurantModal({ restaurant, onClose, onSaved }: Props) {
  const isEdit = !!restaurant?.id
  const [form, setForm] = useState<RestaurantData>(restaurant ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [imgDraft, setImgDraft] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof RestaurantData>(key: K, val: RestaurantData[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleAmbiance(tag: string) {
    setForm(f => ({
      ...f,
      ambianceTags: f.ambianceTags.includes(tag)
        ? f.ambianceTags.filter(t => t !== tag)
        : [...f.ambianceTags, tag],
    }))
  }

  function setHours(day: string, val: string) {
    setForm(f => ({ ...f, openingHours: { ...f.openingHours, [day]: val } }))
  }

  function addImage() {
    const url = imgDraft.trim()
    if (!url) return
    setForm(f => ({ ...f, imageUrls: [...f.imageUrls, url] }))
    setImgDraft('')
  }

  function removeImage(i: number) {
    setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const url    = isEdit ? `/api/admin/restaurants/${restaurant!.id}` : '/api/admin/restaurants'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mapLink: form.mapLink || null,
          description: form.description || null,
          memberBenefit: form.memberBenefit || null,
          reservationNotes: form.reservationNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Error saving restaurant.'); return }
      onSaved()
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '24px 12px', overflowY: 'auto',
  }
  const sheet: React.CSSProperties = {
    background: '#111e1e', border: '1px solid rgba(31,163,166,.18)',
    borderRadius: 20, width: '100%', maxWidth: 620,
    padding: '28px 28px 32px', position: 'relative',
  }
  const label: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(201,206,214,.4)', marginBottom: 6, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(201,206,214,.12)', borderRadius: 10,
    padding: '10px 14px', color: 'var(--cream)', fontSize: 13,
    fontFamily: 'Urbanist, sans-serif', outline: 'none',
  }
  const row: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: active ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.12)',
    background: active ? 'rgba(31,163,166,.12)' : 'transparent',
    color: active ? 'var(--teal)' : 'rgba(201,206,214,.4)',
    transition: 'all .15s',
  })

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={sheet}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 4 }}>
              {isEdit ? 'Edit Restaurant' : 'New Restaurant'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cream)' }}>
              {isEdit ? form.name || 'Edit Restaurant' : 'Add Restaurant'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(201,206,214,.07)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'rgba(201,206,214,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Name + Cuisine */}
          <div style={row}>
            <div>
              <label style={label}>Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Restaurant name" style={inputStyle} required />
            </div>
            <div>
              <label style={label}>Cuisine *</label>
              <input value={form.cuisine} onChange={e => set('cuisine', e.target.value)} placeholder="e.g. Nigerian, Continental" style={inputStyle} required />
            </div>
          </div>

          {/* City + Area */}
          <div style={{ ...row, marginTop: 16 }}>
            <div>
              <label style={label}>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={label}>Area *</label>
              <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Victoria Island" style={inputStyle} required />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Description</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Restaurant overview…" rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Member benefit */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Member Benefit</label>
            <input value={form.memberBenefit} onChange={e => set('memberBenefit', e.target.value)} placeholder="e.g. Priority reservations + complimentary welcome drink" style={inputStyle} />
          </div>

          {/* Price level */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Price Level</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} type="button" onClick={() => set('priceLevel', n)} style={{ ...pill(form.priceLevel === n), padding: '7px 18px' }}>
                  {'₦'.repeat(n)}
                </button>
              ))}
            </div>
          </div>

          {/* Ambiance tags */}
          <div style={{ marginTop: 20 }}>
            <label style={label}>Ambiance Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AMBIANCE_OPTIONS.map(tag => (
                <button key={tag} type="button" style={pill(form.ambianceTags.includes(tag))} onClick={() => toggleAmbiance(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Opening hours */}
          <div style={{ marginTop: 20 }}>
            <label style={label}>Opening Hours</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.35)', width: 30 }}>{day}</span>
                  <input
                    value={form.openingHours[day] ?? ''}
                    onChange={e => setHours(day, e.target.value)}
                    placeholder="12:00–22:00 or Closed"
                    style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image URLs */}
          <div style={{ marginTop: 20 }}>
            <label style={label}>Image URLs</label>
            {form.imageUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 11, color: 'rgba(201,206,214,.5)', background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '7px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
                <button type="button" onClick={() => removeImage(i)} style={{ background: 'rgba(255,80,80,.1)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,110,110,.8)', fontSize: 14 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={imgDraft} onChange={e => setImgDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }} placeholder="https://…" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={addImage} style={{ background: 'rgba(31,163,166,.12)', border: '1px solid rgba(31,163,166,.25)', borderRadius: 10, padding: '0 14px', color: 'var(--teal)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
            </div>
          </div>

          {/* Reservation notes + Map link */}
          <div style={{ ...row, marginTop: 16 }}>
            <div>
              <label style={label}>Reservation Notes</label>
              <textarea value={form.reservationNotes} onChange={e => set('reservationNotes', e.target.value)} placeholder="e.g. Book 24h in advance" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={label}>Map Link</label>
              <input value={form.mapLink} onChange={e => set('mapLink', e.target.value)} placeholder="https://maps.google.com/…" style={inputStyle} />
            </div>
          </div>

          {/* Active + Featured */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
            {([['isActive', 'Active / Visible'] as const, ['isFeatured', 'Featured on dining page'] as const]).map(([key, label2]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => set(key, !form[key])} style={{ width: 20, height: 20, borderRadius: 6, border: form[key] ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.2)', background: form[key] ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
                  {form[key] && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(201,206,214,.7)' }}>{label2}</span>
              </label>
            ))}
          </div>

          {err && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,110,110,.9)' }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.12)', color: 'rgba(201,206,214,.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ flex: 2, padding: '13px', borderRadius: 12, background: busy ? 'rgba(31,163,166,.4)' : 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'background .2s' }}>
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
