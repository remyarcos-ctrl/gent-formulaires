import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { technicien: true, intervention: true, pv_reception: true },
  })
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function PATCH(request, { params }) {
  const body = await request.json()
  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: body,
    include: { technicien: true },
  })
  return NextResponse.json(deal)
}
