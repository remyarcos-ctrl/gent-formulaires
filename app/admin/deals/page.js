import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUT_COLORS = {
  nouveau: 'bg-gray-500/20 text-gray-400',
  en_cours: 'bg-yellow-500/20 text-yellow-400',
  complet: 'bg-blue-500/20 text-blue-400',
  'assigné': 'bg-sky-500/20 text-sky-400',
  intervention_en_cours: 'bg-amber-500/20 text-amber-400',
  'pv_signé': 'bg-purple-500/20 text-purple-400',
  'terminé': 'bg-emerald-500/20 text-emerald-400',
}

export default async function AdminDealsPage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')
  if (!auth || auth.value !== 'authenticated') redirect('/admin/login')

  const deals = await prisma.deal.findMany({
    include: { technicien: true },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-sm">HC</div>
          <div>
            <p className="font-semibold">Happy Confort</p>
            <p className="text-gray-400 text-xs">Dashboard Deals</p>
          </div>
        </div>
        <Link
          href="/deal/new"
          className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Nouveau deal
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {deals.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg mb-2">Aucun deal pour l'instant</p>
            <Link href="/deal/new" className="text-sky-400 hover:underline">Créer le premier deal →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map(deal => (
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[deal.statut] || STATUT_COLORS.nouveau}`}>
                        {deal.statut}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {deal.client_adresse}{deal.client_ville ? `, ${deal.client_ville}` : ''}
                    </p>
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
    </div>
  )
}
