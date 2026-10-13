'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { initiateMonerooPayment } from '@/lib/moneroo'
import { CURRENCY, getPack } from '@/lib/pricing'

async function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
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
      montant: pack.price,
      devise: CURRENCY,
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
    amount: pack.price,
    currency: CURRENCY,
    description: `Laplead — ${pack.name} (${pack.credits} crédits)`,
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
