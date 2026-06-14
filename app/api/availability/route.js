export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Returns which product IDs currently have active holds
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []

    const holds = await prisma.reservation.findMany({
      where: {
        productId: ids.length ? { in: ids } : undefined,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: { productId: true, type: true }
    })

    // Check if today's deal has been claimed
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dealClaimed = await prisma.reservation.findFirst({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: { in: ['pending', 'confirmed'] },
        dealId: { not: null }
      }
    })

    const heldProductIds = [...new Set(holds.map(h => h.productId))]

    return NextResponse.json({
      heldProductIds,
      dealClaimedToday: !!dealClaimed
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
