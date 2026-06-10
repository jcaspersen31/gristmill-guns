export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.setting.findMany()
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
