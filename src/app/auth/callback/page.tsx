'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const handleCallback = async () => {
      // Le simple fait d'initialiser le client déclenche le traitement de l'URL
      // (Supabase intercepte le ?code= ou le #access_token= et sauvegarde la session)

      // On attend une petite seconde pour laisser Supabase écrire les cookies
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setError('Impossible de vous authentifier. Le lien a peut-être expiré.')
          setTimeout(() => router.push('/login'), 3000)
        }
      }, 1000)
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <p className="text-white text-lg font-medium">{error}</p>
          <p className="text-muted-foreground text-sm">Redirection vers la page de connexion...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg font-medium">Connexion en cours...</p>
        </div>
      )}
    </div>
  )
}
