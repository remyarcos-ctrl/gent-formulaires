import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST(request, { params }) {
  const { technicien_id, canal } = await request.json()

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { technicien: true },
  })
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const technicien = await prisma.technicien.findUnique({ where: { id: technicien_id } })
  if (!technicien) return NextResponse.json({ error: 'Technicien not found' }, { status: 404 })

  const clientNom = `${deal.client_prenom || ''} ${deal.client_nom || ''}`.trim() || 'Client'
  const adresse = `${deal.client_adresse || ''}, ${deal.client_ville || ''}`.trim().replace(/^,\s*/, '')

  const intervention = await prisma.intervention.create({
    data: {
      deal_id: deal.id,
      technicien: technicien.nom,
      client_nom: clientNom,
      client_email: deal.client_email,
      client_telephone: deal.client_telephone,
      type_chantier: deal.produits?.join(', ') || 'Installation',
      adresse: adresse || 'Adresse à confirmer',
    },
  })

  const pv = await prisma.pvReception.create({
    data: {
      deal_id: deal.id,
      intervention_id: intervention.id,
    },
  })

  const updatedDeal = await prisma.deal.update({
    where: { id: params.id },
    data: { technicien_id, statut: 'assigné' },
    include: { intervention: true, pv_reception: true },
  })

  let notification = null
  try {
    notification = await sendNotification(technicien, updatedDeal, canal || 'whatsapp')
  } catch (e) {
    console.error('Notification error:', e.message)
  }

  return NextResponse.json({ ok: true, intervention, pv, notification })
}
