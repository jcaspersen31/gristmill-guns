export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids') || ''
    const ids = idsParam.split(',').map(Number).filter(Boolean)

    // Check product holds
    const holds = ids.length ? await prisma.reservation.findMany({
      where: {
        productId: { in: ids },
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: { productId: true }
    }) : []

    // Check if today's deal has been claimed
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dealClaimed = await prisma.reservation.findFirst({
      where: {
        dealId: { not: null },
        status: { in: ['pending', 'confirmed'] },
        createdAt: { gte: today, lt: tomorrow }
      }
    })

    return NextResponse.json({
      heldProductIds: [...new Set(holds.map(h => h.productId))],
      dealClaimedToday: !!dealClaimed
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
