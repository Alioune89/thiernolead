'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, Lock, ArrowRight, Sparkles, Coins, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Connexion
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Si utilisateur introuvable, création automatique
    if (error && error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) {
        toast.error(signUpError.message)
      } else {
        toast.success('Compte créé avec succès ! Bienvenue sur Laplead.')
        router.push('/dashboard')
      }
    } else if (error) {
      toast.error(error.message)
    } else {
      toast.success('Ravi de vous revoir !')
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-[#082115] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#E55B5B]/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Header Link */}
      <div className="mb-8 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E55B5B] to-[#F05A5A] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-[#E55B5B]/30 group-hover:scale-105 transition-transform">
            L
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Lap<span className="text-[#F05A5A]">lead</span>
          </span>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-white text-slate-900 border-none shadow-2xl rounded-3xl p-2 relative z-10">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 self-center border border-emerald-500/20">
            <Coins className="w-3.5 h-3.5" />
            <span>20 crédits offerts à la création</span>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
            Accédez à vos recherches B2B
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Connectez-vous ou créez votre compte instantanément sans carte bancaire.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Adresse Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre-email@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-12 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-extrabold h-12 rounded-xl shadow-lg shadow-[#E55B5B]/30 transition-all hover:scale-[1.02] mt-2 text-base"
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter / Commencer'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Accès immédiat aux 54 pays africains</span>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-slate-400">
        En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
      </p>
    </div>
  )
}
