import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { connection } from 'next/server'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Search, Settings, Coins, LogOut, Plus, Sparkles, Building2 } from 'lucide-react'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil pour avoir le solde de crédits et nom de l'entreprise
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, entreprise, nom_expediteur')
    .eq('id', user.id)
    .single()

  const userInitial = (profile?.nom_expediteur || user.email || 'A')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#082115]/90 backdrop-blur-xl">
        <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo & Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#f05a5a] to-[#d64a4a] flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md group-hover:scale-105 transition-transform">
                L
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                Lap<span className="text-[#f05a5a]">lead</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search className="w-4 h-4 text-[#f05a5a]" />
                Recherche de Leads
              </Link>
              <Link
                href="/billing"
                className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                Packs & Facturation
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                Entreprise & Pitch IA
              </Link>
            </nav>
          </div>

          {/* Right Area : Credits + Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Credit Pill */}
            <Link href="/billing">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-sm group">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="font-mono font-bold text-xs sm:text-sm tracking-tight text-white">
                  {profile?.credits ?? 0}
                </span>
                <span className="text-xs text-amber-300/80 font-medium hidden sm:inline">crédits</span>
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] sm:text-xs ml-0.5">
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </span>
              </div>
            </Link>

            {/* Profile Avatar / Settings link */}
            <Link href="/settings">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-all">
                {userInitial}
              </div>
            </Link>

            {/* Sign Out Button */}
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-white/5 py-2 px-3 bg-[#082115]/95">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-200 hover:text-white"
          >
            <Search className="w-4 h-4 text-[#f05a5a]" />
            <span>Recherche</span>
          </Link>
          <Link
            href="/billing"
            className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-300 hover:text-white"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Packs</span>
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-300 hover:text-white"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Profil IA</span>
          </Link>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
