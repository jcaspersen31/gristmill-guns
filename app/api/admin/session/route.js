export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('gm_admin_session')
  return NextResponse.json({ authenticated: session?.value === 'gm_authenticated' })
}
