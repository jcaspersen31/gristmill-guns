export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limitParam = parseInt(searchParams.get('limit') || '24')
    const limit    = Math.min(limitParam > 100 ? 1000 : 48, limitParam)
    const category = searchParams.get('category') || ''
    const search   = searchParams.get('search')   || ''

    const where = {
      active: true,
      ...(category && category !== 'All' ? { category } : {}),
      ...(search ? {
        OR: [
          { name:         { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
          { model:        { contains: search, mode: 'insensitive' } },
          { caliber:      { contains: search, mode: 'insensitive' } },
          { sku:          { contains: search, mode: 'insensitive' } },
          { upc:          { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const product = await prisma.product.create({
      data: {
        name:            data.name,
        category:        data.category,
        price:           Number(data.price),
        salePrice:       data.salePrice ? Number(data.salePrice) : null,
        msrp:            data.msrp ? Number(data.msrp) : null,
        onSale:          data.onSale || false,
        discountValue:   data.discountValue || null,
        description:     data.description || null,
        specs:           data.specs || null,
        imageUrl:        data.imageUrl || null,
        deposit:         Number(data.deposit) || 0,
        serialNumber:    data.serialNumber || null,
        sku:             data.sku || null,
        upc:             data.upc || null,
        manufacturer:    data.manufacturer || null,
        model:           data.model || null,
        partNumber:      data.partNumber || null,
        caliber:         data.caliber || null,
        atfType:         data.atfType || null,
        cartridge:       data.cartridge || null,
        action:          data.action || null,
        barrelLength:    data.barrelLength || null,
        overallLength:   data.overallLength || null,
        magazineCapacity:data.magazineCapacity || null,
        magazineType:    data.magazineType || null,
        condition:       data.condition || null,
        quantityOnHand:  data.quantityOnHand != null ? Number(data.quantityOnHand) : null,
        reorderLevel:    data.reorderLevel != null ? Number(data.reorderLevel) : null,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
