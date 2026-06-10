export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    await prisma.dealQueue.update({
      where: { id: Number(id) },
      data: { active: false },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
