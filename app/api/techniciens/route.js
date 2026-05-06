import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const techs = await prisma.technicien.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json(techs)
}

export async function POST(request) {
  const body = await request.json()
  const tech = await prisma.technicien.create({ data: body })
  return NextResponse.json(tech, { status: 201 })
}
