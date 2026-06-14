export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const { slug } = await params
    const post = await prisma.post.findUnique({ where: { slug } })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { slug } = await params
    const data = await req.json()
    const post = await prisma.post.update({
      where: { slug },
      data: {
        title:      data.title,
        body:       data.body,
        excerpt:    data.excerpt || null,
        coverImage: data.coverImage || null,
        published:  data.published || false,
        publishedAt: data.published ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
      }
    })
    return NextResponse.json(post)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { slug } = await params
    await prisma.post.delete({ where: { slug } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
