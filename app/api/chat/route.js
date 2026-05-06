import { NextResponse } from 'next/server'
import anthropic, { SYSTEM_PROMPT_AGENT } from '@/lib/anthropic'
import { getFormStructure } from '@/lib/jotform'

let cachedFormStructure = null

async function getStructure() {
  if (!cachedFormStructure) {
    try {
      cachedFormStructure = await getFormStructure()
    } catch (e) {
      cachedFormStructure = {}
    }
  }
  return cachedFormStructure
}

export async function POST(request) {
  const { messages, interventionId, context } = await request.json()

  const formStructure = await getStructure()
  const formContext = Object.values(formStructure)
    .filter(q => q.type !== 'control_head' && q.type !== 'control_button')
    .map(q => `- ${q.text || q.name}: ${q.type}`)
    .join('\n')

  const systemPrompt = `${SYSTEM_PROMPT_AGENT}

Structure du formulaire Jotform à remplir :
${formContext}

${context || ''}

Quand tu as collecté toutes les informations, synthétise-les et inclus dans ta réponse :
FORM_DATA: {json avec les données collectées correspondant aux champs Jotform}

Si des réserves sont détectées, marque-les clairement.`

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: context || "Commence l'intervention" }]
    : messages

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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
    } catch (e) {}
  }

  const cleanText = text
    .replace(/FORM_DATA:\s*\{.*?\}/s, '')
    .trim()

  return NextResponse.json({ response: cleanText, formData })
}
