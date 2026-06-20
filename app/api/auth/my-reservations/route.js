export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const email = cookieStore.get('gm_customer_email')?.value
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const reservations = await prisma.reservation.findMany({
      where: { customerEmail: email },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ email, reservations })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
