'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const INTERVAL_MS = 4000
const MAX_ATTEMPTS = 15 // ~1 minute, ensuite l'utilisateur rafraîchit à la main

/** Re-rend la page de retour tant que Moneroo n'a pas confirmé le paiement. */
export function PaymentStatusRefresher() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) return
    const timer = setTimeout(() => {
      router.refresh()
      setAttempts((a) => a + 1)
    }, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [attempts, router])

  if (attempts >= MAX_ATTEMPTS) {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-xs font-bold text-[#F05A5A] hover:underline"
      >
        Toujours en attente ? Actualiser le statut
      </button>
    )
  }

  return <p className="text-xs text-slate-400">Vérification automatique en cours…</p>
}
