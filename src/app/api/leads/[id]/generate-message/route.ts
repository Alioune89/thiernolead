import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOutreachMessage } from '@/lib/gemini'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()

  // 1. Récupérer le lead
  const { data: lead, error: leadError } = await adminSupabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
  }

  // 2. Récupérer le profil de l'utilisateur pour personnaliser le pitch
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('entreprise, offre, benefice_client, nom_expediteur, telephone_expediteur, langue_defaut')
    .eq('id', user.id)
    .single()

  const body = await request.json().catch(() => ({}))
  const langue = (body.langue || profile?.langue_defaut || 'fr') as 'fr' | 'wo'
  const canal = (body.canal || 'whatsapp') as 'whatsapp' | 'email' | 'voice'

  try {
    const result = await generateOutreachMessage({
      leadName: lead.nom,
      leadCategory: lead.categorie,
      leadCity: lead.adresse,
      entrepriseExpediteur: profile?.entreprise,
      nomExpediteur: profile?.nom_expediteur,
      offre: profile?.offre,
      beneficeClient: profile?.benefice_client,
      langue,
      canal,
    })

    // Enregistrer le message dans la table messages
    await adminSupabase.from('messages').insert({
      user_id: user.id,
      lead_id: lead.id,
      canal,
      langue,
      ton: 'naturel',
      objet: result.objet || null,
      corps: result.corps,
      modele: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    })

    return NextResponse.json({
      success: true,
      objet: result.objet,
      corps: result.corps,
      langue,
      canal,
    })
  } catch (error: any) {
    console.error('Erreur génération Gemini:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du message' },
      { status: 500 }
    )
  }
}
