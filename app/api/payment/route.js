export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { reservationId, amount, description, email, name } = await req.json()

    // Get credentials from settings
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['firstpay_transcenter_id', 'firstpay_gateway_id', 'firstpay_merchant_key', 'firstpay_checkout_url'] } }
    })
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]))

    // Option 1: Hosted checkout URL (simplest — just redirect with params)
    if (s['firstpay_checkout_url']) {
      const params = new URLSearchParams({
        amount:      amount.toFixed(2),
        order_id:    String(reservationId),
        description,
        email,
        name,
      })
      return NextResponse.json({
        redirectUrl: `${s['firstpay_checkout_url']}?${params.toString()}`
      })
    }

    // Option 2: Web Payment Portal
    const transcenterId = s['firstpay_transcenter_id']
    const merchantKey = s['firstpay_merchant_key']

    if (!transcenterId) {
      return NextResponse.json({ configured: false })
    }

    // 1stPayGateway Web Payment Portal URL
    // Customer fills in card details on their hosted page
    const portalUrl = `https://secure.1stpaygateway.net/secure/paymentform/paymentform.aspx`
    const params = new URLSearchParams({
      TransCenterID: transcenterId,
      Amount:        amount.toFixed(2),
      OrderID:       String(reservationId),
      Description:   description,
      Email:         email,
      Name:          name,
      ...(merchantKey ? { MerchantKey: merchantKey } : {}),
    })

    return NextResponse.json({
      redirectUrl: `${portalUrl}?${params.toString()}`
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
