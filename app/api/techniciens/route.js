import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function GET() {
  const authError = requireAdminAuth()
  if (authError) return authError

  const techs = await prisma.technicien.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json(techs)
}

export async function POST(request) {
  const authError = requireAdminAuth()
  if (authError) return authError

  const body = await request.json()

  if (!body.nom) {
    return NextResponse.json({ error: 'Le champ nom est requis' }, { status: 400 })
  }

  const tech = await prisma.technicien.create({ data: body })
  return NextResponse.json(tech, { status: 201 })
}
