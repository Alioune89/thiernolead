import { createAdminClient } from '@/lib/supabase/admin'
import { getDatasetItems, getRun, TERMINAL_RUN_STATUSES } from '@/lib/apify'
import { normalizeLeads } from '@/lib/normalize'

// Une recherche "running" sans apify_run_id au-delà de ce délai n'a jamais démarré
// (ex. lancée avant ce correctif, quand le run tournait en arrière-plan et était gelé par Vercel).
const ORPHAN_AFTER_MS = 10 * 60 * 1000

type SearchRow = {
  id: string
  user_id: string
  statut: string
  apify_run_id: string | null
  credits_reserved: number
  created_at: string
}

/**
 * Fait avancer une recherche "running" en interrogeant Apify : si le run est terminé, enregistre
 * les leads puis facture (ou rembourse si 0 lead).
 * Appelé par le polling de la page, le dashboard et le webhook Apify — aucun travail ne tourne en
 * arrière-plan, ce qui marche sur Vercel même quand le téléphone met la page en veille.
 * Idempotent : le passage running → succeeded/failed est conditionnel, donc un seul appel
 * concurrent "gagne" et rembourse.
 */
export async function reconcileSearch(searchId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: search } = await admin
    .from('searches')
    .select('id, user_id, statut, apify_run_id, credits_reserved, created_at')
    .eq('id', searchId)
    .single<SearchRow>()

  if (!search || search.statut !== 'running') return

  if (!search.apify_run_id) {
    if (Date.now() - new Date(search.created_at).getTime() > ORPHAN_AFTER_MS) {
      await failSearch(search, "L'extraction n'a pas pu aboutir. Relancez la recherche.")
    }
    return
  }

  let run: Awaited<ReturnType<typeof getRun>>
  try {
    run = await getRun(search.apify_run_id)
  } catch (error) {
    console.error('[search-runs] lecture du run Apify', error)
    return
  }

  if (!run) {
    await failSearch(search, 'Extraction introuvable chez Apify.')
    return
  }
  if (!TERMINAL_RUN_STATUSES.includes(run.status)) return

  try {
    // Même un run expiré ou interrompu peut avoir trouvé des leads : on les livre.
    const items = await getDatasetItems(run.defaultDatasetId)
    const leads = normalizeLeads(items, search.id, search.user_id)

    if (leads.length > 0) {
      const { error } = await admin
        .from('leads')
        .upsert(leads, { onConflict: 'search_id,place_id', ignoreDuplicates: true })
      if (error) throw error
    } else if (run.status !== 'SUCCEEDED') {
      await failSearch(search, "L'extraction Google Maps a échoué. Relancez la recherche.")
      return
    }

    // Garantie zéro perte : une recherche sans aucun lead est intégralement remboursée.
    const creditsBilled = leads.length > 0 ? search.credits_reserved : 0
    const { data: claimed } = await admin
      .from('searches')
      .update({ statut: 'succeeded', results_count: leads.length, credits_billed: creditsBilled })
      .eq('id', search.id)
      .eq('statut', 'running')
      .select('id')

    if (claimed?.length && creditsBilled < search.credits_reserved) {
      await admin.rpc('add_credits', {
        user_id_param: search.user_id,
        amount: search.credits_reserved - creditsBilled,
        motif_param: 'remboursement_non_utilises',
      })
    }
  } catch (error) {
    // Erreur passagère (Apify/Supabase) : la recherche reste "running", le prochain appel réessaie.
    console.error('[search-runs] finalisation', error)
  }
}

/** Marque la recherche en échec et rembourse la réservation (une seule fois). */
export async function failSearch(search: Pick<SearchRow, 'id' | 'user_id' | 'credits_reserved'>, message: string) {
  const admin = createAdminClient()
  const { data: claimed } = await admin
    .from('searches')
    .update({ statut: 'failed', error: message, credits_billed: 0 })
    .eq('id', search.id)
    .eq('statut', 'running')
    .select('id')

  if (claimed?.length) {
    await admin.rpc('add_credits', {
      user_id_param: search.user_id,
      amount: search.credits_reserved,
      motif_param: 'remboursement_echec_recherche',
    })
  }
}
