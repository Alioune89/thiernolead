import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { SearchDetailView } from '@/components/searches/SearchDetailView'

export default async function SearchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  // Récupérer la recherche
  const { data: search } = await adminSupabase
    .from('searches')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!search) redirect('/dashboard')

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
