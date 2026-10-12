import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  const { id: searchId } = await params

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('search_id', searchId)
    .eq('user_id', user.id)

  if (error || !leads || leads.length === 0) {
    return new NextResponse('Aucun lead à exporter', { status: 404 })
  }

  // Génération du CSV
  const headers = [
    'Nom',
    'Catégorie',
    'Téléphone Standard',
    'Téléphone E164',
    'Mobile',
    'Lien WhatsApp',
    'Email',
    'Site Web',
    'Adresse',
    'Note',
    'Avis',
    'Lien Google Maps',
  ]

  const rows = leads.map((l) => [
    `"${(l.nom || '').replace(/"/g, '""')}"`,
    `"${(l.categorie || '').replace(/"/g, '""')}"`,
    `"${(l.telephone_brut || '').replace(/"/g, '""')}"`,
    `"${(l.telephone_e164 || '').replace(/"/g, '""')}"`,
    l.is_mobile ? 'Oui' : 'Non',
    `"${(l.lien_whatsapp || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.site_web || '').replace(/"/g, '""')}"`,
    `"${(l.adresse || '').replace(/"/g, '""')}"`,
    l.note || '',
    l.nb_avis || '',
    `"${(l.lien_google_maps || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new NextResponse('\uFEFF' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads_export_${searchId.slice(0, 8)}.csv"`,
    },
  })
}
