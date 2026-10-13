import crypto from 'node:crypto'

// Client Moneroo (mono-marchand : Laplead encaisse avec ses propres clés).
// Adapté du skill "izisaas-payments-handler" (references/moneroo.md).
// Pas d'hôte sandbox séparé : c'est la clé secrète (test ou live) qui détermine l'environnement.

const MONEROO_API_URL = 'https://api.moneroo.io'
const FETCH_TIMEOUT_MS = 15_000

function getSecretKey(): string {
  const key = process.env.MONEROO_SECRET_KEY
  if (!key) throw new Error('MONEROO_SECRET_KEY non configurée')
  return key
}

async function monerooFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${MONEROO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  })
}

// Moneroo renvoie un 400 silencieux si first_name / last_name manquent.
function splitName(full: string | undefined, fallbackEmail: string) {
  const v = (full ?? '').trim()
  if (!v) return { first: fallbackEmail.split('@')[0] || 'Client', last: '-' }
  const parts = v.split(/\s+/)
  return { first: parts[0], last: parts.slice(1).join(' ') || '-' }
}

export type InitiatePaymentParams = {
  amount: number
  currency: string
  description: string
  returnUrl: string
  customerEmail: string
  customerName?: string
  metadata: Record<string, string>
}

export type InitiatePaymentResult =
  | { ok: true; providerTransactionId: string; checkoutUrl: string }
  | { ok: false; error: string }

export async function initiateMonerooPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  const { first, last } = splitName(params.customerName, params.customerEmail)

  let res: Response
  try {
    res = await monerooFetch('/v1/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount, // XOF : francs entiers
        currency: params.currency,
        description: params.description.slice(0, 200),
        // Seule URL de retour : Moneroo n'a pas de cancel_url.
        return_url: params.returnUrl,
        customer: { email: params.customerEmail, first_name: first, last_name: last },
        // Les valeurs de metadata doivent être des chaînes non vides (sinon 422).
        metadata: Object.fromEntries(Object.entries(params.metadata).filter(([, v]) => v.length > 0)),
      }),
    })
  } catch (err) {
    return { ok: false, error: `Erreur réseau Moneroo : ${(err as Error).message}` }
  }

  const parsed = (await res.json().catch(() => null)) as {
    data?: { id?: string; checkout_url?: string }
    message?: string
  } | null

  // id ET checkout_url doivent être présents, même sur un 200.
  if (!res.ok || !parsed?.data?.id || !parsed.data.checkout_url) {
    return { ok: false, error: parsed?.message || `Moneroo a répondu ${res.status}` }
  }

  return { ok: true, providerTransactionId: parsed.data.id, checkoutUrl: parsed.data.checkout_url }
}

export type MonerooVerifyResult = {
  status: 'success' | 'failed' | 'cancelled' | 'pending' | string
  amount?: number
  currency?: string
  raw: unknown
}

/** Re-interroge Moneroo : seule source de vérité avant de créditer un compte. */
export async function verifyMonerooPayment(providerTransactionId: string): Promise<MonerooVerifyResult | null> {
  let res: Response
  try {
    res = await monerooFetch(`/v1/payments/${encodeURIComponent(providerTransactionId)}/verify`, { method: 'GET' })
  } catch {
    return null
  }
  if (!res.ok) return null

  const json = (await res.json().catch(() => null)) as {
    data?: { status?: string; amount?: number | string; currency?: { code?: string } | string }
  } | null
  if (!json?.data?.status) return null

  const { data } = json
  return {
    status: String(data.status).toLowerCase(),
    amount: typeof data.amount === 'string' ? parseInt(data.amount, 10) : data.amount,
    // currency arrive tantôt en chaîne, tantôt en objet { code }
    currency: typeof data.currency === 'string' ? data.currency : data.currency?.code,
    raw: json,
  }
}

/** HMAC-SHA256 hex du corps BRUT (header X-Moneroo-Signature), comparaison à temps constant. */
export function verifyMonerooSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.MONEROO_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(signatureHeader.trim())
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
