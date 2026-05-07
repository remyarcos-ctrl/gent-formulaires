'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      Chargement des analytics...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-white mr-1">←</button>
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-sm">HC</div>
          <div>
            <p className="font-semibold">Analytics</p>
            <p className="text-gray-400 text-xs">Performances Happy Confort</p>
          </div>
        </div>
        <Link href="/admin" className="text-xs text-gray-400 hover:text-white">Chloé →</Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total deals" value={data.kpis.totalDeals} />
          <KpiCard label="Complétés" value={data.kpis.dealsComplets} sub={`${data.kpis.totalDeals ? Math.round(data.kpis.dealsComplets / data.kpis.totalDeals * 100) : 0}% du total`} />
          <KpiCard label="Assignés" value={data.kpis.dealsAssignes} />
          <KpiCard label="PV signés" value={data.kpis.pvSignes} />
        </div>

        {/* Deals par semaine */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Deals / semaine (8 dernières semaines)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weeksData}>
              <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: 'white' }} />
              <Bar dataKey="deals" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Produits */}
          {data.produitsData.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Produits vendus</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.produitsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {data.produitsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Statuts */}
          {data.statutsData.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Répartition par statut</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.statutsData} layout="vertical">
                  <XAxis type="number" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: 'white' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Commerciaux */}
        {data.commerciauxData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Performance commerciaux</h2>
            <div className="space-y-2">
              {data.commerciauxData.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm w-32 truncate">{c.name}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${(c.deals / data.kpis.totalDeals) * 100}%` }} />
                  </div>
                  <span className="text-sky-400 text-sm font-semibold w-8 text-right">{c.deals}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Techniciens */}
        {data.techData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Missions par technicien</h2>
            <div className="space-y-2">
              {data.techData.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm w-32 truncate">{t.name}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(t.missions / (data.kpis.dealsAssignes || 1)) * 100}%` }} />
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold w-8 text-right">{t.missions}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.kpis.totalDeals === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg">Aucune donnée pour l'instant</p>
            <p className="text-sm mt-1">Les analytics apparaîtront dès les premiers deals</p>
          </div>
        )}
      </div>
    </div>
  )
}
