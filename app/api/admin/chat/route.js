import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CHLOE_ADMIN_PROMPT } from '@/lib/chloe'
import prisma from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST(request) {
  const { messages } = await request.json()

  // Load live context for Chloé
  const [deals, techniciens] = await Promise.all([
    prisma.deal.findMany({
      include: { technicien: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    }),
    prisma.technicien.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } }),
  ])

  const dealsContext = deals.map(d =>
    `[ID:${d.id.slice(-6)}] ${d.client_prenom || ''} ${d.client_nom || 'Inconnu'} — ${d.produits?.join(', ') || '?'} — statut:${d.statut} — tech:${d.technicien?.nom || 'non assigné'}`
  ).join('\n')

  const techsContext = techniciens.map(t =>
    `[ID:${t.id.slice(-6)}] ${t.nom} — tél:${t.telephone}`
  ).join('\n')

  const systemPrompt = `${CHLOE_ADMIN_PROMPT}

--- DONNÉES EN TEMPS RÉEL ---
DEALS (${deals.length}) :
${dealsContext || 'Aucun deal'}

TECHNICIENS :
${techsContext || 'Aucun technicien'}
---

Pour exécuter une action, réponds avec :
ACTION: {"type":"assign_tech","deal_id":"<id_complet>","tech_id":"<id_complet>","canal":"whatsapp"}
ou
ACTION: {"type":"send_links","deal_id":"<id_complet>","canal":"whatsapp"}

Utilise les IDs complets des deals et techniciens. Quand Rémy mentionne un nom partiel (ex: "deal Dupont"), trouve le bon ID dans les données.`

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: 'Bonjour Chloé, montre-moi un résumé des deals en cours.' }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })

    let text = response.content[0].text
    let actionResult = null

    // Parse and execute ACTION
    const actionMatch = text.match(/ACTION:\s*(\{.*?\})/s)
    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1])
        // Find full deal ID from partial (last 6 chars match)
        const deal = deals.find(d => d.id === action.deal_id || d.id.endsWith(action.deal_id))
        const tech = techniciens.find(t => t.id === action.tech_id || t.id.endsWith(action.tech_id))

        if (action.type === 'assign_tech' && deal && tech) {
          const clientNom = `${deal.client_prenom || ''} ${deal.client_nom || ''}`.trim() || 'Client'
          const adresse = `${deal.client_adresse || ''}, ${deal.client_ville || ''}`.trim().replace(/^,\s*/, '')

          // Create intervention if not exists
          let intervention = deal.intervention
          if (!intervention) {
            intervention = await prisma.intervention.create({
              data: {
                deal_id: deal.id,
                technicien: tech.nom,
                client_nom: clientNom,
                client_email: deal.client_email,
                client_telephone: deal.client_telephone,
                type_chantier: deal.produits?.join(', ') || 'Installation',
                adresse: adresse || 'Adresse à confirmer',
              },
            })
          }

          // Create PV if not exists
          let pv = deal.pv_reception
          if (!pv) {
            pv = await prisma.pvReception.create({
              data: { deal_id: deal.id, intervention_id: intervention.id },
            })
          }

          // Update deal
          const updatedDeal = await prisma.deal.update({
            where: { id: deal.id },
            data: { technicien_id: tech.id, statut: 'assigné' },
            include: { intervention: true, pv_reception: true },
          })

          // Send notification
          const notification = await sendNotification(tech, updatedDeal, action.canal || 'whatsapp')
          actionResult = { ok: true, action: action.type, notification }
        }
      } catch (e) {
        actionResult = { ok: false, error: e.message }
        console.error('Action error:', e)
      }
      text = text.replace(/ACTION:\s*\{.*?\}/s, '').trim()
    }

    // Parse choices
    const choicesMatch = text.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        text = text.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ response: text, choices, actionResult })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
