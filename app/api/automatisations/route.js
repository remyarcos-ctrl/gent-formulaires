import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import anthropic, { SYSTEM_PROMPT_STATS } from '@/lib/anthropic'
import { uploadToDrive, createCalendarEvent, sendEmail } from '@/lib/google'
import { submitForm } from '@/lib/jotform'

export async function POST(request) {
  const { interventionId, messages, formData, photos, signatures } = await request.json()

  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
  })

  if (!intervention) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const results = { pdf: null, calendar: null, email: null, jotform: null }
  const errors = []

  const conversationSummary = messages
    .map(m => `${m.role === 'user' ? intervention.technicien : 'Léa'}: ${m.content}`)
    .join('\n')

  const hasReserves = intervention.reserves && intervention.reserves.trim().length > 0

  const summaryResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT_STATS,
    messages: [{
      role: 'user',
      content: `Génère une fiche d'intervention HTML complète et professionnelle pour Happy Confort basée sur ces données :

Technicien: ${intervention.technicien}
Client: ${intervention.client_nom} — ${intervention.adresse}
Type: ${intervention.type_chantier}
Date: ${new Date(intervention.date).toLocaleDateString('fr-FR')}
Statut: ${intervention.statut}
Réserves: ${intervention.reserves || 'Aucune'}

Conversation:
${conversationSummary}

Données formulaire: ${JSON.stringify(formData)}

Génère un HTML complet avec style inline, professionnel, avec logo HC, tableau récapitulatif, photos listées, signatures notées, et section réserves si applicable.`,
    }],
  })

  const htmlContent = summaryResponse.content[0].text
  const pdfBuffer = Buffer.from(htmlContent, 'utf-8')
  const pdfFilename = `HC_Intervention_${intervention.client_nom.replace(/\s+/g, '_')}_${new Date(intervention.date).toISOString().split('T')[0]}.html`

  try {
    const driveFile = await uploadToDrive(pdfBuffer, pdfFilename, 'text/html')
    results.pdf = driveFile.webViewLink
    await prisma.intervention.update({
      where: { id: interventionId },
      data: { notes_ia: `Drive: ${driveFile.webViewLink}` },
    })
  } catch (e) {
    errors.push(`Drive: ${e.message}`)
  }

  try {
    const startDate = new Date(intervention.date)
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000)
    const event = await createCalendarEvent({
      title: `${intervention.type_chantier} — ${intervention.client_nom}`,
      description: `Technicien: ${intervention.technicien}\nAdresse: ${intervention.adresse}\n${hasReserves ? '⚠️ Réserves: ' + intervention.reserves : '✅ Sans réserves'}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: intervention.adresse,
    })
    results.calendar = event.id
  } catch (e) {
    errors.push(`Calendar: ${e.message}`)
  }

  if (intervention.client_email) {
    try {
      const emailResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: 'Tu rédiges des emails professionnels et chaleureux pour Happy Confort, société spécialisée en installations énergétiques.',
        messages: [{
          role: 'user',
          content: `Rédige un email HTML de confirmation d'intervention pour :
Client: ${intervention.client_nom}
Type installation: ${intervention.type_chantier}
Date: ${new Date(intervention.date).toLocaleDateString('fr-FR')}
Technicien: ${intervention.technicien}
${hasReserves ? `Réserves constatées: ${intervention.reserves}` : 'Intervention réalisée sans réserves'}
${results.pdf ? `Fiche disponible: ${results.pdf}` : ''}

Email signé par Happy Confort, style professionnel et rassurant. Inclure les prochaines étapes si réserves.`,
        }],
      })

      await sendEmail({
        to: intervention.client_email,
        subject: `Happy Confort — Confirmation intervention ${intervention.type_chantier} du ${new Date(intervention.date).toLocaleDateString('fr-FR')}`,
        body: emailResponse.content[0].text,
      })
      results.email = 'sent'
    } catch (e) {
      errors.push(`Gmail: ${e.message}`)
    }
  }

  try {
    if (formData && Object.keys(formData).length > 0) {
      const submission = await submitForm(formData)
      results.jotform = submission?.id
      if (results.jotform) {
        await prisma.intervention.update({
          where: { id: interventionId },
          data: { jotform_submission_id: results.jotform },
        })
      }
    }
  } catch (e) {
    errors.push(`Jotform: ${e.message}`)
  }

  if (hasReserves) {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + 7)
    try {
      await createCalendarEvent({
        title: `⚠️ SUIVI RÉSERVES — ${intervention.client_nom}`,
        description: `Relance J+7 pour réserves sur ${intervention.type_chantier}.\nRéserves: ${intervention.reserves}\nContact: ${intervention.client_email || intervention.client_telephone || 'non renseigné'}`,
        start: followUpDate.toISOString(),
        end: new Date(followUpDate.getTime() + 30 * 60 * 1000).toISOString(),
        location: intervention.adresse,
      })
    } catch (e) {
      errors.push(`Suivi réserves: ${e.message}`)
    }
  }

  return NextResponse.json({ results, errors })
}
