export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FALLBACK_PASS = 'gristmill2024'
const COOKIE_NAME = 'gm_admin_session'
const SESSION_TOKEN = 'gm_authenticated'

export async function POST(req) {
  try {
    const { password } = await req.json()
    const row = await prisma.setting.findUnique({ where: { key: 'admin_password' } })
    const storedPw = row?.value || FALLBACK_PASS

    if (password !== storedPw) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE_NAME, SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
