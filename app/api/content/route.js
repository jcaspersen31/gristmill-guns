export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.content.findMany()
    return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        prisma.content.upsert({
          where: { key },
          update: { value: value ?? '' },
          create: { key, value: value ?? '' },
        })
      )
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
