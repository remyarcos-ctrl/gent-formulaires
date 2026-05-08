import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { checkLoginRateLimit, resetLoginAttempts } from '@/lib/auth'

export async function POST(request) {
  // Récupération de l'IP pour le rate limiting
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const rateLimit = checkLoginRateLimit(ip)
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${rateLimit.minutesLeft} minute(s).` },
      { status: 429 }
    )
  }

  const { password } = await request.json()

  if (password === (process.env.ADMIN_PASSWORD || 'happyconfort2024')) {
    resetLoginAttempts(ip)
    const cookieStore = cookies()
    cookieStore.set('hc_admin_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
}
