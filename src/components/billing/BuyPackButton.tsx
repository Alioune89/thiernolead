'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, Smartphone } from 'lucide-react'

export function BuyPackButton({ popular }: { popular: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full font-bold h-12 rounded-xl transition-all text-base ${popular
          ? 'bg-[#E55B5B] hover:bg-[#d64a4a] text-white shadow-xl shadow-[#E55B5B]/30'
          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirection vers Moneroo...
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4 mr-2" />
          Payer avec Moneroo
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}
