export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const interventions = await prisma.intervention.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  })

  return NextResponse.json(interventions)
}

export async function POST(request) {
  const body = await request.json()

  const intervention = await prisma.intervention.create({
    data: {
      technicien: body.technicien,
      client_nom: body.client_nom,
      client_email: body.client_email || null,
      client_telephone: body.client_telephone || null,
      type_chantier: body.type_chantier,
      adresse: body.adresse,
      statut: 'en_cours',
    },
  })

  return NextResponse.json(intervention, { status: 201 })
}
