'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DealAgent from '@/components/deal/DealAgent'

export default function NewDealPage() {
  const [dealId, setDealId] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'en_cours' }),
    })
      .then(r => r.json())
      .then(deal => setDealId(deal.id))
      .catch(e => setError(e.message))
  }, [])

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-red-400">Erreur : {error}</div>
    </div>
  )

  if (!dealId) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Chargement...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-sm font-bold text-white">HC</div>
          <div>
            <p className="text-white font-semibold text-sm">Nouveau Deal</p>
            <p className="text-gray-400 text-xs">Chloé enregistre votre vente</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
        >
          ✕ Quitter
        </button>
      </div>
      <DealAgent dealId={dealId} onComplete={() => router.push('/admin/deals')} />
    </div>
  )
}
