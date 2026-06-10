export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0 }
  return () => { h ^= h >>> 13; h ^= h << 17; h ^= h >>> 5; return (h >>> 0) / 4294967296 }
}

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if we already picked a deal today
    const existing = await prisma.dealHistory.findUnique({
      where: { ranOn: today },
      include: { deal: { include: { product: true } } },
    })
    if (existing) return NextResponse.json(existing.deal)

    // Get all active deals
    const allDeals = await prisma.dealQueue.findMany({
      where: { active: true },
      include: { product: true },
    })
    if (!allDeals.length) return NextResponse.json(null)

    // Find deals not yet used in current cycle
    const usedIds = (await prisma.dealHistory.findMany({
      select: { dealId: true },
      orderBy: { ranOn: 'desc' },
      take: allDeals.length,
    })).map(h => h.dealId)

    const remaining = allDeals.filter(d => !usedIds.includes(d.id))
    const pool = remaining.length ? remaining : allDeals

    // Pick deterministically based on today's date
    const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
    const rng = seededRandom(dateKey)
    const pick = pool[Math.floor(rng() * pool.length)]

    // Record it
    await prisma.dealHistory.create({
      data: { dealId: pick.id, productId: pick.productId, ranOn: today },
    })

    return NextResponse.json(pick)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
