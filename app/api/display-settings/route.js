export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_VISIBLE = [
  'manufacturer','model','caliber','action','barrelLength',
  'magazineCapacity','condition','atfType','cartridge'
]

export async function GET() {
  try {
    let settings = await prisma.displaySettings.findFirst()
    if (!settings) {
      settings = await prisma.displaySettings.create({
        data: { visibleFields: DEFAULT_VISIBLE }
      })
    }
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { visibleFields } = await req.json()
    let settings = await prisma.displaySettings.findFirst()
    if (settings) {
      settings = await prisma.displaySettings.update({
        where: { id: settings.id },
        data: { visibleFields }
      })
    } else {
      settings = await prisma.displaySettings.create({ data: { visibleFields } })
    }
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
