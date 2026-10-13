import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Search,
  Zap,
  Send,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Building,
  TrendingUp,
  Volume2,
  Play,
  Star,
  Check,
  MessageSquare,
  Lock,
  Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CREDITS_PER_SEARCH, WELCOME_CREDITS, searchesFor } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const targetHref = user ? '/dashboard' : '/login'

  return (
    <div className="min-h-screen bg-[#082115] text-white flex flex-col selection:bg-[#E55B5B] selection:text-white w-full max-w-[100vw] overflow-x-hidden">
      {/* Navbar Flottante */}
      <header className="sticky top-0 z-50 w-full max-w-[100vw] backdrop-blur-xl bg-[#082115]/95 border-b border-white/10 transition-all overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#E55B5B] to-[#F05A5A] flex items-center justify-center font-black text-base sm:text-xl text-white shadow-lg shadow-[#E55B5B]/30 group-hover:scale-105 transition-transform">
              L
            </div>
            <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-white">
              Lap<span className="text-[#F05A5A]">lead</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#comment-ca-marche" className="hover:text-white transition-colors">
              Comment ça marche
            </a>
            <a href="#tarifs" className="hover:text-white transition-colors">
              Crédits & Tarifs
            </a>
            <a href="#afrique" className="hover:text-white transition-colors">
              54 Pays Africains
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <Link
              href={targetHref}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
            >
              {user ? 'Dashboard' : 'Connexion'}
            </Link>
            <Link href={targetHref}>
              <Button className="bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-bold text-xs sm:text-sm px-2.5 sm:px-5 h-8 sm:h-11 rounded-xl shadow-lg shadow-[#E55B5B]/25 hover:scale-105 transition-all whitespace-nowrap">
                <span>{user ? 'Mon Cockpit' : 'Essai Gratuit'}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-[100vw] overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full max-w-7xl px-3 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 flex flex-col items-center text-center overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-10 right-0 sm:right-10 w-48 sm:w-80 h-48 sm:h-80 bg-[#E55B5B]/15 rounded-full blur-[80px] pointer-events-none" />

          {/* Badge Pill */}
          <div className="inline-flex max-w-[95vw] items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs md:text-sm font-bold bg-white/5 border border-white/10 backdrop-blur-md mb-6 sm:mb-8 hover:border-[#E55B5B]/40 transition-all">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-200 truncate">1er Moteur B2B & Prospection IA en Afrique</span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#E55B5B]/20 text-[#F05A5A] font-extrabold ml-1 shrink-0">
              54 PAYS
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.2] px-2 text-balance break-words">
            Trouvez vos futurs clients africains en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F05A5A] via-[#FF8A8A] to-[#F05A5A]">60 secondes chrono</span>.
          </h1>

          {/* Sous-titre */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed px-2 text-balance">
            Extrayez les coordonnées complètes des entreprises locales depuis Google Maps et contactez-les directement sur <strong className="text-white">WhatsApp</strong> avec des messages personnalisés rédigés par l'IA en <strong className="text-white">Français</strong> et en <strong className="text-white">Wolof</strong>.
          </p>

          {/* CTA & Trust */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full px-2 sm:px-0 sm:w-auto">
            <Link href={targetHref} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-extrabold rounded-2xl shadow-2xl shadow-[#E55B5B]/40 hover:scale-105 transition-all group"
              >
                {user ? 'Accéder à mon Dashboard' : 'Lancer ma première recherche'}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center justify-center text-center gap-2 text-[11px] sm:text-sm text-slate-300 bg-white/5 border border-white/10 px-3.5 py-2.5 sm:py-3.5 rounded-2xl max-w-full">
              <Coins className="w-4 h-4 text-[#F05A5A] shrink-0" />
              <span><strong>{WELCOME_CREDITS} crédits offerts</strong> • Sans carte bancaire</span>
            </div>
          </div>

          {/* Stat Tickers */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-4xl px-2 sm:px-0 pt-6 sm:pt-8 border-t border-white/10 text-center">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">54</p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1">Pays d'Afrique couverts</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-black text-[#F05A5A] font-mono">+120k</p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1">Entreprises indexées</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">1-Clic</p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1">Lancement WhatsApp Direct</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">FR / WO</p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1">Copywriting IA Bilingue</p>
            </div>
          </div>

          {/* MOCKUP INTERACTIF DU SAAS */}
          <div className="mt-14 w-full max-w-5xl rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl backdrop-blur-2xl">
            <div className="rounded-2xl bg-[#082115] border border-white/10 overflow-hidden text-left shadow-inner">
              {/* Top Window Bar */}
              <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 border-b border-white/10 bg-white/[0.02]">
                {/* macOS Window Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/5 text-[11px] font-mono text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    https://app.laplead.com/dashboard
                  </span>
                </div>

                {/* Live Scraping Pulse Indicator */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 whitespace-nowrap">
                    Scraping en direct
                  </span>
                </div>
              </div>

              {/* Cockpit Content */}
              <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                {/* Search Meta & Action Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-xl font-extrabold text-white">
                        Dentistes à Dakar, Sénégal
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-bold">
                        50 leads B2B
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F05A5A] shrink-0" />
                      Google Maps Scraping • Numéros WhatsApp qualifiés
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors">
                      <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#F05A5A] text-white shadow-lg shadow-[#F05A5A]/30">
                      <Sparkles className="w-3.5 h-3.5" /> 50 Pitchs Prêts
                    </span>
                  </div>
                </div>

                {/* DESKTOP VIEW: Data Table (screens >= 640px) */}
                <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                  <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 bg-white/[0.02]">
                    <div className="col-span-5">Établissement & Ville</div>
                    <div className="col-span-4">Coordonnées WhatsApp</div>
                    <div className="col-span-3 text-right">Action Directe</div>
                  </div>

                  <div className="divide-y divide-white/5 text-sm">
                    {/* Row 1 */}
                    <div className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F05A5A]/15 border border-[#F05A5A]/25 text-[#F05A5A] flex items-center justify-center font-bold text-xs shrink-0">
                          CT
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">Cabinet Dentaire Teranga</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>4.8 (42 avis)</span>
                            <span>• Dakar Plateau</span>
                          </p>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
                          <Phone className="w-3 h-3" />
                          +221 77 654 32 10
                        </span>
                      </div>

                      <div className="col-span-3 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-bold text-xs shadow-sm transition-all cursor-pointer">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Contacter
                        </span>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F05A5A]/15 border border-[#F05A5A]/25 text-[#F05A5A] flex items-center justify-center font-bold text-xs shrink-0">
                          CA
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">Clinique Almadies Santé</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>4.9 (88 avis)</span>
                            <span>• Les Almadies</span>
                          </p>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
                          <Phone className="w-3 h-3" />
                          +221 78 123 45 67
                        </span>
                      </div>

                      <div className="col-span-3 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-bold text-xs shadow-sm transition-all cursor-pointer">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Contacter
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE VIEW: Dedicated Responsive Lead Cards (screens < 640px) */}
                <div className="sm:hidden space-y-3">
                  {/* Lead 1 Mobile Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F05A5A]/15 border border-[#F05A5A]/25 text-[#F05A5A] flex items-center justify-center font-bold text-sm shrink-0">
                        CT
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">
                          Cabinet Dentaire Teranga
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" /> 4.8
                          </span>
                          <span>•</span>
                          <span className="truncate">Dakar Plateau</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold whitespace-nowrap">
                        <Phone className="w-3 h-3 shrink-0" />
                        +221 77 654 32 10
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-black font-bold text-xs shadow-md shadow-[#25D366]/20 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </span>
                    </div>
                  </div>

                  {/* Lead 2 Mobile Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F05A5A]/15 border border-[#F05A5A]/25 text-[#F05A5A] flex items-center justify-center font-bold text-sm shrink-0">
                        CA
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">
                          Clinique Almadies Santé
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" /> 4.9
                          </span>
                          <span>•</span>
                          <span className="truncate">Les Almadies</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold whitespace-nowrap">
                        <Phone className="w-3 h-3 shrink-0" />
                        +221 78 123 45 67
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-black font-bold text-xs shadow-md shadow-[#25D366]/20 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gemini Copywriting & Wave Studio Interactive Preview */}
                <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-purple-950/40 to-emerald-950/30 border border-purple-500/25 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          Copywriting IA Gemini Flash
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Pitch personnalisé avec prénom, quartier & activité
                        </p>
                      </div>
                    </div>

                    {/* Language Switcher Pill */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-auto">
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-500 text-white text-[10px] font-bold">
                        🇸🇳 Wolof
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-slate-400 text-[10px] font-semibold">
                        🇫🇷 Français
                      </span>
                    </div>
                  </div>

                  {/* Speech Message Preview */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-200 leading-relaxed font-sans">
                    « Nanga def Dr. Teranga, c'est Alioune de Teranga Digital. Nous remarquons votre forte réputation aux Almadies et souhaitons vous apporter +20 nouveaux patients ce mois-ci via WhatsApp... »
                  </div>

                  {/* Wave Voice Note Studio Preview */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] text-black flex items-center justify-center shrink-0 shadow-md">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </div>

                      {/* Equalizer Waveform */}
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="w-1 h-5 bg-emerald-400 rounded-full" />
                        <span className="w-1 h-2 bg-emerald-400 rounded-full" />
                        <span className="w-1 h-6 bg-[#25D366] rounded-full animate-pulse" />
                        <span className="w-1 h-4 bg-emerald-400 rounded-full" />
                        <span className="w-1 h-7 bg-[#25D366] rounded-full" />
                        <span className="w-1 h-3 bg-emerald-400 rounded-full" />
                        <span className="w-1 h-5 bg-[#25D366] rounded-full" />
                        <span className="w-1 h-2 bg-emerald-400 rounded-full" />
                        <span className="w-1 h-4 bg-emerald-400 rounded-full" />
                      </div>

                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        0:18 <span className="text-slate-500 font-normal">/ 0:35</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <span className="text-[11px] text-slate-400 font-medium">
                        🎤 Note vocale Wave prête
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F05A5A] hover:bg-[#F05A5A]/90 text-white font-bold text-xs shadow-lg shadow-[#F05A5A]/25 shrink-0 cursor-pointer">
                        Envoyer en 1 Clic 🚀
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION COMMENT ÇA MARCHE */}
        <section id="comment-ca-marche" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#F05A5A]">
              Simple & Redoutable
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Prospectez en 3 étapes sans effort
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Pas de scraping complexe, pas de configurations techniques. Tout se fait dans le navigateur.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#E55B5B]/20 text-[#F05A5A] flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h4 className="text-xl font-bold text-white">Ciblez votre Marché</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sélectionnez parmi 54 pays africains (Sénégal, Côte d'Ivoire, Cameroun, etc.) et tapez l'activité visée (ex: Agences Immobilières, Hôtels, Médecins).
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h4 className="text-xl font-bold text-white">L'IA Extrait & Valide</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Notre robot interroge Google Maps en temps réel, extrait les coordonnées, élimine les doublons et formate les numéros au format international.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h4 className="text-xl font-bold text-white">Contactez sur WhatsApp</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Générez des messages personnalisés adaptés en Français ou Wolof et envoyez-les directement en un seul clic via le protocole wa.me.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION FEATURES CLÉS */}
        <section id="fonctionnalites" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#F05A5A]">
              Avantages Concurrentiels
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Conçu spécifiquement pour le continent africain
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">54 Pays & Villes d'Afrique</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Couverture complète de Dakar à Nairobi, en passant par Abidjan, Douala, Kinshasa, Casablanca et Luanda.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-purple-500/20 text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Copywriting Wolof & Français</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                L'IA s'adapte à la culture locale des affaires. Des messages chaleureux et percutants qui maximisent les taux de réponse.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-[#E55B5B]/20 text-[#F05A5A]">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">WhatsApp-First</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                En Afrique, le B2B se fait sur WhatsApp. Chaque prospect est enrichi de son bouton de discussion direct pré-rempli.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-blue-500/20 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Garantie Zéro Crédit Perdu</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Si une recherche ne produit aucun résultat ou rencontre un incident technique, vos crédits sont automatiquement recrédités.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-amber-500/20 text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Mobile Money Ready</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paiement instantané par Wave, Orange Money, MTN MoMo, Free Money ou carte bancaire. Aucun abonnement mensuel contraignant.
              </p>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-rose-500/20 text-rose-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Export CSV Illimité</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Téléchargez l'intégralité de vos listes de prospects en un clic pour les intégrer à vos CRM (Hubspot, Notion, Excel).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION TARIFS / CRÉDITS */}
        <section id="tarifs" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#F05A5A]">
              Tarification Transparente
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Payez uniquement ce que vous consommez
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Pas de factures récurrentes. {CREDITS_PER_SEARCH} crédits par génération de leads, packs valables à vie.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">Pack Découverte</h4>
                <p className="text-xs text-slate-400 mt-1">Pour tester une première niche locale.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono">5 000</span>
                  <span className="text-sm font-bold text-slate-400">FCFA</span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold mt-1">100 crédits ≈ {searchesFor(100)} générations de leads</p>
              </div>

              <Link href={user ? '/billing' : '/login'}>
                <Button className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold">
                  Commencer
                </Button>
              </Link>
            </div>

            <div className="rounded-3xl p-8 bg-gradient-to-b from-white to-slate-50 text-slate-900 border-2 border-[#E55B5B] shadow-2xl flex flex-col justify-between space-y-6 md:-translate-y-2">
              <div>
                <Badge className="bg-[#E55B5B] text-white font-bold text-xs uppercase px-3 py-1 mb-2">
                  Populaire
                </Badge>
                <h4 className="text-xl font-bold text-slate-900">Pack Croissance Pro</h4>
                <p className="text-xs text-slate-600 mt-1">Le choix recommandé pour les équipes commerciales.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 font-mono">20 000</span>
                  <span className="text-sm font-bold text-slate-600">FCFA</span>
                </div>
                <p className="text-xs text-[#E55B5B] font-bold mt-1">500 crédits ≈ {searchesFor(500)} générations de leads</p>
              </div>

              <Link href={user ? '/billing' : '/login'}>
                <Button className="w-full h-12 rounded-xl bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-bold shadow-lg shadow-[#E55B5B]/30">
                  Choisir le Pack Pro
                </Button>
              </Link>
            </div>

            <div className="rounded-3xl p-8 bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">Pack Entreprise</h4>
                <p className="text-xs text-slate-400 mt-1">Pour les agences et gros volumes B2B.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono">50 000</span>
                  <span className="text-sm font-bold text-slate-400">FCFA</span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold mt-1">1 500 crédits ≈ {searchesFor(1500)} générations de leads</p>
              </div>

              <Link href={user ? '/billing' : '/login'}>
                <Button className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold">
                  Choisir Entreprise
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA FINAL HERO */}
        <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative rounded-3xl p-10 md:p-16 overflow-hidden bg-gradient-to-r from-[#E55B5B]/20 via-[#082115] to-[#E55B5B]/10 border border-white/15 text-center flex flex-col items-center space-y-6 shadow-2xl">
            <h3 className="text-3xl sm:text-5xl font-black text-white max-w-3xl leading-tight">
              Prêt à accélérer vos ventes en Afrique dès aujourd'hui ?
            </h3>
            <p className="text-slate-300 max-w-xl text-base">
              Créez votre compte en 10 secondes et recevez <strong className="text-white">{WELCOME_CREDITS} crédits gratuits</strong> pour lancer votre première génération de leads.
            </p>
            <Link href={targetHref}>
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-extrabold bg-[#E55B5B] hover:bg-[#d64a4a] text-white rounded-2xl shadow-2xl shadow-[#E55B5B]/40 hover:scale-105 transition-all"
              >
                {user ? 'Accéder à mon Cockpit' : 'Démarrer Gratuitement'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/10 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E55B5B] flex items-center justify-center font-bold text-white text-sm">
              L
            </div>
            <span className="font-bold text-white text-lg">Laplead</span>
            <span className="text-xs text-slate-500 ml-2">© 2026 Laplead. Tous droits réservés.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>Dakar • Abidjan • Douala</span>
            <span>Support : WhatsApp & Email</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
