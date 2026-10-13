import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, Loader2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { settleMonerooPayment, type PaymentStatus } from '@/lib/payments'
import { PaymentStatusRefresher } from '@/components/billing/PaymentStatusRefresher'

export const dynamic = 'force-dynamic'

interface BillingReturnPageProps {
  searchParams: Promise<{ ref?: string }>
}

// Moneroo redirige ici après le paiement (?ref=<notre id>&paymentId=<id Moneroo>&paymentStatus=…).
// Les paramètres d'URL ne sont jamais crus : le statut est relu auprès de l'API Moneroo.
export default async function BillingReturnPage({ searchParams }: BillingReturnPageProps) {
  await connection()
  const { ref } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!ref) redirect('/billing')

  const { data: payment } = await createAdminClient()
    .from('payments')
    .select('id, statut, credits')
    .eq('id', ref)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!payment) redirect('/billing')

  // Filet de sécurité si le webhook n'est pas encore arrivé (ou pas configuré en local).
  const statut: PaymentStatus =
    payment.statut === 'pending' ? (await settleMonerooPayment(payment.id)) ?? 'pending' : payment.statut

  const view = {
    completed: {
      icon: <CheckCircle2 className="w-10 h-10" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
      title: 'Paiement confirmé !',
      text: `${payment.credits} crédits ont été ajoutés à votre solde. Vous pouvez lancer vos prochaines générations de leads.`,
    },
    failed: {
      icon: <XCircle className="w-10 h-10" />,
      iconClass: 'bg-red-50 text-red-600',
      title: 'Paiement non abouti',
      text: 'Le paiement a été annulé ou refusé par l\'opérateur. Aucun crédit n\'a été ajouté et rien n\'a été débité de notre côté.',
    },
    pending: {
      icon: <Loader2 className="w-10 h-10 animate-spin" />,
      iconClass: 'bg-amber-50 text-amber-600',
      title: 'Paiement en cours de validation',
      text: 'Validez le paiement sur votre téléphone si ce n\'est pas déjà fait. Vos crédits apparaîtront ici automatiquement dès la confirmation de Moneroo.',
    },
  }[statut]

  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-2xl text-center p-6">
        <CardHeader className="space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${view.iconClass}`}>
            {view.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">{view.title}</CardTitle>
          <CardDescription className="text-slate-600">{view.text}</CardDescription>
          {statut === 'pending' && <PaymentStatusRefresher />}
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          <Link href={statut === 'failed' ? '/billing' : '/dashboard'}>
            <Button className="w-full bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-semibold h-11 rounded-xl shadow-md">
              {statut === 'failed' ? 'Réessayer le paiement' : 'Retour au tableau de bord'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
