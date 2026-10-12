import { ApifyClient } from 'apify-client'

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
})

export async function runGoogleMapsScraperSync({
  searchId,
  sector,
  city,
  country,
  maxResults,
  withEmails,
}: {
  searchId: string
  sector: string
  city: string
  country: string
  maxResults: number
  withEmails: boolean
}) {
  const estimatedCost = (maxResults / 1000) * 4
  const safetyMargin = estimatedCost + 1.0

  // .call() attend la fin de l'exécution d'Apify ! Plus besoin de tunnel webhook en local.
  const run = await client.actor('compass/crawler-google-places').call({
    searchStringsArray: [sector],
    locationQuery: `${city}, ${country}`,
    maxCrawledPlacesPerSearch: maxResults,
    language: 'fr',
    skipClosedPlaces: true,
    scrapeContacts: withEmails,
  }, {
    waitSecs: 3600,
    maxTotalChargeUsd: safetyMargin,
  })

  if (!run || !run.defaultDatasetId) {
    throw new Error('Dataset ID not found')
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return { runId: run.id, items }
}

export async function getRunData(runId: string) {
  const run = await client.run(runId).get()
  if (!run || !run.defaultDatasetId) {
    throw new Error('Dataset ID not found')
  }
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return { items }
}
