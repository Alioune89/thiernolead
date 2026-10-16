import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { reconcileSearch } from '@/lib/search-runs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()

  const selectSearch = () => adminSupabase
    .from('searches')
    .select('id, statut, results_count, error, secteur, ville, pays, max_results')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  let { data: search, error } = await selectSearch()

  if (error || !search) {
    return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })
  }

  // Chaque poll fait avancer la recherche : si le run Apify est terminé, les leads sont enregistrés
  // et la facturation appliquée ici (aucun travail en arrière-plan côté serveur).
  if (search.statut === 'running') {
    await reconcileSearch(search.id)
    ;({ data: search, error } = await selectSearch())
    if (error || !search) {
      return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 })
    }
  }

  let leads = []
  if (search.statut === 'succeeded') {
    const { data: leadsData } = await adminSupabase
      .from('leads')
      .select('*')
      .eq('search_id', search.id)
      .order('note', { ascending: false })
    leads = leadsData || []
  }

  return NextResponse.json(
    { search, leads },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  )
}
