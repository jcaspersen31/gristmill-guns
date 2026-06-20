export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await prisma.magicLink.create({
      data: { token, email: email.toLowerCase(), expiresAt }
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gristmillguns.com'
    const link = `${baseUrl}/my-reservations/verify?token=${token}`

    // Send via Resend if configured
    const resendKeyRow = await prisma.setting.findUnique({ where: { key: 'resend_api_key' } })
    const resendKey = resendKeyRow?.value

    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Gristmill Guns & Optics <noreply@gristmillguns.com>',
          to: email,
          subject: 'Your reservation login link',
          html: `<p>Click below to view your reservations. This link expires in 15 minutes.</p><p><a href="${link}">View My Reservations</a></p>`,
        }),
      }).catch(() => {}) // don't fail the request if email fails
    }

    // Always return success regardless of email outcome (don't leak whether email exists)
    return NextResponse.json({ success: true, devLink: resendKey ? undefined : link })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
