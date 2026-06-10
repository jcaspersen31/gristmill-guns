export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data: { status },
      include: { product: true },
    })
    return NextResponse.json(reservation)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
