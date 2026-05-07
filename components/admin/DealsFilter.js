'use client'

import { useState } from 'react'
import Link from 'next/link'

const STATUTS = ['tous', 'nouveau', 'en_cours', 'complet', 'assigné', 'terminé']
const STATUT_COLORS = {
  nouveau: 'bg-gray-500/20 text-gray-400',
  en_cours: 'bg-yellow-500/20 text-yellow-400',
  complet: 'bg-blue-500/20 text-blue-400',
  'assigné': 'bg-sky-500/20 text-sky-400',
  intervention_en_cours: 'bg-amber-500/20 text-amber-400',
  'pv_signé': 'bg-purple-500/20 text-purple-400',
  'terminé': 'bg-emerald-500/20 text-emerald-400',
}

export default function DealsFilter({ deals }) {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('tous')

  const filtered = deals.filter(d => {
    const matchSearch = !search || [
      d.client_nom, d.client_prenom, d.commercial_nom, d.client_ville
    ].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchStatut = statut === 'tous' || d.statut === statut
    return matchSearch && matchStatut
  })

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, commercial, ville..."
          className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setStatut(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize ${
                statut === s
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {s} {s === 'tous' && `(${deals.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p>Aucun deal trouvé</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-sky-400 hover:underline text-sm mt-2 block mx-auto"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(deal => (
            <Link
              key={deal.id}
              href={`/admin/deals/${deal.id}`}
              className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white truncate">
                      {(deal.client_prenom || deal.client_nom)
                        ? `${deal.client_prenom || ''} ${deal.client_nom || ''}`.trim()
                        : `Deal du ${new Date(deal.created_at).toLocaleDateString('fr-FR')} — en cours`}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUT_COLORS[deal.statut] || STATUT_COLORS.nouveau}`}>
                      {deal.statut}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {deal.client_adresse}{deal.client_ville ? `, ${deal.client_ville}` : ''}
                  </p>
                  {deal.commercial_nom && (
                    <p className="text-gray-500 text-xs mt-0.5">Commercial : {deal.commercial_nom}</p>
                  )}
                  {deal.produits?.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {deal.produits.map(p => (
                        <span key={p} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-lg">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {deal.technicien && (
                    <p className="text-sm text-sky-400 font-medium">{deal.technicien.nom}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(deal.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
