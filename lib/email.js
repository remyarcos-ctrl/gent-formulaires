export async function sendPvEmail(deal, pvId) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !deal.client_email) return { sent: false, reason: 'missing api key or email' }

  const pvUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gent-formulaires-hc.vercel.app'}/pv/${pvId}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Happy Confort <noreply@happyconfort.fr>',
      to: deal.client_email,
      subject: `Votre PV de réception Happy Confort`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Happy Confort</h2>
          <p>Bonjour ${deal.client_prenom || ''} ${deal.client_nom || ''},</p>
          <p>Votre procès-verbal de réception de chantier a été signé.</p>
          <p>Vous pouvez le consulter et l'imprimer ici :</p>
          <a href="${pvUrl}" style="display:inline-block;background:#0284c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Voir mon PV de réception
          </a>
          <p style="color:#666;font-size:12px;margin-top:24px;">Happy Confort — ${deal.client_adresse || ''}, ${deal.client_ville || ''}</p>
        </div>
      `,
    }),
  })

  return { sent: res.ok, status: res.status }
}
