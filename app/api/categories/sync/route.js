export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find all unique category strings used in products
    const productCats = await prisma.product.groupBy({
      by: ['category'],
      where: { active: true, category: { not: null } },
      _count: { id: true },
    })

    const existing = await prisma.category.findMany({ select: { name: true } })
    const existingNames = new Set(existing.map(c => c.name))

    const missing = productCats
      .map(c => c.category)
      .filter(c => c && !existingNames.has(c))

    const created = []
    for (const name of missing) {
      const count = await prisma.category.count()
      const cat = await prisma.category.create({ data: { name, sortOrder: count } })
      created.push(cat)
    }

    return NextResponse.json({ created, count: created.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
