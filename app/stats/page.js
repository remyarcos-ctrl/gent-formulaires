'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Link from 'next/link'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function StatsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetch('/api/stats-ai')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function exportCSV() {
    if (!data?.chartData) return
    const rows = [
      ['Type', 'Count'],
      ...data.chartData.byType.map(r => [r.name, r.value]),
      [],
      ['Technicien', 'Interventions'],
      ...data.chartData.byTech.map(r => [r.name, r.value]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hc_stats_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-sm font-bold">HC</div>
          <span className="font-semibold text-white">Happy Confort</span>
          <span className="text-gray-500 text-sm">/ Statistiques IA</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <button onClick={exportCSV} className="btn-ghost text-sm px-3 py-1.5">↓ Export CSV</button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analyses IA</h1>
          <p className="text-gray-500 text-sm mt-0.5">Insights générés par Claude sur toutes les interventions</p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !data && (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-400">Aucune donnée disponible</p>
            <p className="text-gray-500 text-sm mt-1">Créez des interventions pour voir les analyses</p>
          </div>
        )}

        {data && (
          <>
            {data.analysis?.resume && (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="font-semibold text-sky-400 text-sm mb-1">Synthèse IA</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{data.analysis.resume}</p>
                  </div>
                </div>
              </div>
            )}

            {data.analysis?.alertes?.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-semibold text-amber-400 text-sm flex items-center gap-2">⚠️ Alertes</h2>
                {data.analysis.alertes.map((alerte, i) => (
                  <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200">{alerte}</div>
                ))}
              </div>
            )}

            <div className="flex gap-2 border-b border-gray-800 pb-4">
              {['overview', 'techniciens', 'tendances'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors capitalize ${activeTab === tab ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab === 'overview' ? 'Vue générale' : tab === 'techniciens' ? 'Techniciens' : 'Tendances'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-white mb-4 text-sm">Interventions par type</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.chartData?.byType || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {(data.chartData?.byType || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#f1f5f9', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-4 text-sm">Interventions par mois</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.chartData?.byMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#f1f5f9', fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 4 }} name="Interventions" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'techniciens' && (
              <div className="space-y-4">
                <div className="card">
                  <h3 className="font-semibold text-white mb-4 text-sm">Volume par technicien</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.chartData?.byTech || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#f1f5f9', fontSize: 12 }} />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Interventions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {data.analysis?.stats_techniciens?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.analysis.stats_techniciens.map((tech, i) => (
                      <div key={i} className="card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{tech.nom}</span>
                          <span className="badge badge-info">{tech.total} interventions</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Taux réserves</span>
                          <span className={parseFloat(tech.taux_reserves) > 25 ? 'text-red-400' : 'text-emerald-400'}>{tech.taux_reserves}</span>
                        </div>
                        {tech.points_forts && (
                          <p className="text-xs text-gray-400 italic">{tech.points_forts}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tendances' && (
              <div className="space-y-4">
                {data.analysis?.tendances && (
                  <div className="card">
                    <h3 className="font-semibold text-white mb-3 text-sm">Analyse des tendances</h3>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{data.analysis.tendances}</p>
                  </div>
                )}

                {data.analysis?.insights?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-sm">💡 Insights</h3>
                    {data.analysis.insights.map((insight, i) => (
                      <div key={i} className="card flex items-start gap-3">
                        <span className="text-sky-400 font-bold text-sm">{i + 1}</span>
                        <p className="text-gray-300 text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                )}

                {data.analysis?.recommandations?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-emerald-400 text-sm">✅ Recommandations</h3>
                    {data.analysis.recommandations.map((rec, i) => (
                      <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-200">{rec}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
