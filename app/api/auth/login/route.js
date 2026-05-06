import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  const { password } = await request.json()

  if (password === (process.env.ADMIN_PASSWORD || 'happyconfort2024')) {
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

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
