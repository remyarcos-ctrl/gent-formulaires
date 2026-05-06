const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gent-formulaires-hc.vercel.app'

function buildMessage(technicien, deal) {
  const interventionUrl = `${APP_URL}/intervention/${deal.intervention?.id}`
  const pvUrl = `${APP_URL}/pv/${deal.pv_reception?.id}`
  return `Bonjour ${technicien.nom} 👋

Nouvelle mission Happy Confort :
📋 Client : ${deal.client_prenom || ''} ${deal.client_nom || ''}
📍 ${deal.client_adresse || ''}, ${deal.client_ville || ''}
🔧 ${(deal.produits || []).join(', ')}

✅ Fiche intervention :
${interventionUrl}

📄 PV de réception :
${pvUrl}`
}

export function buildWhatsAppUrl(technicien, deal) {
  const phone = technicien.telephone.replace(/\D/g, '')
  const message = buildMessage(technicien, deal)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export async function sendTelegram(technicien, deal) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = technicien.telegram_chat_id
  if (!token || !chatId) return { sent: false, reason: 'missing token or chat_id' }

  const message = buildMessage(technicien, deal)
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  })
  const data = await res.json()
  return { sent: data.ok, reason: data.description }
}

export async function sendNotification(technicien, deal, canal = 'whatsapp') {
  if (canal === 'telegram') {
    const result = await sendTelegram(technicien, deal)
    return { canal: 'telegram', ...result }
  }
  // Default: WhatsApp wa.me link (admin clicks it)
  const waUrl = buildWhatsAppUrl(technicien, deal)
  return { canal: 'whatsapp', waUrl, sent: false }
}
