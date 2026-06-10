export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const deals = await prisma.dealQueue.findMany({
      where: { active: true },
      include: { product: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(deals)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const count = await prisma.dealQueue.count({ where: { active: true } })
    const deal = await prisma.dealQueue.create({
      data: {
        productId:   Number(data.productId),
        discountPct: Number(data.discountPct),
        sortOrder:   count,
      },
      include: { product: true },
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
