import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')

  if (!auth || auth.value !== 'authenticated') {
    redirect('/login')
  }

  return (
    <div className="app-shell bg-gray-950">
      <nav className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 shrink-0 bg-sky-600 rounded-lg flex items-center justify-center text-sm font-bold">HC</div>
          <span className="font-semibold text-white truncate">Happy Confort</span>
          <span className="hidden sm:inline text-gray-500 text-sm">/ Admin</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/stats" className="text-sm text-gray-400 hover:text-white transition-colors">Statistiques</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-gray-500 hover:text-red-400 transition-colors">Déconnexion</button>
          </form>
        </div>
      </nav>
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
