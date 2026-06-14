export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const data = await req.json()

    // Check if product already has an active hold
    const existingHold = await prisma.reservation.findFirst({
      where: {
        productId: Number(data.productId),
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })
    if (existingHold) {
      return NextResponse.json({ error: 'This item is already on hold' }, { status: 409 })
    }

    // For deal reservations, check if deal was already claimed today
    if (data.dealId) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dealClaimed = await prisma.reservation.findFirst({
        where: {
          dealId: Number(data.dealId),
          createdAt: { gte: today, lt: tomorrow },
          status: { in: ['pending', 'confirmed'] }
        }
      })
      if (dealClaimed) {
        return NextResponse.json({ error: 'This deal has already been claimed today' }, { status: 409 })
      }
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
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
