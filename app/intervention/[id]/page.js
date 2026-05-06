import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ChatAgent from '@/components/intervention/ChatAgent'

export const dynamic = 'force-dynamic'

export default async function InterventionPage({ params }) {
  let intervention = null

  try {
    intervention = await prisma.intervention.findUnique({
      where: { id: params.id },
    })
  } catch (e) {
    notFound()
  }

  if (!intervention) notFound()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">HC</div>
        <div>
          <div className="font-semibold text-white text-sm">Happy Confort</div>
          <div className="text-xs text-gray-500">
            {intervention.type_chantier} — {intervention.client_nom}
          </div>
        </div>
        <div className="ml-auto">
          <span className="badge badge-info text-xs">{intervention.technicien}</span>
        </div>
      </div>

      <ChatAgent intervention={intervention} />
    </div>
  )
}
