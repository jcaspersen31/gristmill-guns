export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Count products by category string since import uses string not relation
    const counts = await prisma.product.groupBy({
      by: ['category'],
      where: { active: true },
      _count: { id: true },
    })
    const countMap = Object.fromEntries(counts.map(c => [c.category, c._count.id]))

    // Also find categories in products that don't have a Category record
    const allProductCats = counts.map(c => c.category).filter(Boolean)
    const knownCats = cats.map(c => c.name)
    const missingCats = allProductCats.filter(c => !knownCats.includes(c))

    const result = cats.map(c => ({ ...c, productCount: countMap[c.name] || 0 }))

    return NextResponse.json({ categories: result, missingCategories: missingCats })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json()
    const count = await prisma.category.count()
    const cat = await prisma.category.create({
      data: { name, sortOrder: count }
    })
    return NextResponse.json(cat, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
