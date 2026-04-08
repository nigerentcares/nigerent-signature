'use client'
/**
 * OffersClient — interactive offers table with create/edit modal.
 * Hydrates from server-fetched props, then refreshes client-side after saves.
 */

import { useState, useCallback, useMemo } from 'react'
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

const STATUS_FILTERS = ['All', 'ACTIVE', 'DRAFT', 'PAUSED', 'ARCHIVED'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

export default function OffersClient({ initialOffers, initialPartners }: Props) {
  const [offers, setOffers]         = useState(initialOffers)
  const [partners]                  = useState(initialPartners)
  const [modal, setModal]           = useState<'create' | Offer | null>(null)
  const [toggling, setToggling]     = useState<string | null>(null)
  const [query, setQuery]           = useState('')
  const [statusFilter, setStatus]   = useState<StatusFilter>('All')

  const active = offers.filter(o => o.status === 'ACTIVE').length
  const draft  = offers.filter(o => o.status === 'DRAFT').length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return offers.filter(o => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false
      if (!q) return true
      return (
        o.title.toLowerCase().includes(q)        ||
        o.shortDesc.toLowerCase().includes(q)    ||
        o.partner.name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q)     ||
        (o.area ?? '').toLowerCase().includes(q)
      )
    })
  }, [offers, query, statusFilter])

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

      {/* Search + status filter bar */}
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
            placeholder="Search by title, partner, category…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 13, fontFamily: 'Urbanist, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
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
            >{s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>
        <button onClick={() => setModal('create')} className="adm-btn-primary" style={{ cursor: 'pointer', flexShrink: 0 }}>
          + New Offer
        </button>
      </div>

      {(query || statusFilter !== 'All') && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>
          {filtered.length} offer{filtered.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ''}
          {statusFilter !== 'All' ? ` · ${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}` : ''}
        </div>
      )}

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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'rgba(201,206,214,.3)', fontSize: 13 }}>
                      No offers match your search.
                    </td>
                  </tr>
                )}
                {filtered.map(o => {
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
