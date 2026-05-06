import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const intervention = await prisma.intervention.findUnique({
    where: { id: params.id },
  })

  if (!intervention) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(intervention)
}

export async function PATCH(request, { params }) {
  const body = await request.json()

  const intervention = await prisma.intervention.update({
    where: { id: params.id },
    data: {
      ...(body.statut && { statut: body.statut }),
      ...(body.reserves !== undefined && { reserves: body.reserves }),
      ...(body.photos_urls && { photos_urls: body.photos_urls }),
      ...(body.signature_client_url && { signature_client_url: body.signature_client_url }),
      ...(body.signature_tech_url && { signature_tech_url: body.signature_tech_url }),
      ...(body.jotform_submission_id && { jotform_submission_id: body.jotform_submission_id }),
      ...(body.notes_ia && { notes_ia: body.notes_ia }),
      ...(body.duree_minutes && { duree_minutes: body.duree_minutes }),
    },
  })

  return NextResponse.json(intervention)
}

export async function DELETE(request, { params }) {
  await prisma.intervention.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
