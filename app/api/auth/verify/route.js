export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { token } = await req.json()
    const link = await prisma.magicLink.findUnique({ where: { token } })

    if (!link) return NextResponse.json({ error: 'Invalid link' }, { status: 401 })
    if (link.usedAt) return NextResponse.json({ error: 'This link has already been used' }, { status: 401 })
    if (link.expiresAt < new Date()) return NextResponse.json({ error: 'This link has expired' }, { status: 401 })

    await prisma.magicLink.update({ where: { token }, data: { usedAt: new Date() } })

    const res = NextResponse.json({ success: true, email: link.email })
    res.cookies.set('gm_customer_email', link.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
