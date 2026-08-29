import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import DealsFilter from '@/components/admin/DealsFilter'

export const dynamic = 'force-dynamic'

export default async function AdminDealsPage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')
  if (!auth || auth.value !== 'authenticated') redirect('/admin/login')

  const deals = await prisma.deal.findMany({
    include: { technicien: true },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="min-h-full bg-gray-950 text-white">
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
          <DealsFilter deals={deals} />
        )}
      </div>
    </div>
  )
}
