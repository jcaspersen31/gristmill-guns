export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const data = await req.json()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48hr hold
    const reservation = await prisma.reservation.create({
      data: {
        productId:     Number(data.productId),
        dealId:        data.dealId ? Number(data.dealId) : null,
        customerName:  data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        amountPaid:    Number(data.amountPaid),
        type:          data.type,
        status:        'pending',
        expiresAt,
      },
    })
    return NextResponse.json(reservation, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { product: true, deal: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reservations)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
