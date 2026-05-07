import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const [deals, interventions] = await Promise.all([
    prisma.deal.findMany({
      include: { technicien: true },
      orderBy: { created_at: 'desc' },
    }),
    prisma.intervention.findMany({
      orderBy: { created_at: 'desc' },
    }),
  ])

  // Deals per week (last 8 weeks)
  const now = new Date()
  const weeksData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (7 * (7 - i)))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const label = `S${weekStart.getDate()}/${weekStart.getMonth() + 1}`
    const count = deals.filter(d => {
      const d_date = new Date(d.created_at)
      return d_date >= weekStart && d_date < weekEnd
    }).length
    return { week: label, deals: count }
  })

  // Products breakdown
  const productCounts = {}
  deals.forEach(d => {
    (d.produits || []).forEach(p => {
      productCounts[p] = (productCounts[p] || 0) + 1
    })
  })
  const produitsData = Object.entries(productCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Status breakdown
  const statusCounts = {}
  deals.forEach(d => {
    statusCounts[d.statut] = (statusCounts[d.statut] || 0) + 1
  })
  const statutsData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Commercial performance
  const commCounts = {}
  deals.forEach(d => {
    if (d.commercial_nom) {
      commCounts[d.commercial_nom] = (commCounts[d.commercial_nom] || 0) + 1
    }
  })
  const commerciauxData = Object.entries(commCounts)
    .map(([name, deals]) => ({ name, deals }))
    .sort((a, b) => b.deals - a.deals)

  // Tech performance
  const techCounts = {}
  deals.forEach(d => {
    if (d.technicien?.nom) {
      techCounts[d.technicien.nom] = (techCounts[d.technicien.nom] || 0) + 1
    }
  })
  const techData = Object.entries(techCounts)
    .map(([name, missions]) => ({ name, missions }))
    .sort((a, b) => b.missions - a.missions)

  // KPIs
  const totalDeals = deals.length
  const dealsComplets = deals.filter(d => ['complet', 'assigné', 'pv_signé', 'terminé'].includes(d.statut)).length
  const dealsAssignes = deals.filter(d => d.statut === 'assigné' || d.statut === 'pv_signé' || d.statut === 'terminé').length
  const pvSignes = deals.filter(d => d.statut === 'pv_signé' || d.statut === 'terminé').length

  return NextResponse.json({
    kpis: { totalDeals, dealsComplets, dealsAssignes, pvSignes },
    weeksData,
    produitsData,
    statutsData,
    commerciauxData,
    techData,
  })
}
