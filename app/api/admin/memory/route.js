import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const MEMORY_ID = 'singleton'

export async function GET() {
  const mem = await prisma.adminMemory.findUnique({ where: { id: MEMORY_ID } })
  return NextResponse.json({ conversation: mem?.conversation || [] })
}

export async function PATCH(request) {
  const { conversation } = await request.json()
  // Keep only last 60 messages to manage context window
  const trimmed = Array.isArray(conversation) ? conversation.slice(-60) : []
  const mem = await prisma.adminMemory.upsert({
    where: { id: MEMORY_ID },
    update: { conversation: trimmed },
    create: { id: MEMORY_ID, conversation: trimmed },
  })
  return NextResponse.json({ ok: true, count: trimmed.length })
}
