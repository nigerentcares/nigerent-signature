'use client'
/**
 * RestaurantsClient — interactive restaurants table with add/edit modal.
 */

import { useState, useCallback } from 'react'
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

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setModal('create')} className="adm-btn-primary" style={{ cursor: 'pointer' }}>
          + Add Restaurant
        </button>
      </div>

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
                {restaurants.map(r => (
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
                      <div className="adm-row-actions">
                        <button className="adm-row-btn" onClick={() => setModal(r)} style={{ cursor: 'pointer' }}>Edit</button>
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
