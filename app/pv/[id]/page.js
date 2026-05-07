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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <PvAgent pv={pv} />
    </div>
  )
}
