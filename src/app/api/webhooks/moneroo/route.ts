import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMonerooSignature } from '@/lib/moneroo'
import { settleMonerooPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// URL à déclarer dans le dashboard Moneroo (Developers → Webhooks) :
//   https://<domaine>/api/webhooks/moneroo
export async function POST(request: Request) {
  // La signature porte sur les octets bruts : .text() et surtout pas .json().
  const rawBody = await request.text()

  if (!verifyMonerooSignature(rawBody, request.headers.get('x-moneroo-signature'))) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let body: { event?: string; data?: { id?: string; metadata?: { paymentId?: string } } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  // payment.initiated est informatif : la ligne est déjà "pending" depuis le checkout.
  if (!['payment.success', 'payment.failed', 'payment.cancelled'].includes(body.event ?? '')) {
    return NextResponse.json({ received: true, ignored: true })
  }

  let paymentId = body.data?.metadata?.paymentId
  if (!paymentId || !UUID_RE.test(paymentId)) {
    // Repli : retrouver la ligne via l'id Moneroo (py_…).
    if (!body.data?.id) return NextResponse.json({ received: true, ignored: true })
    const { data: payment } = await createAdminClient()
      .from('payments')
      .select('id')
      .eq('transaction_id', body.data.id)
      .maybeSingle()
    if (!payment) return NextResponse.json({ received: true, ignored: true })
    paymentId = payment.id as string
  }

  // Le webhook ne sert que de déclencheur : le statut est re-vérifié auprès de l'API Moneroo.
  const statut = await settleMonerooPayment(paymentId)
  return NextResponse.json({ received: true, statut })
}
