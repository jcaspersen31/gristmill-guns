export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { reservationId, amount, description, email, name } = await req.json()

    // Get credentials from settings
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['firstpay_transcenter_id', 'firstpay_gateway_id'] } }
    })
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]))
    const transcenterId = s['firstpay_transcenter_id']
    const gatewayId = s['firstpay_gateway_id']

    if (!transcenterId || !gatewayId) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    }

    // 1stPayGateway uses Authorize.Net compatible API
    // Build the payment request
    const params = new URLSearchParams({
      x_login:          transcenterId,
      x_tran_key:       gatewayId,
      x_version:        '3.1',
      x_type:           'AUTH_CAPTURE',
      x_method:         'CC',
      x_amount:         amount.toFixed(2),
      x_description:    description,
      x_email:          email,
      x_first_name:     name.split(' ')[0],
      x_last_name:      name.split(' ').slice(1).join(' ') || '',
      x_invoice_num:    String(reservationId),
      x_relay_response: 'FALSE',
      x_delim_data:     'TRUE',
      x_delim_char:     '|',
    })

    // Return the gateway URL and params for client-side form POST
    // Card data goes directly to 1stPayGateway, never through our server
    return NextResponse.json({
      gatewayUrl: 'https://secure.1stpaygateway.net/secure/gateway/aegateway.aspx',
      params: Object.fromEntries(params),
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
