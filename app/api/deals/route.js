import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function GET() {
  const authError = requireAdminAuth()
  if (authError) return authError

  const deals = await prisma.deal.findMany({
    include: { technicien: true, intervention: true, pv_reception: true },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(deals)
}

export async function POST(request) {
  const authError = requireAdminAuth()
  if (authError) return authError

  const body = await request.json()

  // Validation des champs obligatoires
  if (!body.clientNom && !body.clientPrenom && !body.clientEmail && !body.clientTel) {
    return NextResponse.json(
      { error: 'Au moins un champ client est requis (nom, prénom, email ou téléphone)' },
      { status: 400 }
    )
  }

  const deal = await prisma.deal.create({ data: body })
  return NextResponse.json(deal, { status: 201 })
}
