'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startGoogleMapsScraper } from '@/lib/apify'
import { failSearch } from '@/lib/search-runs'
import { getAppUrl } from '@/lib/app-url'
import { CREDITS_PER_SEARCH, SEARCH_VOLUMES } from '@/lib/pricing'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createSearch(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const secteur = formData.get('secteur') as string
  const pays = formData.get('pays') as string
  const ville = formData.get('ville') as string
  const requestedResults = parseInt(formData.get('max_results') as string, 10)
  const maxResults = (SEARCH_VOLUMES as readonly number[]).includes(requestedResults) ? requestedResults : SEARCH_VOLUMES[1]
  const withEmails = false

  // Coût fixe par génération de leads, quel que soit le volume demandé.
  const totalCost = CREDITS_PER_SEARCH
  const adminSupabase = createAdminClient()

  // 1. Déduire les crédits
  const { error: creditError } = await adminSupabase.rpc('spend_credits', {
    user_id_param: user.id,
    amount: totalCost,
    motif_param: 'reservation_recherche',
  })

  if (creditError) {
    redirect('/billing?error=insufficient_credits')
  }

  // 2. Créer la recherche (running)
  const { data: search, error: searchError } = await adminSupabase
    .from('searches')
    .insert({
      user_id: user.id,
      secteur,
      ville,
      pays,
      max_results: maxResults,
      with_emails: withEmails,
      credits_reserved: totalCost,
      statut: 'running'
    })
    .select()
    .single()

  if (searchError || !search) {
    console.error('searchError:', searchError)
    await adminSupabase.rpc('add_credits', {
      user_id_param: user.id, amount: totalCost, motif_param: 'remboursement'
    })
    throw new Error('Erreur de création: ' + (searchError?.message || 'Inconnue'))
  }

  // 3. Démarrer le run Apify (~1 s) sans attendre sa fin. Rien ne tourne en arrière-plan :
  // sur Vercel la fonction est gelée dès la réponse envoyée, ce qui bloquait les recherches
  // « En cours » (surtout sur mobile, où la page est mise en veille). La fin du run est détectée
  // par reconcileSearch (polling de la page, dashboard, webhook Apify).
  try {
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET
    const runId = await startGoogleMapsScraper({
      searchId: search.id,
      sector: secteur,
      city: ville,
      country: pays,
      maxResults,
      withEmails,
      webhookUrl: webhookSecret
        ? `${await getAppUrl()}/api/webhooks/apify?secret=${encodeURIComponent(webhookSecret)}`
        : undefined,
    })
    await adminSupabase.from('searches').update({ apify_run_id: runId }).eq('id', search.id)
  } catch (error) {
    console.error('Erreur démarrage Apify:', error)
    await failSearch(search, "L'extraction n'a pas pu démarrer. Relancez la recherche.")
  }

  // 4. Rediriger immédiatement l'utilisateur vers la page d'attente
  revalidatePath('/dashboard')
  redirect(`/searches/${search.id}`)
}
