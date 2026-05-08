import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Vérification du cookie admin — utilisé dans toutes les routes API protégées
export function requireAdminAuth() {
  const cookieStore = cookies()
  const auth = cookieStore.get('hc_admin_auth')
  if (!auth || auth.value !== 'authenticated') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return null
}

// Rate limiting en mémoire — max 10 tentatives par IP par fenêtre de 15 min
const loginAttempts = new Map()

export function checkLoginRateLimit(ip) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const max = 10

  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + windowMs }

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  loginAttempts.set(ip, record)

  if (record.count > max) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000)
    return { blocked: true, minutesLeft }
  }

  return { blocked: false }
}

export function resetLoginAttempts(ip) {
  loginAttempts.delete(ip)
}
