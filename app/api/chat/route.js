import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CHLOE_INTERVENTION_PROMPT } from '@/lib/chloe'
import { getKnowledge } from '@/lib/chloe-knowledge'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { messages, interventionId, context } = await request.json()

  // Load intervention + linked deal for context
  let dealContext = ''
  if (interventionId) {
    try {
      const intervention = await prisma.intervention.findUnique({
        where: { id: interventionId },
        include: { deal: true },
      })
      if (intervention?.deal) {
        const d = intervention.deal
        const produits = d.produits?.join(', ') || ''
        const specs = d.specs_techniques ? JSON.stringify(d.specs_techniques) : ''
        dealContext = `\n\nCONTEXTE DU DEAL :\n- Produits installés : ${produits}\n- Client : ${d.client_prenom || ''} ${d.client_nom || ''}\n- Adresse : ${d.client_adresse || ''}, ${d.client_ville || ''}${specs ? `\n- Specs vendues : ${specs}` : ''}\n\nAdapte tes questions aux produits installés.`
      }
    } catch (e) {}
  }

  const knowledge = getKnowledge()
  const base = knowledge ? `${CHLOE_INTERVENTION_PROMPT}\n\n--- CONNAISSANCE HAPPY CONFORT ---\n${knowledge}\n---` : CHLOE_INTERVENTION_PROMPT
  const systemPrompt = `${base}${dealContext}\n\n${context || ''}`

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: context || "Commence l'intervention" }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })

    const text = response.content[0].text

    let formData = null
    const formDataMatch = text.match(/FORM_DATA:\s*(\{.*?\})/s)
    if (formDataMatch) {
      try {
        formData = JSON.parse(formDataMatch[1])
        if (interventionId && formData) {
          await prisma.intervention.update({
            where: { id: interventionId },
            data: { notes_ia: JSON.stringify(formData), conversation: apiMessages },
          })
        }
      } catch (e) {}
    }

    const choicesMatch = text.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    let cleanText = text.replace(/FORM_DATA:\s*\{.*?\}/s, '').trim()
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        cleanText = cleanText.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ response: cleanText, formData, choices })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
