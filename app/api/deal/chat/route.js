import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CHLOE_DEAL_PROMPT } from '@/lib/chloe'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { messages, dealId, context } = await request.json()

  const systemPrompt = context ? `${CHLOE_DEAL_PROMPT}\n\n${context}` : CHLOE_DEAL_PROMPT

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: context || "Commence la saisie d'un nouveau deal." }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })

    const text = response.content[0].text

    let dealData = null
    const dealDataMatch = text.match(/DEAL_DATA:\s*(\{.*?\})/s)
    if (dealDataMatch) {
      try {
        dealData = JSON.parse(dealDataMatch[1])
        if (dealId && dealData) {
          await prisma.deal.update({
            where: { id: dealId },
            data: { ...dealData, statut: 'complet', conversation: apiMessages },
          })
        }
      } catch (e) {}
    }

    let cleanText = text.replace(/DEAL_DATA:\s*\{.*?\}/s, '').trim()
    const choicesMatch = cleanText.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        cleanText = cleanText.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ response: cleanText, choices, dealData })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
