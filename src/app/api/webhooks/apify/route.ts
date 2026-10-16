import { NextResponse } from 'next/server'
import { reconcileSearch } from '@/lib/search-runs'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Webhook ad hoc enregistré par startGoogleMapsScraper (seulement si APIFY_WEBHOOK_SECRET est défini).
// Il accélère la finalisation quand personne ne regarde la page ; le polling suffit sans lui.
export async function POST(request: Request) {
  const expected = process.env.APIFY_WEBHOOK_SECRET
  const secret = new URL(request.url).searchParams.get('secret')

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { searchId?: unknown } | null
  const searchId = body?.searchId
  if (typeof searchId !== 'string' || !UUID_RE.test(searchId)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Le corps n'est qu'un déclencheur : le statut réel du run est relu chez Apify.
  await reconcileSearch(searchId)
  return NextResponse.json({ received: true })
}
