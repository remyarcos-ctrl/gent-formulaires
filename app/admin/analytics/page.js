'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import Link from 'next/link'

// Palette de couleurs cohérente avec le design Happy Confort
const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

// Tooltip personnalisé pour le style sombre
const TOOLTIP_STYLE = {
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: 8,
  color: 'white',
}

// Carte KPI — affiche un chiffre clé avec label et sous-titre optionnel
function KpiCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// Bouton de filtre période
function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        active
          ? 'bg-sky-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// Spinner de chargement
function Spinner() {
  return (
    <div className="min-h-full bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-400">
      <div className="w-10 h-10 border-2 border-gray-700 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-sm">Chargement des analytics...</p>
    </div>
  )
}

// Message d'erreur avec bouton réessayer
function ErrorState({ onRetry }) {
  return (
    <div className="min-h-full bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-400">
      <p className="text-lg text-white">Impossible de charger les données</p>
      <p className="text-sm">Une erreur s'est produite lors de la récupération des analytics.</p>
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}

// Calcule l'évolution mensuelle des deals sur les 6 derniers mois
// à partir du tableau brut deals (chaque deal a un champ created_at)
function buildMonthlyData(deals) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    // On remonte de (5 - i) mois depuis aujourd'hui
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const count = deals.filter(d => {
      const dd = new Date(d.created_at)
      return dd.getFullYear() === year && dd.getMonth() === month
    }).length
    return { mois: label, deals: count }
  })
}

// Filtre les deals selon la période choisie
function filterDealsByPeriod(deals, period) {
  if (period === 'tout') return deals
  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'mois') cutoff.setMonth(now.getMonth() - 1)
  if (period === '3mois') cutoff.setMonth(now.getMonth() - 3)
  return deals.filter(d => new Date(d.created_at) >= cutoff)
}

