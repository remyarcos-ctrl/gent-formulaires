import prisma from '@/lib/prisma'

async function getStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const [todayCount, weekCount, monthCount, totalCount, withReserves, byType] = await Promise.all([
    prisma.intervention.count({ where: { date: { gte: today } } }),
    prisma.intervention.count({ where: { date: { gte: weekAgo } } }),
    prisma.intervention.count({ where: { date: { gte: monthAgo } } }),
    prisma.intervention.count(),
    prisma.intervention.count({ where: { reserves: { not: null } } }),
    prisma.intervention.groupBy({ by: ['type_chantier'], _count: true }),
  ])

  return { todayCount, weekCount, monthCount, totalCount, withReserves, byType }
}

export default async function DashboardStats() {
  let stats
  try {
    stats = await getStats()
  } catch {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
        ⚠️ Base de données non configurée — ajoutez <code className="text-amber-200">DATABASE_URL</code> dans les variables d'environnement Vercel puis redéployez.
      </div>
    )
  }
  const reserveRate = stats.monthCount > 0 ? Math.round((stats.withReserves / stats.monthCount) * 100) : 0

  const cards = [
    { label: "Aujourd'hui", value: stats.todayCount, icon: '📅', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Cette semaine', value: stats.weekCount, icon: '📊', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Ce mois', value: stats.monthCount, icon: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Total', value: stats.totalCount, icon: '🏗️', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Taux réserves', value: `${reserveRate}%`, icon: '⚠️', color: reserveRate > 20 ? 'text-red-400' : 'text-green-400', bg: reserveRate > 20 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <div key={card.label} className={`rounded-xl p-4 border ${card.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{card.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
