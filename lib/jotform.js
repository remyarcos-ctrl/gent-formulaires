const JOTFORM_BASE = 'https://eu-api.jotform.com'
const JOTFORM_KEY = process.env.JOTFORM_KEY || 'fe63b6658c5fecc581fdc308ef48664f'
const FORM_ID = process.env.JOTFORM_FORM_ID || '241082386472054'

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
