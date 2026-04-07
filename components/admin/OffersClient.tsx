'use client'
/**
 * OffersClient — interactive offers table with create/edit modal.
 * Hydrates from server-fetched props, then refreshes client-side after saves.
 */

import { useState, useCallback } from 'react'
import OfferModal from './OfferModal'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:   { bg: 'rgba(31,163,166,.1)',  color: 'var(--teal)'  },
  DRAFT:    { bg: 'rgba(245,166,35,.08)', color: '#d4870f'      },
  PAUSED:   { bg: 'rgba(201,206,214,.08)', color: 'rgba(201,206,214,.4)' },
  EXPIRED:  { bg: '#f5f2ef',              color: 'var(--muted)' },
  ARCHIVED: { bg: 'rgba(201,206,214,.05)', color: 'rgba(201,206,214,.3)' },
}

const CAT_ICONS: Record<string, string> = {
  DINING: '🍽️', WELLNESS: '🧖', NIGHTLIFE: '🥂', EVENTS: '🌇',
  TRANSPORT: '🚗', SHOPPING: '🛍️', STAYS: '🏠', SERVICES: '✂️',
}

interface Partner { id: string; name: string; category: string }

interface Offer {
  id: string
  title: string
  shortDesc: string
  description: string
  category: string
  city: string
  area: string | null
  tierEligibility: string[]
  pointsEligible: boolean
  pointsAward: number | null
  redemptionType: string
  redemptionCode: string | null
  redemptionSteps: unknown
  termsConditions: string | null
  imageUrl: string | null
  validFrom: string
  validTo: string | null
  status: string
  isFeatured: boolean
  displayOrder: number | null
  partnerId: string
  partner: { name: string }
}

interface Props {
  initialOffers: Offer[]
  initialPartners: Partner[]
}

export default function OffersClient({ initialOffers, initialPartners }: Props) {
  const [offers, setOffers]     = useState(initialOffers)
  const [partners]              = useState(initialPartners)
  const [modal, setModal]       = useState<'create' | Offer | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const active = offers.filter(o => o.status === 'ACTIVE').length
  const draft  = offers.filter(o => o.status === 'DRAFT').length

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/offers')
      if (r.ok) {
        const d = await r.json()
        setOffers(d.offers)
      }
    } catch { /* ignore */ }
  }, [])

  function handleSaved() {
    setModal(null)
    refresh()
  }

  async function toggleStatus(offer: Offer) {
    setToggling(offer.id)
    const newStatus = offer.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE'
    await fetch(`/api/admin/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setToggling(null)
    refresh()
  }

  return (
    <>
      {/* Stats */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{offers.length}</div>
          <div className="adm-mini-lbl">Total Offers</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: 'var(--teal)' }}>{active}</div>
          <div className="adm-mini-lbl">Active</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val" style={{ color: '#d4870f' }}>{draft}</div>
          <div className="adm-mini-lbl">Drafts</div>
        </div>
      </div>

      {/* New Offer button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setModal('create')}
          className="adm-btn-primary"
          style={{ cursor: 'pointer' }}
        >
          + New Offer
        </button>
      </div>

      {/* Table */}
      <div className="adm-card">
        {offers.length === 0 ? (
          <div className="adm-offer-empty">
            <div className="adm-offer-empty-ico">✦</div>
            <div className="adm-offer-empty-title">No offers yet</div>
            <div className="adm-offer-empty-sub">Create your first partner offer to get started.</div>
            <button onClick={() => setModal('create')} className="adm-btn-primary" style={{ display: 'inline-block', marginTop: 16, cursor: 'pointer' }}>
              + Create First Offer
            </button>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Partner</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {offers.map(o => {
                  const ss = STATUS_STYLE[o.status] ?? STATUS_STYLE.DRAFT
                  const isToggling = toggling === o.id
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="adm-cell-name">{o.title}</div>
                        <div className="adm-cell-sub">{o.shortDesc}</div>
                      </td>
                      <td className="adm-cell-name">{o.partner.name}</td>
                      <td>
                        <div className="adm-cat-cell">
                          <span>{CAT_ICONS[o.category] ?? '✦'}</span>
                          <span className="adm-cell-sub">{o.category}</span>
                        </div>
                      </td>
                      <td className="adm-cell-sub">{o.tierEligibility.join(', ')}</td>
                      <td className="adm-cell-sub">
                        {o.validTo ? new Date(o.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Ongoing'}
                      </td>
                      <td>
                        <div className="adm-status" style={{ background: ss.bg, color: ss.color }}>{o.status}</div>
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <button
                            className="adm-row-btn"
                            onClick={() => setModal(o)}
                            style={{ cursor: 'pointer' }}
                          >Edit</button>
                          <button
                            className="adm-row-btn"
                            disabled={isToggling}
                            onClick={() => toggleStatus(o)}
                            style={{ cursor: isToggling ? 'wait' : 'pointer', opacity: isToggling ? 0.5 : 1 }}
                          >
                            {isToggling ? '…' : o.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <OfferModal
          offer={modal === 'create' ? undefined : {
            ...modal,
            area: modal.area ?? '',
            redemptionCode: modal.redemptionCode ?? '',
            redemptionSteps: Array.isArray(modal.redemptionSteps) ? modal.redemptionSteps as string[] : [],
            termsConditions: modal.termsConditions ?? '',
            imageUrl: modal.imageUrl ?? '',
            validFrom: modal.validFrom ? modal.validFrom.split('T')[0] : '',
            validTo: modal.validTo ? modal.validTo.split('T')[0] : '',
            status: modal.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
            redemptionType: modal.redemptionType as 'SHOW_ON_SCREEN' | 'CODE' | 'CONCIERGE_CONFIRM',
            category: modal.category as 'DINING' | 'WELLNESS' | 'NIGHTLIFE' | 'EVENTS' | 'TRANSPORT' | 'SHOPPING' | 'STAYS' | 'SERVICES',
          }}
          partners={partners}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
