import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CHLOE_PV_PROMPT } from '@/lib/chloe'
import { getKnowledge } from '@/lib/chloe-knowledge'
import prisma from '@/lib/prisma'
import { sendPvEmail } from '@/lib/email'

export async function POST(request) {
  const { messages, pvId, context } = await request.json()

  const pv = pvId ? await prisma.pvReception.findUnique({
    where: { id: pvId },
    include: { deal: { include: { technicien: true } }, intervention: true },
  }) : null

  const knowledge = getKnowledge()
  let systemPrompt = knowledge ? `${CHLOE_PV_PROMPT}\n\n--- CONNAISSANCE HAPPY CONFORT ---\n${knowledge}\n---` : CHLOE_PV_PROMPT
  if (pv?.deal) {
    const d = pv.deal
    systemPrompt += `\n\nDonnées pré-remplies :\n- Client : ${d.client_prenom || ''} ${d.client_nom || ''}\n- Adresse : ${d.client_adresse || ''}, ${d.client_ville || ''}\n- Produits : ${d.produits?.join(', ') || ''}\n- Technicien : ${d.technicien?.nom || ''}`
  }
  if (context) systemPrompt += `\n\n${context}`

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: 'Commence le PV de réception.' }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })

    let text = response.content[0].text
    let pvComplete = false

    if (text.includes('PV_COMPLETE: true')) {
      pvComplete = true
      text = text.replace('PV_COMPLETE: true', '').trim()
      if (pvId) {
        await prisma.pvReception.update({
          where: { id: pvId },
          data: { statut: 'signé', conversation: apiMessages },
        })
        await prisma.deal.updateMany({
          where: { pv_reception: { id: pvId } },
          data: { statut: 'pv_signé' },
        })
        // Email to client
        if (pv?.deal) {
          sendPvEmail(pv.deal, pvId).catch(() => {})
        }
      }
    }

    const choicesMatch = text.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        text = text.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ response: text, choices, pvComplete })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
