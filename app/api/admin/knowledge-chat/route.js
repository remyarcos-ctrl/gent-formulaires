import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import fs from 'fs'
import path from 'path'

const KNOWLEDGE_PATH = path.join(process.cwd(), 'lib', 'knowledge.md')

function readKnowledge() {
  try {
    return fs.readFileSync(KNOWLEDGE_PATH, 'utf-8')
  } catch (e) {
    return ''
  }
}

function writeKnowledge(content) {
  fs.writeFileSync(KNOWLEDGE_PATH, content, 'utf-8')
}

function buildSystemPrompt(knowledgeContent) {
  return `Tu es Chloé, assistante IA de Happy Confort. Tu enrichis ta propre base de connaissance en posant des questions au gérant.

Voici ta base de connaissance actuelle :
--- CONNAISSANCE ACTUELLE ---
${knowledgeContent}
---

Ton rôle dans cette conversation :
- Identifie les sections incomplètes (marquées "À COMPLÉTER") ou vides
- Pose UNE question à la fois pour les remplir, dans l'ordre naturel
- Reformule et confirme ce que tu as compris avant de passer à la suite
- Quand tu as recueilli une nouvelle information concrète, mets à jour ta base et émets EN BAS de ta réponse exactement :
  KNOWLEDGE_UPDATE:
  {le fichier knowledge.md complet mis à jour, en markdown}
- Ne génère KNOWLEDGE_UPDATE que quand tu as une vraie information à sauvegarder (pas pour les questions)
- Continue jusqu'à ce que toutes les sections soient remplies
- Sois naturelle et directe — c'est une conversation, pas un formulaire
- Si toutes les sections sont complètes, félicite le gérant et propose de revoir certains points`
}

export async function GET() {
  const content = readKnowledge()
  return NextResponse.json({ content })
}

export async function POST(request) {
  const { messages } = await request.json()

  const knowledgeContent = readKnowledge()
  const systemPrompt = buildSystemPrompt(knowledgeContent)

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: 'Commence : présente-toi brièvement et pose ta première question sur les sections incomplètes.' }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    })

    let text = response.content[0].text
    let saved = false

    // Parse KNOWLEDGE_UPDATE marker
    const updateMatch = text.match(/KNOWLEDGE_UPDATE:\n([\s\S]+)$/m)
    if (updateMatch) {
      const updatedContent = updateMatch[1].trim()
      try {
        writeKnowledge(updatedContent)
        saved = true
      } catch (e) {
        console.error('Failed to write knowledge.md:', e)
      }
      // Strip the KNOWLEDGE_UPDATE block from visible response
      text = text.replace(/\n*KNOWLEDGE_UPDATE:\n[\s\S]+$/m, '').trim()
    }

    return NextResponse.json({ response: text, saved })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
