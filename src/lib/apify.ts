import { ApifyClient } from 'apify-client'

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
})

const ACTOR_ID = 'compass/crawler-google-places'

// Passé ce délai, Apify arrête le run (statut TIMED-OUT) ; les leads déjà trouvés restent livrés.
const RUN_TIMEOUT_SECS = 900

export const TERMINAL_RUN_STATUSES: readonly string[] = ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED']

/**
 * Démarre le scraping Google Maps et rend la main tout de suite (pas d'attente de fin de run) :
 * sur Vercel, une fonction est gelée dès que la réponse est envoyée, donc rien ne doit tourner
 * en arrière-plan. La fin du run est détectée par reconcileSearch (src/lib/search-runs.ts).
 */
export async function startGoogleMapsScraper({
  searchId,
  sector,
  city,
  country,
  maxResults,
  withEmails,
  webhookUrl,
}: {
  searchId: string
  sector: string
  city: string
  country: string
  maxResults: number
  withEmails: boolean
  /** Optionnel : Apify prévient /api/webhooks/apify à la fin du run. */
  webhookUrl?: string
}): Promise<string> {
  const estimatedCost = (maxResults / 1000) * 4
  const safetyMargin = estimatedCost + 1.0

  const run = await client.actor(ACTOR_ID).start({
    searchStringsArray: [sector],
    locationQuery: `${city}, ${country}`,
    maxCrawledPlacesPerSearch: maxResults,
    language: 'fr',
    skipClosedPlaces: true,
    scrapeContacts: withEmails,
    maxReviews: 0,
    maxImages: 0,
    scrapeReviewerName: false,
    scrapeReviewerId: false,
    scrapeReviewUrl: false,
    scrapeResponseFromOwnerText: false,
    oneQueryAtTime: true,
  }, {
    timeout: RUN_TIMEOUT_SECS,
    maxTotalChargeUsd: safetyMargin,
    ...(webhookUrl ? {
      webhooks: [{
        eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'] as const,
        requestUrl: webhookUrl,
        payloadTemplate: `{"searchId": "${searchId}", "runId": {{resource.id}}, "status": {{resource.status}}}`,
      }],
    } : {}),
  })

  return run.id
}

export async function getRun(runId: string): Promise<{ status: string; defaultDatasetId: string } | null> {
  const run = await client.run(runId).get()
  return run ? { status: run.status, defaultDatasetId: run.defaultDatasetId } : null
}

export async function getDatasetItems(datasetId: string) {
  const { items } = await client.dataset(datasetId).listItems()
  return items
}
