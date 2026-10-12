'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      // 1. Déconnexion côté client Supabase (purge localStorage & session)
      await supabase.auth.signOut()

      // 2. Appel serveur pour invalider les cookies de session SSR
      await fetch('/auth/signout', { method: 'POST' }).catch(() => {})

      // 3. Redirection complète et nettoyage du cache navigateur
      window.location.href = '/login'
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
      // En cas d'erreur réseau, forcer quand même le retour à /login
      window.location.href = '/login'
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      disabled={loading}
      title="Se déconnecter"
      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-8 w-8 sm:h-9 sm:w-9 transition-colors shrink-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  )
}
