import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')

  if (!auth || auth.value !== 'authenticated') {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-sm font-bold">HC</div>
          <span className="font-semibold text-white">Happy Confort</span>
          <span className="text-gray-500 text-sm">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/stats" className="text-sm text-gray-400 hover:text-white transition-colors">Statistiques</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-gray-500 hover:text-red-400 transition-colors">Déconnexion</button>
          </form>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