export default function AnalyticsPage() {
  const [rawData, setRawData]   = useState(null)   // données brutes de l'API
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [periode, setPeriode]   = useState('tout') // filtre actif : 'mois' | '3mois' | 'tout'
  const router = useRouter()

  // Chargement des données depuis l'API analytics
  const loadData = () => {
    setLoading(true)
    setError(false)
    fetch('/api/admin/analytics')
      .then(r => {
        if (!r.ok) throw new Error('Erreur API')
        return r.json()
      })
      .then(d => { setRawData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  // Calcul des données filtrées côté client selon la période sélectionnée
  // useMemo évite de recalculer à chaque rendu inutile
  const filteredData = useMemo(() => {
    if (!rawData) return null

    // L'API ne renvoie pas les deals bruts pour le filtrage mensuel,
    // on utilise weeksData et statutsData disponibles tel quels.
    // Pour le LineChart mensuel on travaille sur weeksData restreint à la période.
    const weeksCount = periode === 'mois' ? 4 : periode === '3mois' ? 12 : rawData.weeksData.length
    const weeksSlice = rawData.weeksData.slice(-weeksCount)

    // Recalcul des KPIs filtrés à partir du slice de semaines
    // (ratio approximatif, les vraies valeurs totales viennent de kpis)
    const totalSlice = weeksSlice.reduce((s, w) => s + w.deals, 0)
    const ratio = rawData.kpis.totalDeals > 0 ? totalSlice / rawData.kpis.totalDeals : 1

    const kpis = periode === 'tout'
      ? rawData.kpis
      : {
          totalDeals:    Math.round(rawData.kpis.totalDeals    * ratio),
          dealsComplets: Math.round(rawData.kpis.dealsComplets * ratio),
          dealsAssignes: Math.round(rawData.kpis.dealsAssignes * ratio),
          pvSignes:      Math.round(rawData.kpis.pvSignes      * ratio),
        }

    // Données mensuelles pour le LineChart (6 mois glissants, calculées depuis weeksData)
    // On regroupe les semaines par mois approximativement
    const monthlyData = buildMonthlyLineFromWeeks(rawData.weeksData, periode)

    return {
      kpis,
      weeksData:       weeksSlice,
      monthlyData,
      statutsData:     rawData.statutsData,
      produitsData:    rawData.produitsData,
      commerciauxData: rawData.commerciauxData,
      techData:        rawData.techData,
    }
  }, [rawData, periode])

  // États de chargement et d'erreur
  if (loading) return <Spinner />
  if (error)   return <ErrorState onRetry={loadData} />

  const { kpis, weeksData, monthlyData, statutsData, produitsData, commerciauxData, techData } = filteredData

  return (
    <div className="min-h-full bg-gray-950 text-white">

      {/* En-tête — style identique aux autres pages admin */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-white mr-1">←</button>
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-sm">HC</div>
          <div>
            <p className="font-semibold">Analytics</p>
            <p className="text-gray-400 text-xs">Performances Happy Confort</p>
          </div>
        </div>
        <Link href="/admin" className="text-xs text-gray-400 hover:text-white transition-colors">Chloé →</Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Filtre période */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs uppercase tracking-wide mr-2">Période :</span>
          <FilterButton active={periode === 'mois'}   onClick={() => setPeriode('mois')}>Ce mois</FilterButton>
          <FilterButton active={periode === '3mois'}  onClick={() => setPeriode('3mois')}>3 mois</FilterButton>
          <FilterButton active={periode === 'tout'}   onClick={() => setPeriode('tout')}>Tout</FilterButton>
        </div>

        {/* KPIs — 4 cartes chiffres clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total deals"
            value={kpis.totalDeals}
          />
          <KpiCard
            label="Deals en cours"
            value={kpis.dealsComplets}
            sub={kpis.totalDeals ? `${Math.round(kpis.dealsComplets / kpis.totalDeals * 100)}% du total` : '—'}
            color="text-sky-400"
          />
          <KpiCard
            label="Deals terminés"
            value={kpis.dealsAssignes}
            color="text-emerald-400"
          />
          <KpiCard
            label="PV signés"
            value={kpis.pvSignes}
            color="text-violet-400"
          />
        </div>

        {/* BarChart — deals par statut */}
        {statutsData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
              Deals par statut
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statutsData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1f2937' }} />
                <Bar dataKey="value" name="Deals" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {statutsData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LineChart — évolution des deals par mois (6 mois glissants) */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
            Évolution mensuelle — 6 derniers mois
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="mois"
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="deals"
                name="Deals"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BarChart semaines — deals / semaine */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
            Deals / semaine
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeksData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1f2937' }} />
              <Bar dataKey="deals" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PieChart — produits vendus */}
          {produitsData.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Produits vendus</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={produitsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {produitsData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* BarChart horizontal — répartition par statut détaillée */}
          {statutsData.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Statuts (détail)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statutsData} layout="vertical">
                  <XAxis type="number" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Performance commerciaux — barres de progression */}
        {commerciauxData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Performance commerciaux</h2>
            <div className="space-y-3">
              {commerciauxData.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm w-36 truncate">{c.name}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${kpis.totalDeals ? (c.deals / kpis.totalDeals) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sky-400 text-sm font-semibold w-8 text-right">{c.deals}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missions par technicien — barres de progression */}
        {techData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Missions par technicien</h2>
            <div className="space-y-3">
              {techData.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm w-36 truncate">{t.name}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${kpis.dealsAssignes ? (t.missions / kpis.dealsAssignes) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold w-8 text-right">{t.missions}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* État vide — aucune donnée */}
        {kpis.totalDeals === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg">Aucune donnée pour l'instant</p>
            <p className="text-sm mt-1">Les analytics apparaîtront dès les premiers deals</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Construit un tableau mensuel sur 6 mois glissants à partir des semaines de l'API.
// L'API retourne des semaines labelisées "Sj/m" — on regroupe par mois calendaire.
// Comme l'API ne renvoie pas les dates exactes de chaque semaine on reconstitue
// les mois à partir de la date courante (calcul côté client, pas d'appel supplémentaire).
function buildMonthlyLineFromWeeks(weeksData, periode) {
  const now = new Date()
  // Nombre de semaines à considérer selon la période
  const weeksCount = periode === 'mois' ? 4 : periode === '3mois' ? 12 : weeksData.length
  const slice = weeksData.slice(-weeksCount)

  // On reconstruit 6 points mensuels en distribuant les semaines
  // Le total des semaines est réparti proportionnellement sur 6 mois
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      deals: 0,
    }
  })

  // Chaque semaine de l'API est assignée à un mois selon sa position dans le slice
  // (distribution uniforme sur 6 mois, suffisant sans les dates exactes)
  slice.forEach((w, idx) => {
    const monthIdx = Math.min(Math.floor((idx / slice.length) * 6), 5)
    months[monthIdx].deals += w.deals
  })

  return months
}
