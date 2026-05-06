'use client'

import { useState, useEffect } from 'react'

const STATUS_MAP = {
  en_cours: { label: 'En cours', class: 'badge-info' },
  terminee: { label: 'Terminée', class: 'badge-success' },
  reserves: { label: 'Réserves', class: 'badge-warning' },
  annulee: { label: 'Annulée', class: 'badge-danger' },
}

const TYPE_ICONS = {
  PAC: '❄️',
  ballon_thermodynamique: '💧',
  photovoltaique: '☀️',
  autre: '🔧',
}

export default function InterventionTable() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetch('/api/interventions')
      .then(r => r.json())
      .then(data => { setInterventions(data); setLoading(false) })
  }, [])

  function copyLink(id) {
    const url = `${window.location.origin}/intervention/${id}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter === 'all' ? interventions : interventions.filter(i => i.statut === filter)

  if (loading) return <div className="text-gray-500 text-sm">Chargement...</div>

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Interventions</h2>
        <div className="flex gap-2">
          {['all', 'en_cours', 'terminee', 'reserves'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {f === 'all' ? 'Toutes' : STATUS_MAP[f]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b border-gray-800">
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Client</th>
              <th className="pb-2 pr-4 font-medium">Technicien</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Statut</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">Aucune intervention</td></tr>
            )}
            {filtered.map(intervention => (
              <tr key={intervention.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-4">
                  <span className="mr-1">{TYPE_ICONS[intervention.type_chantier] || '🔧'}</span>
                  <span className="text-gray-300">{intervention.type_chantier}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="text-white font-medium">{intervention.client_nom}</div>
                  <div className="text-gray-500 text-xs">{intervention.adresse?.substring(0, 30)}...</div>
                </td>
                <td className="py-3 pr-4 text-gray-300">{intervention.technicien}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">
                  {new Date(intervention.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="py-3 pr-4">
                  <span className={`badge ${STATUS_MAP[intervention.statut]?.class || 'badge-info'}`}>
                    {STATUS_MAP[intervention.statut]?.label || intervention.statut}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => copyLink(intervention.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${copied === intervention.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    {copied === intervention.id ? '✓ Copié' : '📋 Lien SMS'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
