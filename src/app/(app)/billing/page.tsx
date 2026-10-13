import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Check, Coins, ShieldCheck, Sparkles, CreditCard, History, AlertCircle } from 'lucide-react'
import { connection } from 'next/server'
import { buyCredits } from '@/actions/billing'
import { BuyPackButton } from '@/components/billing/BuyPackButton'
import { CREDIT_PACKS, CREDITS_PER_SEARCH, searchesFor } from '@/lib/pricing'

const ERROR_MESSAGES: Record<string, { title: string; text: string }> = {
  insufficient_credits: {
    title: 'Crédits de prospection épuisés',
    text: `Chaque génération de leads coûte ${CREDITS_PER_SEARCH} crédits. Choisissez un pack ci-dessous pour relancer vos extractions immédiatement.`,
  },
  payment_init: {
    title: 'Le paiement n\'a pas pu démarrer',
    text: 'Moneroo n\'a pas répondu correctement. Aucun montant n\'a été débité, réessayez dans un instant.',
  },
  invalid_pack: {
    title: 'Pack introuvable',
    text: 'Le pack sélectionné n\'existe plus. Choisissez un pack ci-dessous.',
  },
  email_required: {
    title: 'Email requis',
    text: 'Moneroo exige une adresse email pour le reçu de paiement. Connectez-vous avec un compte email.',
  },
}

const MOTIF_LABELS: Record<string, string> = {
  bonus: 'Bonus de bienvenue',
  bonus_bienvenue: 'Bonus de bienvenue',
  achat_moneroo: 'Achat de crédits (Moneroo)',
  reservation_recherche: 'Génération de leads',
  remboursement: 'Remboursement',
  remboursement_non_utilises: 'Remboursement (aucun résultat)',
  remboursement_credits_non_utilises: 'Remboursement (aucun résultat)',
  remboursement_echec_recherche: 'Remboursement (échec recherche)',
  erreur: 'Remboursement (incident technique)',
}

const PAYMENT_METHODS = [
  { name: 'Wave', color: 'bg-[#1DC4FF]/10 text-[#1DC4FF] border-[#1DC4FF]/30' },
  { name: 'Orange Money', color: 'bg-[#FF7900]/10 text-[#FF7900] border-[#FF7900]/30' },
  { name: 'MTN MoMo', color: 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/30' },
  { name: 'Free Money', color: 'bg-[#ED1C24]/10 text-[#ED1C24] border-[#ED1C24]/30' },
  { name: 'Moov Money', color: 'bg-[#005CA9]/10 text-[#005CA9] border-[#005CA9]/30' },
  { name: 'Visa / Mastercard', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
]

interface BillingPageProps {
  searchParams?: Promise<{ error?: string }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  await connection()
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const errorMessage = resolvedSearchParams.error ? ERROR_MESSAGES[resolvedSearchParams.error] : undefined
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-10">
      {/* Alertes (crédits insuffisants, échec d'initialisation Moneroo…) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{errorMessage.title}</h4>
            <p className="text-xs text-amber-200/90 mt-0.5">{errorMessage.text}</p>
          </div>
        </div>
      )}
      {/* En-tête avec Solde */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#E55B5B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E55B5B]/10 text-[#F05A5A] border border-[#E55B5B]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recharge instantanée par Mobile Money</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Packs de <span className="text-[#F05A5A]">Crédits</span> Prospection
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Chaque génération de leads coûte {CREDITS_PER_SEARCH} crédits, quel que soit le volume, et elle est intégralement remboursée si elle ne trouve aucun prospect. Paiement sécurisé par Moneroo, sans abonnement, et vos crédits n&apos;expirent jamais.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#082115]/90 border border-emerald-500/20 px-6 py-4 rounded-2xl shadow-xl">
            <div className="p-3 rounded-xl bg-[#E55B5B]/20 text-[#F05A5A]">
              <Coins className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Solde actuel</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{profile?.credits ?? 0}</span>
                <span className="text-sm font-semibold text-emerald-400">crédits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des offres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${pack.popular
                ? 'bg-gradient-to-b from-white to-slate-50 text-slate-900 border-2 border-[#E55B5B] shadow-2xl md:-translate-y-2'
                : 'bg-white/[0.04] text-white border border-white/10 hover:border-white/20 backdrop-blur-md'
              }`}
          >
            {pack.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#E55B5B] text-white font-extrabold px-4 py-1 text-xs uppercase tracking-wider rounded-full shadow-lg border border-white/20">
                  {pack.badge}
                </Badge>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className={`text-2xl font-bold ${pack.popular ? 'text-slate-900' : 'text-white'}`}>
                  {pack.name}
                </h3>
                <p className={`text-sm mt-1.5 ${pack.popular ? 'text-slate-600' : 'text-slate-400'}`}>
                  {pack.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/20">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl md:text-5xl font-black tracking-tight font-mono ${pack.popular ? 'text-slate-900' : 'text-white'}`}>
                    {pack.price.toLocaleString('fr-FR')}
                  </span>
                  <span className={`text-sm font-bold uppercase ${pack.popular ? 'text-slate-600' : 'text-slate-400'}`}>
                    FCFA
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{pack.credits.toLocaleString('fr-FR')} crédits ≈ {searchesFor(pack.credits)} générations de leads</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm">
                {pack.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${pack.popular ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className={pack.popular ? 'text-slate-700 font-medium' : 'text-slate-300'}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form action={buyCredits} className="pt-8 mt-auto">
              <input type="hidden" name="pack_id" value={pack.id} />
              <BuyPackButton popular={pack.popular} />
            </form>
          </div>
        ))}
      </div>

      {/* Bannière de réassurance des paiements africains */}
      <div className="rounded-3xl p-8 bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 backdrop-blur-md space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Passerelle de paiement 100% sécurisée</h4>
              <p className="text-xs text-slate-400">Vos crédits sont crédités automatiquement dès validation du paiement sur votre téléphone.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CreditCard className="w-4 h-4 text-slate-300" />
            <span>Paiement chiffré SSL 256 bits</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {PAYMENT_METHODS.map((pm, i) => (
            <span
              key={i}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border backdrop-blur-sm ${pm.color}`}
            >
              {pm.name}
            </span>
          ))}
        </div>
      </div>

      {/* Historique des transactions */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-[#F05A5A]" />
            <h2 className="text-xl font-bold tracking-tight">Historique des recharges & consommations</h2>
          </div>
          <span className="text-xs text-slate-400">10 dernières opérations</span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          {transactions && transactions.length > 0 ? (
            <div className="divide-y divide-white/5 text-sm">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.03] transition-colors">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{MOTIF_LABELS[tx.motif] ?? tx.motif}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={tx.amount > 0 ? 'default' : 'secondary'}
                    className={`font-mono text-xs font-bold px-3 py-1 rounded-full ${tx.amount > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-slate-300 border border-white/10'
                      }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} crédits
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 text-sm space-y-2">
              <Coins className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">Aucune transaction enregistrée</p>
              <p className="text-xs">Vos recharges et utilisations de crédits apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
