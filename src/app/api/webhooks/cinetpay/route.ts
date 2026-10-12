import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cpm_trans_id, cpm_result } = body

    if (!cpm_trans_id) {
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const isAccepted = cpm_result === '00'

    await adminSupabase.rpc('process_payment_webhook', {
      txn_id_param: cpm_trans_id,
      p_statut: isAccepted ? 'ACCEPTED' : 'REFUSED',
      p_reponse: body,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
