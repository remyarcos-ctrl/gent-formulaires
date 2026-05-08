const JOTFORM_BASE = 'https://eu-api.jotform.com'
// Clés sensibles — définir dans .env.local (ne jamais hardcoder)
const JOTFORM_KEY = process.env.JOTFORM_API_KEY || process.env.JOTFORM_KEY
const FORM_ID = process.env.JOTFORM_FORM_ID

if (!JOTFORM_KEY || !FORM_ID) {
  console.error('[JotForm] Variables manquantes : JOTFORM_API_KEY et JOTFORM_FORM_ID requis dans .env.local')
}

export async function getFormStructure() {
  const res = await fetch(`${JOTFORM_BASE}/form/${FORM_ID}/questions?apiKey=${JOTFORM_KEY}`)
  const data = await res.json()
  return data.content
}

export async function submitForm(formData) {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(formData)) {
    body.append(key, value)
  }

  const res = await fetch(`${JOTFORM_BASE}/form/${FORM_ID}/submissions?apiKey=${JOTFORM_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json()
  return data.content
}

export async function getSubmissions(limit = 100) {
  const res = await fetch(
    `${JOTFORM_BASE}/form/${FORM_ID}/submissions?apiKey=${JOTFORM_KEY}&limit=${limit}&orderby=created_at,DESC`
  )
  const data = await res.json()
  return data.content
}
