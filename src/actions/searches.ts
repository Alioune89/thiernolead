'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runGoogleMapsScraperSync } from '@/lib/apify'
import { normalizeLeads } from '@/lib/normalize'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createSearch(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const secteur = formData.get('secteur') as string
  const pays = formData.get('pays') as string
  const ville = formData.get('ville') as string
  const maxResults = parseInt(formData.get('max_results') as string, 10)
  const withEmails = false 

  const costPerLead = withEmails ? 2 : 1
  const totalCost = maxResults * costPerLead
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

  // On lance l'opération d'extraction en asynchrone (non-bloquant pour la réponse HTTP)
  process.nextTick(async () => {

    try {
      const { runId, items } = await runGoogleMapsScraperSync({
        searchId: search.id,
        sector: secteur,
        city: ville,
        country: pays,
        maxResults,
        withEmails,
      })

      const formattedLeads = normalizeLeads(items, search.id, search.user_id)

      if (formattedLeads.length > 0) {
        await adminSupabase.from('leads').upsert(formattedLeads, { onConflict: 'search_id,place_id', ignoreDuplicates: true })
      }

      const leadsCount = formattedLeads.length
      const creditsUsed = leadsCount * costPerLead
      const creditsRefund = Math.max(0, search.credits_reserved - creditsUsed)

      if (creditsRefund > 0) {
        await adminSupabase.rpc('add_credits', {
          user_id_param: search.user_id,
          amount: creditsRefund,
          motif_param: 'remboursement_non_utilises',
        })
      }

      await adminSupabase
        .from('searches')
        .update({ statut: 'succeeded', results_count: leadsCount, credits_billed: creditsUsed, apify_run_id: runId })
        .eq('id', search.id)
        
    } catch (error) {
      console.error("Erreur Apify Background:", error)
      await adminSupabase.rpc('add_credits', { user_id_param: search.user_id, amount: totalCost, motif_param: 'erreur' })
      await adminSupabase.from('searches').update({ statut: 'failed' }).eq('id', search.id)
    }
  })

  // 3. Rediriger immédiatement l'utilisateur vers la page d'attente
  revalidatePath('/dashboard')
  redirect(`/searches/${search.id}`)
}
