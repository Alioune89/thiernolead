import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Coins, Zap, ShieldCheck, ArrowRight, Sparkles, Smartphone, CreditCard, History, AlertCircle } from 'lucide-react'
import { connection } from 'next/server'

const PACKS = [
  {
    id: 'pack_starter',
    name: 'Pack Découverte',
    credits: 100,
    price: 5000,
    currency: 'FCFA',
    description: 'Parfait pour tester une première campagne locale ciblée.',
    popular: false,
    color: 'from-blue-500/10 to-indigo-500/5',
    features: [
      '100 leads complets avec téléphones vérifiés',
      'Extraction directe Google Maps & Annuaire',
      'Pitchs personnalisés WhatsApp & Email via IA',
      'Export CSV illimité en 1 clic',
      'Validité des crédits à vie',
    ],
  },
  {
    id: 'pack_pro',
    name: 'Pack Croissance Pro',
    credits: 500,
    price: 20000,
    currency: 'FCFA',
    description: 'Le choix privilégié des commerciaux et agences en expansion.',
    popular: true,
    color: 'from-[#E55B5B]/15 to-[#F05A5A]/5',
    badge: 'Le Plus Populaire',
    features: [
      '500 leads hautement qualifiés (WhatsApp direct)',
      'Déduplication automatique intelligente',
      'Génération copywriting IA en Français & Wolof',
      'Lien WhatsApp clic-et-contact instantané',
      'Extraction multi-villes et quartiers',
      'Support prioritaire par WhatsApp dédié',
    ],
  },
  {
    id: 'pack_business',
    name: 'Pack Entreprise',
    credits: 1500,
    price: 50000,
    currency: 'FCFA',
    description: 'Pour les équipes de vente et agences à gros volume panafricain.',
    popular: false,
    color: 'from-emerald-500/10 to-teal-500/5',
    badge: 'Meilleur Coût / Lead',
    features: [
      '1 500 leads complets sur les 54 pays africains',
      'Coût par lead le plus bas (33 FCFA / prospect)',
      'Détection automatique des contacts décideurs',
      'Multi-utilisateurs & partage de listes',
      'Accès anticipé aux nouveaux modèles IA',
      'Account Manager dédié 7j/7',
    ],
  },
]

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
      {/* Alerte Crédits Insuffisants */}
      {resolvedSearchParams.error === 'insufficient_credits' && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Crédits de prospection épuisés</h4>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Votre solde est insuffisant pour lancer cette recherche. Choisissez un pack de crédits ci-dessous pour démarrer vos extractions immédiatement.
            </p>
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
              1 crédit = 1 prospect B2B complet avec téléphone, localisation et message de contact rédigé par IA. Aucun abonnement mensuel, vos crédits n'expirent jamais.
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
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
              pack.popular
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
                    {pack.currency}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{pack.credits} crédits ({Math.round(pack.price / pack.credits)} FCFA / lead)</span>
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

            <div className="pt-8 mt-auto">
              <Button
                className={`w-full font-bold h-12 rounded-xl transition-all text-base ${
                  pack.popular
                    ? 'bg-[#E55B5B] hover:bg-[#d64a4a] text-white shadow-xl shadow-[#E55B5B]/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Payer par Mobile Money
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
                    <p className="font-semibold text-white capitalize">{tx.motif}</p>
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
                    className={`font-mono text-xs font-bold px-3 py-1 rounded-full ${
                      tx.amount > 0
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
