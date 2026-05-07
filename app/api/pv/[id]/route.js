import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const pv = await prisma.pvReception.findUnique({
    where: { id: params.id },
    include: {
      deal: { include: { technicien: true } },
      intervention: true,
    },
  })
  if (!pv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pv)
}

export async function PATCH(request, { params }) {
  const body = await request.json()
  const pv = await prisma.pvReception.update({
    where: { id: params.id },
    data: body,
    include: { deal: { include: { technicien: true } } },
  })
  return NextResponse.json(pv)
}
