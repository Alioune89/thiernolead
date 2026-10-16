import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { SearchDetailView } from '@/components/searches/SearchDetailView'
import { reconcileSearch } from '@/lib/search-runs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SearchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  // Récupérer la recherche
  const selectSearch = () => adminSupabase
    .from('searches')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  let { data: search } = await selectSearch()

  if (!search) redirect('/dashboard')

  // Une recherche revenue de veille (mobile) est finalisée dès l'ouverture de la page.
  if (search.statut === 'running') {
    await reconcileSearch(search.id)
    ;({ data: search } = await selectSearch())
    if (!search) redirect('/dashboard')
  }

  // Récupérer les leads
  const { data: leads } = await adminSupabase
    .from('leads')
    .select('*')
    .eq('search_id', search.id)
    .order('note', { ascending: false })

  return (
    <SearchDetailView search={search} leads={leads || []} />
  )
}
