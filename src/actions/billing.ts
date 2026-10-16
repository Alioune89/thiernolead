'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { initiateMonerooPayment } from '@/lib/moneroo'
import { getAppUrl } from '@/lib/app-url'
import { CURRENCY, getPack, type CreditPack } from '@/lib/pricing'

// Mode test local : la passerelle de test Moneroo n'accepte que l'USD en sandbox.
// MONEROO_TEST_CURRENCY=USD (dans .env.local uniquement) facture l'équivalent en dollars.
// Jamais actif en production, même si la variable y était définie par erreur.
const XOF_PER_USD = 600

function getCheckoutPrice(pack: CreditPack): { amount: number; currency: string } {
  if (process.env.NODE_ENV !== 'production' && process.env.MONEROO_TEST_CURRENCY === 'USD') {
    return { amount: Math.max(1, Math.ceil(pack.price / XOF_PER_USD)), currency: 'USD' }
  }
  return { amount: pack.price, currency: CURRENCY }
}

export async function buyCredits(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Le prix est relu côté serveur : seul l'identifiant du pack vient du formulaire.
  const pack = getPack(String(formData.get('pack_id') ?? ''))
  if (!pack) redirect('/billing?error=invalid_pack')

  // Moneroo exige un email client.
  if (!user.email) redirect('/billing?error=email_required')

  const adminSupabase = createAdminClient()
  const { amount, currency } = getCheckoutPrice(pack)

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('nom_expediteur')
    .eq('id', user.id)
    .single()

  // 1. Ligne "pending" AVANT d'appeler Moneroo (le webhook peut arriver avant la réponse).
  const { data: payment, error: paymentError } = await adminSupabase
    .from('payments')
    .insert({
      user_id: user.id,
      provider: 'moneroo',
      pack: pack.id,
      montant: amount,
      devise: currency,
      credits: pack.credits,
      statut: 'pending',
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    console.error('[billing] insert payment', paymentError)
    redirect('/billing?error=payment_init')
  }

  // 2. Initialisation du checkout hébergé Moneroo.
  // "ref" et non "paymentId" : Moneroo ajoute son propre ?paymentId=… à l'URL de retour.
  const appUrl = await getAppUrl()
  const result = await initiateMonerooPayment({
    amount,
    currency,
    description: `Laplead — ${pack.name} (${pack.credits} crédits)${currency === CURRENCY ? '' : ' [TEST]'}`,
    returnUrl: `${appUrl}/billing/retour?ref=${payment.id}`,
    customerEmail: user.email,
    customerName: profile?.nom_expediteur ?? undefined,
    metadata: { paymentId: payment.id, userId: user.id, packId: pack.id },
  })

  if (!result.ok) {
    console.error('[billing] moneroo initialize', result.error)
    await adminSupabase
      .from('payments')
      .update({ statut: 'failed', failure_reason: result.error, updated_at: new Date().toISOString() })
      .eq('id', payment.id)
    redirect('/billing?error=payment_init')
  }

  await adminSupabase
    .from('payments')
    .update({
      transaction_id: result.providerTransactionId,
      checkout_url: result.checkoutUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  // 3. Redirection vers la page de paiement Moneroo (Wave, Orange Money, MTN, carte…).
  redirect(result.checkoutUrl)
}
