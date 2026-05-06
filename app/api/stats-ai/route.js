export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import anthropic, { SYSTEM_PROMPT_STATS } from '@/lib/anthropic'

export async function GET() {
  const interventions = await prisma.intervention.findMany({
    orderBy: { date: 'desc' },
    take: 200,
  })

  if (interventions.length === 0) {
    return NextResponse.json({ insights: 'Aucune donnée disponible.', data: [] })
  }

  const summary = interventions.map(i => ({
    type: i.type_chantier,
    technicien: i.technicien,
    statut: i.statut,
    hasReserves: !!i.reserves,
    reserves: i.reserves?.substring(0, 100),
    duree: i.duree_minutes,
    date: new Date(i.date).toISOString().split('T')[0],
  }))

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT_STATS,
    messages: [{
      role: 'user',
      content: `Analyse ces ${interventions.length} interventions Happy Confort et produis des insights détaillés :

${JSON.stringify(summary, null, 2)}

Fournis une analyse structurée en JSON avec ces clés :
{
  "resume": "synthèse en 2-3 phrases",
  "insights": ["insight 1", "insight 2", ...],
  "alertes": ["alerte urgente 1", ...],
  "recommandations": ["recommandation 1", ...],
  "stats_techniciens": [{"nom": "...", "total": N, "taux_reserves": "X%", "points_forts": "..."}],
  "tendances": "analyse des tendances mensuelles"
}`,
    }],
  })

  let analysis = {}
  try {
    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) analysis = JSON.parse(jsonMatch[0])
  } catch (e) {
    analysis = { resume: response.content[0].text }
  }

  const byType = {}
  const byTech = {}
  const byMonth = {}

  for (const i of interventions) {
    byType[i.type_chantier] = (byType[i.type_chantier] || 0) + 1
    byTech[i.technicien] = (byTech[i.technicien] || 0) + 1
    const month = new Date(i.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
    byMonth[month] = (byMonth[month] || 0) + 1
  }

  return NextResponse.json({
    analysis,
    chartData: {
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
      byTech: Object.entries(byTech).map(([name, value]) => ({ name, value })),
      byMonth: Object.entries(byMonth).map(([name, value]) => ({ name, value })),
    },
    total: interventions.length,
  })
}
