import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CHLOE_ADMIN_PROMPT } from '@/lib/chloe'
import { getKnowledge } from '@/lib/chloe-knowledge'
import prisma from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST(request) {
  const { messages, openingStyle } = await request.json()

  // Load live context for Chloé
  const [deals, techniciens] = await Promise.all([
    prisma.deal.findMany({
      include: { technicien: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    }),
    prisma.technicien.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } }),
  ])

  const dealsContext = deals.map(d => {
    const nom = (d.client_prenom || d.client_nom)
      ? `${d.client_prenom || ''} ${d.client_nom || ''}`.trim()
      : `Deal du ${new Date(d.created_at).toLocaleDateString('fr-FR')}`
    return `[ID:${d.id.slice(-6)}] ${nom} — ${d.produits?.join(', ') || 'produits non renseignés'} — statut:${d.statut} — tech:${d.technicien?.nom || 'non assigné'}`
  }).join('\n')

  const techsContext = techniciens.map(t =>
    `[ID:${t.id.slice(-6)}] ${t.nom} — tél:${t.telephone}`
  ).join('\n')

  const knowledge = getKnowledge()
  const adminBase = knowledge ? `${CHLOE_ADMIN_PROMPT}\n\n--- CONNAISSANCE HAPPY CONFORT ---\n${knowledge}\n---` : CHLOE_ADMIN_PROMPT
  const systemPrompt = `${adminBase}

--- DONNÉES EN TEMPS RÉEL ---
DEALS (${deals.length}) :
${dealsContext || 'Aucun deal'}

TECHNICIENS :
${techsContext || 'Aucun technicien'}
---

Pour exécuter une action, réponds avec :
ACTION: {"type":"assign_tech","deal_id":"<id>","tech_id":"<id>","canal":"whatsapp"}
ACTION: {"type":"add_tech","nom":"Jean Dupont","telephone":"+33612345678","email":"jean@example.com"}
ACTION: {"type":"update_tech","tech_id":"<id>","nom":"...","telephone":"...","email":"..."}
ACTION: {"type":"deactivate_tech","tech_id":"<id>"}

Pour add_tech : email est optionnel. Utilise les 6 derniers caractères d'ID pour identifier. Quand le beau gosse mentionne un nom partiel, trouve le bon ID dans les données.`

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: `Bonjour Chloé, présente-moi un résumé de l'activité. Utilise une phrase d'accueil de style n°${openingStyle || 1} parmi tes variantes (dynamique, pro, complice, synthétique, motivant) — varie à chaque session.` }]
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

        if (action.type === 'add_tech' && action.nom && action.telephone) {
          const newTech = await prisma.technicien.create({
            data: { nom: action.nom, telephone: action.telephone, email: action.email || null },
          })
          actionResult = { ok: true, action: 'add_tech', technicien: newTech }
        } else if (action.type === 'update_tech') {
          const techToUpdate = techniciens.find(t => t.id === action.tech_id || t.id.endsWith(action.tech_id))
          if (techToUpdate) {
            const data = {}
            if (action.nom) data.nom = action.nom
            if (action.telephone) data.telephone = action.telephone
            if (action.email !== undefined) data.email = action.email
            const updated = await prisma.technicien.update({ where: { id: techToUpdate.id }, data })
            actionResult = { ok: true, action: 'update_tech', technicien: updated }
          }
        } else if (action.type === 'deactivate_tech') {
          const techToDeactivate = techniciens.find(t => t.id === action.tech_id || t.id.endsWith(action.tech_id))
          if (techToDeactivate) {
            await prisma.technicien.update({ where: { id: techToDeactivate.id }, data: { actif: false } })
            actionResult = { ok: true, action: 'deactivate_tech', nom: techToDeactivate.nom }
          }
        } else if (action.type === 'assign_tech' && deal && tech) {
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
