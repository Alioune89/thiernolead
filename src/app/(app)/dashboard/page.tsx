import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchForm } from '@/components/dashboard/SearchForm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  History,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe2,
} from 'lucide-react'

export default async function DashboardPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  // 1. Récupérer le profil et crédits
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  // 2. Récupérer l'historique des recherches
  const { data: searches } = await adminSupabase
    .from('searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Calcul des métriques globales
  const totalLeadsExtracted = searches?.reduce((acc, s) => acc + (s.results_count || 0), 0) || 0
  const uniqueCountriesCount = new Set(searches?.map((s) => s.pays) || []).size
  const successfulSearches = searches?.filter((s) => s.statut === 'succeeded').length || 0

  return (
    <div className="space-y-8 md:space-y-10 w-full overflow-hidden">
      {/* 1. HERO STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Leads
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#f05a5a]/20 text-[#f05a5a] flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-extrabold font-mono text-white mt-1.5 sm:mt-2 tracking-tight">
            {totalLeadsExtracted.toLocaleString('fr-FR')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Qualifiés Google Maps</p>
        </div>

        {/* Recherches Réussies */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              Succès
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-extrabold font-mono text-white mt-1.5 sm:mt-2 tracking-tight">
            {successfulSearches}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            Sur {searches?.length || 0} extractions
          </p>
        </div>

        {/* Pays Explorés */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              Marchés
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-extrabold font-mono text-white mt-1.5 sm:mt-2 tracking-tight">
            {uniqueCountriesCount > 0 ? uniqueCountriesCount : '54'}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Pays couverts</p>
        </div>

        {/* Couverture B2B */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              Couverture
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-extrabold font-mono text-white mt-1.5 sm:mt-2 tracking-tight">
            100%
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Commerces & B2B</p>
        </div>
      </div>

      {/* 2. SECTION PRINCIPALE : FORMULAIRE + HISTORIQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
        {/* Formulaire de recherche interactif */}
        <div className="lg:col-span-5 w-full">
          <SearchForm userCredits={profile?.credits ?? 0} />
        </div>

        {/* Historique des recherches */}
        <div className="lg:col-span-7 space-y-4 w-full">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-[#f05a5a]" />
                Historique des Recherches
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Accédez à vos listes de leads extraites et générez vos pitchs personnalisés.
              </p>
            </div>
            {searches && searches.length > 0 && (
              <Badge variant="outline" className="text-xs text-slate-300 border-white/10 font-mono hidden sm:inline-flex">
                {searches.length} récentes
              </Badge>
            )}
          </div>

          <div className="space-y-3 w-full">
            {!searches || searches.length === 0 ? (
              <Card className="glass-panel border-dashed border-white/20 text-center p-8 sm:p-12 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Aucune recherche effectuée</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                  Sélectionnez un secteur et une ville sur le formulaire ci-dessus pour lancer votre première extraction de leads.
                </p>
              </Card>
            ) : (
              searches.map((search) => {
                const isSucceeded = search.statut === 'succeeded'
                const isRunning = search.statut === 'running' || search.statut === 'pending'
                const isFailed = search.statut === 'failed'

                return (
                  <Link key={search.id} href={`/searches/${search.id}`} className="block w-full">
                    <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group w-full">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-white group-hover:text-[#f05a5a] transition-colors truncate">
                            {search.secteur}
                          </h3>
                          <Badge
                            className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                              isSucceeded
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isRunning
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSucceeded ? 'bg-emerald-400' : isRunning ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                            />
                            {isSucceeded ? 'Prêt' : isRunning ? 'En cours' : 'Échec'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-[#f05a5a]" /> {search.ville}, {search.pays}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            {new Date(search.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <p className="text-lg sm:text-xl font-black font-mono text-white">
                            {search.results_count || 0}
                          </p>
                          <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                            Leads trouvés
                          </p>
                        </div>

                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 text-slate-300 group-hover:bg-[#f05a5a] group-hover:text-white flex items-center justify-center transition-all shrink-0">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
