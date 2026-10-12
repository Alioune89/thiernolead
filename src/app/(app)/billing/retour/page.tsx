import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function BillingReturnPage() {
  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-2xl text-center p-6">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Paiement enregistré !
          </CardTitle>
          <CardDescription className="text-slate-600">
            Votre transaction est en cours de validation par l'opérateur. Vos crédits seront crédités sur votre compte dans quelques instants.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link href="/dashboard">
            <Button className="w-full bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-semibold h-11 rounded-xl shadow-md">
              Retour au tableau de bord
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
