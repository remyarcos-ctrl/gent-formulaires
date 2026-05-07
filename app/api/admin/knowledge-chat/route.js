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
  return `Tu es Chloé, assistante IA de Happy Confort. Tu enrichis ta propre base de connaissance en conversant librement avec le gérant.

Voici ta base de connaissance actuelle :
--- CONNAISSANCE ACTUELLE ---
${knowledgeContent}
---

DEUX MODES DE FONCTIONNEMENT — tu les gères en même temps :

1. MODE QUESTIONNAIRE : identifie les sections marquées "À COMPLÉTER" et pose UNE question à la fois pour les remplir.

2. MODE LIBRE : si le gérant te dit n'importe quoi de nouveau (une info sur un fournisseur, une habitude, une règle métier, un contexte, une préférence, un client particulier, une anecdote utile…), tu l'intègres IMMÉDIATEMENT dans ta base même si ça ne correspond à aucune section existante.
   → Si l'info rentre dans une section existante : tu l'ajoutes à la bonne section.
   → Si l'info n'a pas de section : tu CRÉES une nouvelle section pertinente.
   → Tu ne refuses jamais une information. Tout ce que le gérant te dit peut être utile.

RÈGLE ABSOLUE : Quand tu reçois une nouvelle information à sauvegarder, émets EN BAS de ta réponse :
KNOWLEDGE_UPDATE:
{le fichier knowledge.md complet mis à jour, en markdown, avec toutes les sections existantes + les nouvelles infos intégrées}

- Confirme toujours ce que tu as noté ("Noté — j'ajoute ça dans ma base.")
- Une question à la fois quand tu es en mode questionnaire
- Sois naturelle, tu apprends sur l'entreprise — montre de la curiosité
- Si le gérant change de sujet ou te donne une info spontanée, suis-le et sauvegarde`
}

export async function GET() {
  const content = readKnowledge()
  return NextResponse.json({ content })
}

export async function POST(request) {
  const { messages } = await request.json()

  const knowledgeContent = readKnowledge()
  const systemPrompt = buildSystemPrompt(knowledgeContent)

  const hasContent = knowledgeContent.trim().length > 100
  const incomplete = (knowledgeContent.match(/À COMPLÉTER/g) || []).length
  const openingMsg = hasContent
    ? (incomplete > 0
        ? `Reprends sans te présenter à nouveau. Dis juste en une phrase ce que tu sais déjà, puis pose directement la prochaine question sur les ${incomplete} section(s) encore incomplète(s).`
        : `Reprends sans te présenter. Toutes les sections sont remplies — invite le gérant à t'apprendre autre chose sur l'entreprise.`)
    : 'Présente-toi brièvement et commence à poser tes questions pour enrichir ta base de connaissance.'

  const apiMessages = messages.length === 0
    ? [{ role: 'user', content: openingMsg }]
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
