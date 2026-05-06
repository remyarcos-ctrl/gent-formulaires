import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: { technicien: true, intervention: true, pv_reception: true },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(deals)
}

export async function POST(request) {
  const body = await request.json()
  const deal = await prisma.deal.create({ data: body })
  return NextResponse.json(deal, { status: 201 })
}
