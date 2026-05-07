'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DealDetailPage({ params }) {
  const [deal, setDeal] = useState(null)
  const [techniciens, setTechniciens] = useState([])
  const [selectedTech, setSelectedTech] = useState('')
  const [canal, setCanal] = useState('whatsapp')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/deals/${params.id}`).then(r => r.json()).then(setDeal)
    fetch('/api/techniciens').then(r => r.json()).then(setTechniciens)
  }, [params.id])

  async function assign() {
    if (!selectedTech) return
    setSending(true)
    try {
      const res = await fetch(`/api/deals/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicien_id: selectedTech, canal }),
      })
      const data = await res.json()
      setResult(data)
      if (data.notification?.waUrl) {
        window.open(data.notification.waUrl, '_blank')
      }
      setTimeout(() => router.push('/admin/deals'), 3000)
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setSending(false)
    }
  }

  if (!deal) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      Chargement...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/admin/deals')} className="text-gray-400 hover:text-white mr-1">←</button>
        <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-sm">HC</div>
        <div>
          <p className="font-semibold">{deal.client_prenom} {deal.client_nom || 'Client'}</p>
          <p className="text-gray-400 text-xs">{deal.produits?.join(', ') || 'Produits non renseignés'}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Infos client */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Client</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Nom</p>
              <p className="text-white font-medium">{deal.client_prenom} {deal.client_nom || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Téléphone</p>
              <p className="text-white font-medium">{deal.client_telephone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Email</p>
              <p className="text-white font-medium">{deal.client_email || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Adresse</p>
              <p className="text-white font-medium">{deal.client_adresse || '—'}{deal.client_ville ? `, ${deal.client_ville}` : ''}</p>
            </div>
          </div>
        </div>

        {/* Produits */}
        {deal.produits?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Produits vendus</h2>
            <div className="flex flex-wrap gap-2">
              {deal.produits.map(p => (
                <span key={p} className="bg-sky-500/15 text-sky-300 text-sm font-medium px-3 py-1.5 rounded-xl border border-sky-500/20">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Specs techniques */}
        {deal.specs_techniques && Object.keys(deal.specs_techniques).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Specs techniques</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(deal.specs_techniques).map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 text-xs mb-0.5 capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-white font-medium">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finances */}
        {deal.finances && Object.keys(deal.finances).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Finances</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(deal.finances).map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 text-xs mb-0.5 capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-white font-medium">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aides */}
        {deal.aides && Object.keys(deal.aides).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Aides financières</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(deal.aides).map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 text-xs mb-0.5 capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-white font-medium">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dates + réserves */}
        {(deal.date_vente || deal.date_vt_souhaitee || deal.date_chantier_souhaite || deal.reserves) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dates & réserves</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {deal.date_vente && <div><p className="text-gray-500 text-xs mb-0.5">Date de vente</p><p className="text-white font-medium">{new Date(deal.date_vente).toLocaleDateString('fr-FR')}</p></div>}
              {deal.date_vt_souhaitee && <div><p className="text-gray-500 text-xs mb-0.5">Visite technique</p><p className="text-white font-medium">{new Date(deal.date_vt_souhaitee).toLocaleDateString('fr-FR')}</p></div>}
              {deal.date_chantier_souhaite && <div><p className="text-gray-500 text-xs mb-0.5">Chantier souhaité</p><p className="text-white font-medium">{new Date(deal.date_chantier_souhaite).toLocaleDateString('fr-FR')}</p></div>}
              {deal.reserves && <div className="col-span-2"><p className="text-gray-500 text-xs mb-0.5">Réserves</p><p className="text-amber-400 font-medium">{deal.reserves_details || 'Oui'}</p></div>}
            </div>
          </div>
        )}

        {/* Technicien déjà assigné */}
        {deal.technicien && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Technicien assigné</h2>
            <p className="text-white font-semibold">{deal.technicien.nom}</p>
            <p className="text-gray-400 text-sm">{deal.technicien.telephone}</p>
          </div>
        )}

        {/* Assignation */}
        {!result?.ok && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              {deal.technicien_id ? 'Changer de technicien' : 'Assigner un technicien'}
            </h2>
            <div className="space-y-3">
              <select
                value={selectedTech}
                onChange={e => setSelectedTech(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-sky-500"
              >
                <option value="">Choisir un technicien...</option>
                {techniciens.map(t => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {['whatsapp', 'telegram'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCanal(c)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      canal === c
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {c === 'whatsapp' ? '💬 WhatsApp' : '✈️ Telegram'}
                  </button>
                ))}
              </div>
              <button
                onClick={assign}
                disabled={!selectedTech || sending}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all text-base"
              >
                {sending ? 'Envoi...' : `${deal.technicien_id ? 'Réassigner' : 'Assigner'} et envoyer via ${canal === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`}
              </button>
            </div>
          </div>
        )}

        {result?.ok && (
          <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-5 text-center">
            <p className="text-emerald-400 font-semibold text-base">✅ Technicien assigné !</p>
            {result.notification?.waUrl && (
              <a
                href={result.notification.waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-sm text-sky-400 hover:underline"
              >
                Ouvrir WhatsApp si le lien ne s'est pas ouvert →
              </a>
            )}
            <p className="text-gray-400 text-xs mt-2">Redirection dans 3s...</p>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
            Erreur : {result.error}
          </div>
        )}
      </div>
    </div>
  )
}
