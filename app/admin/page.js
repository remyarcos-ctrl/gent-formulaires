import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AdminAgent from '@/components/admin/AdminAgent'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')
  if (!auth || auth.value !== 'authenticated') redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-sm font-bold text-white">HC</div>
          <div>
            <p className="text-white font-semibold text-sm">Happy Confort Admin</p>
            <p className="text-gray-400 text-xs">Chloé pilote votre activité</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/deal/new" className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + Deal
          </Link>
          <Link href="/admin/deals" className="text-xs text-gray-400 hover:text-white transition-colors">
            Vue liste
          </Link>
        </div>
      </div>
      <AdminAgent />
    </div>
  )
}
