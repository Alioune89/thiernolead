import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { connection } from 'next/server'
import { Building2, Sparkles, MessageSquare, Phone, User, Globe2, CheckCircle2, ArrowRight } from 'lucide-react'

export default async function SettingsPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const entreprise = formData.get('entreprise') as string
    const offre = formData.get('offre') as string
    const benefice_client = formData.get('benefice_client') as string
    const nom_expediteur = formData.get('nom_expediteur') as string
    const telephone_expediteur = formData.get('telephone_expediteur') as string
    const langue_defaut = formData.get('langue_defaut') as string

    await supabase
      .from('profiles')
      .update({
        entreprise,
        offre,
        benefice_client,
        nom_expediteur,
        telephone_expediteur,
        langue_defaut,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    revalidatePath('/settings')
    revalidatePath('/dashboard')
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-8">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E55B5B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Paramètres IA & Pitch WhatsApp</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Profil Commercial de l'<span className="text-[#F05A5A]">Entreprise</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 max-w-2xl">
              Ces éléments nourrissent directement le modèle IA pour rédiger des messages de prospection ultra-percutants adaptés aux réalités du marché africain (en Français et Wolof).
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-xs">
            <span className="text-slate-400">Statut du profil :</span>
            <span className={`inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full ${
              profile?.onboarded
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {profile?.onboarded ? 'Profil Complet' : 'Configuration requise'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire Principal (2 colonnes) */}
        <div className="lg:col-span-2">
          <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-3xl p-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#E55B5B]" />
                Identité & Proposition de Valeur
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Remplissez ces champs pour que chaque message généré reflète fidèlement votre marque et vos avantages concurrentiels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="entreprise" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Nom de votre entreprise
                    </Label>
                    <Input
                      id="entreprise"
                      name="entreprise"
                      defaultValue={profile?.entreprise ?? ''}
                      placeholder="Ex: Teranga Digital Agency"
                      className="bg-slate-50 text-slate-900 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom_expediteur" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Votre nom de contact
                    </Label>
                    <Input
                      id="nom_expediteur"
                      name="nom_expediteur"
                      defaultValue={profile?.nom_expediteur ?? ''}
                      placeholder="Ex: Alioune Ndiaye"
                      className="bg-slate-50 text-slate-900 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone_expediteur" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      WhatsApp Professionnel
                    </Label>
                    <Input
                      id="telephone_expediteur"
                      name="telephone_expediteur"
                      defaultValue={profile?.telephone_expediteur ?? ''}
                      placeholder="Ex: +221 77 123 45 67"
                      className="bg-slate-50 text-slate-900 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-11 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="langue_defaut" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                      Langue IA par défaut
                    </Label>
                    <select
                      id="langue_defaut"
                      name="langue_defaut"
                      defaultValue={profile?.langue_defaut ?? 'fr'}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E55B5B]"
                    >
                      <option value="fr">Français (Commercial soutenu & courtois)</option>
                      <option value="wo">Wolof (Teranga & Convivial local)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offre" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    Votre Offre / Service Clé
                  </Label>
                  <Input
                    id="offre"
                    name="offre"
                    defaultValue={profile?.offre ?? ''}
                    placeholder="Ex: Création de sites vitrines & acquisition de clients via WhatsApp"
                    className="bg-slate-50 text-slate-900 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500">
                    Décrivez ce que vous vendez de manière simple et directe.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefice_client" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    Bénéfice Principal pour le Prospect
                  </Label>
                  <Input
                    id="benefice_client"
                    name="benefice_client"
                    defaultValue={profile?.benefice_client ?? ''}
                    placeholder="Ex: Multiplier vos rendez-vous clients par 3 dès les 30 premiers jours"
                    className="bg-slate-50 text-slate-900 border-slate-200 focus-visible:ring-[#E55B5B] focus-visible:border-[#E55B5B] h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500">
                    Quel est le gain mesurable pour l'entreprise que vous démarchez ?
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-[#E55B5B]/30 hover:scale-[1.02] transition-all"
                  >
                    Sauvegarder les modifications
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Panneau Latéral : Aperçu IA & Rendu WhatsApp */}
        <div className="space-y-6">
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Aperçu du Format WhatsApp</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Voici comment vos données se structurent lors de la génération automatique d'un message avec Gemini :
            </p>

            <div className="bg-[#0b1e16] border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-xs font-sans text-slate-200 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/10 text-[11px] text-emerald-400 font-bold">
                <span>💬 Message Type WhatsApp</span>
                <span className="font-mono">FR / WO</span>
              </div>
              <p className="text-slate-300">
                « Bonjour <span className="text-emerald-400 font-semibold">[Nom Entreprise]</span>, c'est <span className="text-white font-semibold">{profile?.nom_expediteur || 'votre nom'}</span> de <span className="text-white font-semibold">{profile?.entreprise || 'votre société'}</span>.
              </p>
              <p className="text-slate-300">
                J'ai remarqué votre activité à <span className="text-emerald-400 font-semibold">[Ville]</span>. Nous aidons les entreprises de votre secteur avec <span className="text-white font-semibold">{profile?.offre || 'votre offre commerciale'}</span>, ce qui vous permet de <span className="text-white font-semibold">{profile?.benefice_client || 'bénéfice principal'}</span>.
              </p>
              <p className="text-slate-300">
                Seriez-vous ouvert pour un échange rapide de 5 minutes sur WhatsApp cette semaine ? »
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">✨ Double Langue Instantanée</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Dans chaque recherche, un bouton vous permet de switcher instantanément entre le pitch français et le pitch en wolof adapté aux commerces dakarois.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
