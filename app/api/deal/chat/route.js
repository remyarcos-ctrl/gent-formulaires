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

          // Notify Rémy via Telegram
          const remyChatId = process.env.REMY_TELEGRAM_CHAT_ID
          const botToken = process.env.TELEGRAM_BOT_TOKEN
          if (remyChatId && botToken) {
            const nom = `${dealData.client_prenom || ''} ${dealData.client_nom || ''}`.trim() || 'Client'
            const produits = dealData.produits?.join(', ') || 'Non renseigné'
            const msg = `🔔 Nouveau deal Happy Confort !\n\n👤 Client : ${nom}\n🔧 Produits : ${produits}\n📍 ${dealData.client_ville || ''}\n\n✅ Deal complet — à assigner`
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: remyChatId, text: msg }),
            }).catch(() => {})
          }
        }
      } catch (e) {}
    }

    let cleanText = text.replace(/DEAL_DATA:\s*\{.*?\}/s, '').trim()

    // Parse PARTIAL_DATA for real-time updates
    let partialData = null
    const partialMatch = cleanText.match(/PARTIAL_DATA:\s*(\{.*?\})/s)
    if (partialMatch) {
      try {
        partialData = JSON.parse(partialMatch[1])
        if (dealId && partialData && Object.keys(partialData).length > 0) {
          await prisma.deal.update({
            where: { id: dealId },
            data: partialData,
          })
        }
      } catch (e) {}
      cleanText = cleanText.replace(/PARTIAL_DATA:\s*\{.*?\}/s, '').trim()
    }

    const choicesMatch = cleanText.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        cleanText = cleanText.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    return NextResponse.json({ response: cleanText, choices, dealData, partialData })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
