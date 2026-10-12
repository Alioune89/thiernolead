import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRunData } from '@/lib/apify'
import { normalizeLeads } from '@/lib/normalize'

// On utilise le Service Role Key car le webhook vient de l'extérieur sans session auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (secret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { runId, status, searchId } = body

    if (!runId || !searchId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const { data: search } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single()

    if (!search || search.statut !== 'running') {
      return NextResponse.json({ message: 'Recherche ignorée (déjà traitée ou introuvable)' }, { status: 200 })
    }

    if (status !== 'SUCCEEDED') {
      await supabase.from('searches').update({ statut: 'failed' }).eq('id', searchId)
      // Rembourser l'utilisateur
      await supabase.rpc('add_credits', {
        user_id_param: search.user_id,
        amount: search.credits_reserved,
        motif_param: 'remboursement_echec_recherche'
      })
      return NextResponse.json({ message: 'Marqué comme failed' }, { status: 200 })
    }

    // Récupérer les résultats complets d'Apify
    const { items } = await getRunData(runId)
    const costPerLead = search.with_emails ? 2 : 1

    // Normaliser les données (nettoyage des numéros de téléphone etc.)
    const formattedLeads = normalizeLeads(items, searchId, search.user_id)

    if (formattedLeads.length > 0) {
      // Upsert des leads (pour ignorer les doublons via la contrainte UNIQUE (search_id, place_id))
      const { error: insertError } = await supabase
        .from('leads')
        .upsert(formattedLeads, { onConflict: 'search_id,place_id', ignoreDuplicates: true })

      if (insertError) {
        console.error("Erreur insertion leads:", insertError)
      }
    }

    // Calculer les crédits non utilisés
    const leadsCount = formattedLeads.length
    const creditsUsed = leadsCount * costPerLead
    const creditsRefund = Math.max(0, search.credits_reserved - creditsUsed)

    // Rembourser les crédits non utilisés
    if (creditsRefund > 0) {
      await supabase.rpc('add_credits', {
        user_id_param: search.user_id,
        amount: creditsRefund,
        motif_param: 'remboursement_credits_non_utilises',
      })
    }

    // Marquer la recherche comme terminée
    await supabase
      .from('searches')
      .update({ 
        statut: 'succeeded', 
        results_count: leadsCount,
        credits_billed: creditsUsed
      })
      .eq('id', searchId)

    return NextResponse.json({ success: true, count: leadsCount }, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
