'use client'
/**
 * RestaurantsClient — interactive restaurants table with add/edit modal.
 */

import { useState, useCallback, useMemo } from 'react'
import RestaurantModal from './RestaurantModal'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  city: string
  area: string
  description: string | null
  imageUrls: string[]
  ambianceTags: string[]
  memberBenefit: string | null
  priceLevel: number
  openingHours: Record<string, string>
  reservationNotes: string | null
  mapLink: string | null
  isActive: boolean
  isFeatured: boolean
  _count: { diningRequests: number }
}

interface Props {
  initialRestaurants: Restaurant[]
}

const PRICE = ['', '₦', '₦₦', '₦₦₦', '₦₦₦₦']

export default function RestaurantsClient({ initialRestaurants }: Props) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [modal, setModal]             = useState<'create' | Restaurant | null>(null)
  const [query, setQuery]             = useState('')
  const [statusFilter, setStatus]     = useState<'All' | 'Active' | 'Inactive'>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return restaurants.filter(r => {
      if (statusFilter === 'Active'   && !r.isActive) return false
      if (statusFilter === 'Inactive' &&  r.isActive) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q)    ||
        r.cuisine.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)    ||
        r.city.toLowerCase().includes(q)    ||
        r.ambianceTags.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [restaurants, query, statusFilter])

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/restaurants')
      if (r.ok) {
        const d = await r.json()
        setRestaurants(d.restaurants)
      }
    } catch { /* ignore */ }
  }, [])

  function handleSaved() {
    setModal(null)
    refresh()
  }

  async function handleDelete(r: Restaurant) {
    const msg = r._count.diningRequests > 0
      ? `"${r.name}" has ${r._count.diningRequests} linked booking(s). It will be deactivated instead of permanently deleted.\n\nProceed?`
      : `Permanently delete "${r.name}"?\n\nThis cannot be undone.`
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}`, { method: 'DELETE' })
      if (res.ok) refresh()
    } catch { /* ignore */ }
  }

  const active   = restaurants.filter(r => r.isActive).length
  const featured = restaurants.filter(r => r.isFeatured).length

  return (
    <>
      {/* Stats */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{restaurants.length}</div>
          <div className="adm-mini-lbl">Total</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--teal)' }}>{active}</div>
          <div className="adm-mini-lbl">Active</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--gold)' }}>{featured}</div>
          <div className="adm-mini-lbl">Featured</div>
        </div>
      </div>

      {/* Search + status filter + add button */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="adm-search-bar" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="11" cy="11" r="8" stroke="var(--muted)" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, cuisine, area…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 13, fontFamily: 'Urbanist, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {(['All', 'Active', 'Inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                fontFamily: 'Urbanist, sans-serif', cursor: 'pointer', transition: 'all .15s',
                background: statusFilter === s ? 'rgba(31,163,166,.18)' : 'rgba(201,206,214,.06)',
                border: statusFilter === s ? '1px solid rgba(31,163,166,.35)' : '1px solid rgba(201,206,214,.1)',
                color: statusFilter === s ? 'var(--teal)' : 'rgba(201,206,214,.5)',
              }}
            >{s}</button>
          ))}
        </div>
        <button onClick={() => setModal('create')} className="adm-btn-primary" style={{ cursor: 'pointer', flexShrink: 0 }}>
          + Add Restaurant
        </button>
      </div>

      {(query || statusFilter !== 'All') && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ''}
          {statusFilter !== 'All' ? ` · ${statusFilter}` : ''}
        </div>
      )}

      {/* Table */}
      <div className="adm-card">
        {restaurants.length === 0 ? (
          <div className="adm-offer-empty">
            <div className="adm-offer-empty-ico">🍽️</div>
            <div className="adm-offer-empty-title">No restaurants yet</div>
            <div className="adm-offer-empty-sub">Add your first dining partner to enable reservations.</div>
            <button onClick={() => setModal('create')} className="adm-btn-primary" style={{ display: 'inline-block', marginTop: 16, cursor: 'pointer' }}>
              + Add First Restaurant
            </button>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Cuisine</th>
                  <th>Area</th>
                  <th>Price</th>
                  <th>Reservations</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'rgba(201,206,214,.3)', fontSize: 13 }}>
                      No restaurants match your search.
                    </td>
                  </tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="adm-cell-name">{r.name}</div>
                      {r.memberBenefit && <div className="adm-cell-sub" style={{ color: 'rgba(31,163,166,.7)' }}>{r.memberBenefit.slice(0, 50)}{r.memberBenefit.length > 50 ? '…' : ''}</div>}
                    </td>
                    <td className="adm-cell-sub">{r.cuisine}</td>
                    <td className="adm-cell-sub">{r.area}, {r.city}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>{PRICE[r.priceLevel] ?? '₦₦'}</span>
                    </td>
                    <td className="adm-cell-num">{r._count.diningRequests}</td>
                    <td>
                      <div className="adm-row-actions">
                        {r.isFeatured && (
                          <div className="adm-status" style={{ background: 'rgba(212,175,55,.1)', color: 'var(--gold)' }}>Featured</div>
                        )}
                        <div className="adm-status" style={{ background: r.isActive ? 'rgba(31,163,166,.1)' : 'rgba(201,206,214,.07)', color: r.isActive ? 'var(--teal)' : 'rgba(201,206,214,.35)' }}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="adm-row-actions" style={{ gap: 6 }}>
                        <button className="adm-row-btn" onClick={() => setModal(r)} style={{ cursor: 'pointer' }}>Edit</button>
                        <button
                          className="adm-row-btn"
                          onClick={() => handleDelete(r)}
                          style={{ cursor: 'pointer', color: '#ff7070', borderColor: 'rgba(255,80,80,.2)', background: 'rgba(255,80,80,.06)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <RestaurantModal
          restaurant={modal === 'create' ? undefined : {
            ...modal,
            description: modal.description ?? '',
            memberBenefit: modal.memberBenefit ?? '',
            reservationNotes: modal.reservationNotes ?? '',
            mapLink: modal.mapLink ?? '',
            openingHours: modal.openingHours as Record<string, string>,
          }}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
