export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function sendToKlaviyo(reservation, product) {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['klaviyo_api_key', 'klaviyo_list_id'] } }
    })
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
    const apiKey = settingsMap['klaviyo_api_key']
    const listId = settingsMap['klaviyo_list_id']

    if (!apiKey) return // Not configured yet

    const headers = {
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-02-15',
    }

    // 1. Create/update profile
    const profileRes = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email:        reservation.customerEmail,
            phone_number: reservation.customerPhone,
            first_name:   reservation.customerName.split(' ')[0],
            last_name:    reservation.customerName.split(' ').slice(1).join(' ') || '',
            properties: {
              last_reservation_product: product?.name,
              last_reservation_type:    reservation.type,
              last_reservation_amount:  reservation.amountPaid,
            }
          }
        }
      })
    })

    // 2. Add to list if configured
    if (listId) {
      const profileData = await profileRes.json()
      const profileId = profileData?.data?.id
      if (profileId) {
        await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            data: [{ type: 'profile', id: profileId }]
          })
        })
      }
    }

    // 3. Track reservation event
    await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: 'Gun Reserved' } } },
            profile: { data: { type: 'profile', attributes: { email: reservation.customerEmail } } },
            properties: {
              product_name:   product?.name,
              product_id:     product?.id,
              category:       product?.category,
              caliber:        product?.caliber,
              amount_paid:    reservation.amountPaid,
              type:           reservation.type,
              reservation_id: reservation.id,
              expires_at:     reservation.expiresAt,
            },
            value: reservation.amountPaid,
          }
        }
      })
    })
  } catch (e) {
    // Klaviyo errors should never break the reservation flow
    console.error('Klaviyo error:', e.message)
  }
}

export async function POST(req) {
  try {
    const data = await req.json()

    // Check if product already has an active hold
    const existingHold = await prisma.reservation.findFirst({
      where: {
        productId: Number(data.productId),
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })
    if (existingHold) {
      return NextResponse.json({ error: 'This item is already on hold' }, { status: 409 })
    }

    // For deal reservations, check if deal was already claimed today
    if (data.dealId) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dealClaimed = await prisma.reservation.findFirst({
        where: {
          dealId: Number(data.dealId),
          createdAt: { gte: today, lt: tomorrow },
          status: { in: ['pending', 'confirmed'] }
        }
      })
      if (dealClaimed) {
        return NextResponse.json({ error: 'This deal has already been claimed today' }, { status: 409 })
      }
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const reservation = await prisma.reservation.create({
      data: {
        productId:     Number(data.productId),
        dealId:        data.dealId ? Number(data.dealId) : null,
        customerName:  data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        amountPaid:    Number(data.amountPaid),
        type:          data.type,
        status:        'pending',
        expiresAt,
      },
      include: { product: true }
    })

    // Send to Klaviyo async — don't await, don't block response
    sendToKlaviyo(reservation, reservation.product)

    return NextResponse.json(reservation, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { product: true, deal: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reservations)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
