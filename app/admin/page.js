import { Suspense } from 'react'
import DashboardStats from '@/components/admin/DashboardStats'
import InterventionTable from '@/components/admin/InterventionTable'
import CreateInterventionModal from '@/components/admin/CreateInterventionModal'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <CreateInterventionModal />
      </div>

      <Suspense fallback={<div className="animate-pulse text-gray-500 text-sm">Chargement des statistiques...</div>}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<div className="animate-pulse text-gray-500 text-sm">Chargement des interventions...</div>}>
        <InterventionTable />
      </Suspense>
    </div>
  )
}
