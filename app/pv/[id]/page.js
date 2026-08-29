import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import PvAgent from '@/components/pv/PvAgent'

export const dynamic = 'force-dynamic'

export default async function PvPage({ params }) {
  let pv = null
  try {
    pv = await prisma.pvReception.findUnique({
      where: { id: params.id },
      include: {
        deal: { include: { technicien: true } },
        intervention: true,
      },
    })
  } catch (e) {
    notFound()
  }
  if (!pv) notFound()

  const deal = pv.deal

  return (
    <div className="app-shell bg-gray-950 print:block print:h-auto print:overflow-visible">
      {/* Print-only PV document */}
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Happy Confort</h1>
            <p className="text-sm text-gray-600">Procès-Verbal de Réception de Chantier</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>N° {pv.id.slice(-8).toUpperCase()}</p>
            <p>{new Date(pv.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Client</h2>
            <p className="font-semibold">{deal?.client_prenom} {deal?.client_nom}</p>
            <p className="text-gray-600 text-sm">{deal?.client_adresse}</p>
            <p className="text-gray-600 text-sm">{deal?.client_cp} {deal?.client_ville}</p>
            <p className="text-gray-600 text-sm">{deal?.client_telephone}</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Intervention</h2>
            <p className="font-semibold">{deal?.produits?.join(', ')}</p>
            <p className="text-gray-600 text-sm">Technicien : {deal?.technicien?.nom}</p>
            <p className="text-gray-600 text-sm">Date : {new Date(pv.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {pv.observations && (
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Observations</h2>
            <p className="text-gray-700 border border-gray-200 rounded p-3 text-sm">{pv.observations}</p>
          </div>
        )}

        {pv.reserves && (
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide text-amber-700">Réserves</h2>
            <p className="text-gray-700 border border-amber-200 bg-amber-50 rounded p-3 text-sm">{pv.reserves}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-10">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Signature du technicien</p>
            {pv.signature_tech_url
              ? <img src={pv.signature_tech_url} alt="Signature tech" className="h-20 border border-gray-200 rounded" />
              : <div className="h-20 border border-gray-300 rounded" />}
            <p className="text-xs text-gray-500 mt-1">{deal?.technicien?.nom}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Signature du client</p>
            {pv.signature_client_url
              ? <img src={pv.signature_client_url} alt="Signature client" className="h-20 border border-gray-200 rounded" />
              : <div className="h-20 border border-gray-300 rounded" />}
            <p className="text-xs text-gray-500 mt-1">{deal?.client_prenom} {deal?.client_nom}</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          Happy Confort — PV généré le {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* App UI - hidden when printing */}
      <div className="print:hidden flex-1 min-h-0 flex flex-col">
        <PvAgent pv={pv} />
      </div>
    </div>
  )
}
