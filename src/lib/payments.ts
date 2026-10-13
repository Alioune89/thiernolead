import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMonerooPayment } from '@/lib/moneroo'

export type PaymentStatus = 'pending' | 'completed' | 'failed'

/**
 * Règle un paiement à partir de l'état RÉEL chez Moneroo (re-query API).
 * Appelé par le webhook et par la page de retour : ni le corps du webhook ni
 * les paramètres d'URL ne suffisent à créditer un compte.
 * Idempotent : la RPC complete_payment ne crédite qu'une seule fois.
 */
export async function settleMonerooPayment(paymentId: string): Promise<PaymentStatus | null> {
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, statut, montant, devise, transaction_id')
    .eq('id', paymentId)
    .single()

  if (!payment) return null
  if (payment.statut !== 'pending' || !payment.transaction_id) return payment.statut as PaymentStatus

  const live = await verifyMonerooPayment(payment.transaction_id)
  if (!live) return 'pending'

  let statut: 'completed' | 'failed' | null = null
  let failureReason: string | null = null

  if (live.status === 'success' || live.status === 'succeeded') {
    // Protection contre la falsification de montant : Moneroo règle en totalité.
    const amountOk = live.amount === payment.montant
    const currencyOk = !live.currency || live.currency.toUpperCase() === String(payment.devise).toUpperCase()
    if (amountOk && currencyOk) {
      statut = 'completed'
    } else {
      statut = 'failed'
      failureReason = `Montant incohérent : attendu ${payment.montant} ${payment.devise}, reçu ${live.amount} ${live.currency}`
      console.error('[moneroo] montant incohérent', { paymentId, live })
    }
  } else if (live.status === 'failed' || live.status === 'cancelled') {
    statut = 'failed'
    failureReason = live.status
  }

  if (!statut) return 'pending'

  const { data, error } = await admin.rpc('complete_payment', {
    p_payment_id: payment.id,
    p_statut: statut,
    p_reponse: live.raw,
    p_failure_reason: failureReason,
  })

  if (error) {
    console.error('[moneroo] complete_payment', error)
    return 'pending'
  }

  return (data as PaymentStatus | null) ?? statut
}
