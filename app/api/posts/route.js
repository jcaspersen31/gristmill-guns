export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true' // admin gets all, public gets published only
    const posts = await prisma.post.findMany({
      where: all ? {} : { published: true },
      orderBy: { publishedAt: 'desc' },
      select: { id:true, title:true, slug:true, excerpt:true, coverImage:true, published:true, publishedAt:true, createdAt:true }
    })
    return NextResponse.json(posts)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const slug = makeSlug(data.title)
    const post = await prisma.post.create({
      data: {
        title:      data.title,
        slug,
        body:       data.body,
        excerpt:    data.excerpt || null,
        coverImage: data.coverImage || null,
        published:  data.published || false,
        publishedAt: data.published ? new Date() : null,
      }
    })
    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
