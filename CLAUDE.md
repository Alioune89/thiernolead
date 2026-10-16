# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

AGENTS.md (imported above) holds the mandatory agent rules: the greeting at the start of every message, the closing walkthrough after each task, the design identity, and the warning that this is Next.js 16. The full functional and file-level description is in `.agents/rules/Walkthrough.md`.

## Commands

```bash
npm run dev          # next dev (Turbopack) on http://localhost:3000
npm run build        # production build
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npx tsc --noEmit     # typecheck
```

- There is no test suite or test runner configured.
- `npx tsc --noEmit` also picks up the untracked `izisaas mobile money skills/` folder (tsconfig includes `**/*.ts`), and all current type errors come from there. Filter with `| grep '^src/'` to see only app errors (currently zero).
- `npm run lint` already reports errors that predate any change, mostly `react/no-unescaped-entities` in French JSX copy, plus some `no-explicit-any` and `react-hooks/set-state-in-effect`.
- Env vars live in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APIFY_TOKEN`, `APIFY_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `MONEROO_SECRET_KEY`, `MONEROO_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`.

## Stack specifics

- Next.js 16.4 App Router, React 19.3, TypeScript strict, path alias `@/*` → `src/*`.
- Tailwind v4 is wired through a Turbopack CSS loader in `next.config.ts` (`@tailwindcss/turbopack`). There is no `tailwind.config`, and the theme lives in `src/app/globals.css`.
- The shadcn components in `src/components/ui/` use the `base-nova` style, which is built on **`@base-ui/react`, not Radix**. Check the Base UI API before changing component props.
- `src/middleware.ts` uses the `middleware` convention, which Next 16 deprecates and renames to `proxy.ts` (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). It only guards `/dashboard`, `/settings` and `/billing`. `/searches/[id]` relies on its own page-level `redirect('/login')`.
- Server pages that read cookies call `await connection()` (from `next/server`). Dashboard, search detail and landing also set `export const dynamic = 'force-dynamic'`, and the status API returns `no-store` headers. These were added on purpose to fix stale data on mobile and Vercel, so don't remove them.
- The UI copy, code comments and DB column names are in French (`secteur`, `ville`, `pays`, `statut`, `nom`, `adresse`, `motif`…).

## Architecture

### Supabase access pattern
There are three clients in `src/lib/supabase/`:
- `client.ts`: browser client.
- `server.ts`: SSR client with cookies.
- `admin.ts`: service role, bypasses RLS.

All three fall back to placeholder URLs and keys so that the Vercel build succeeds without env vars. They accept both the new key names (`PUBLISHABLE_KEY` / `SECRET_KEY`) and the legacy ones (`ANON_KEY` / `SERVICE_ROLE_KEY`).

The pattern used everywhere is: authenticate with the **server** client (`supabase.auth.getUser()`), then read and write with the **admin** client while filtering explicitly with `.eq('user_id', user.id)`. RLS doesn't protect these queries, so that filter is the security boundary. Keep it in every new query.

### Credits (critical invariant)
- All credit rules and the packs sold live in `src/lib/pricing.ts`: `WELCOME_CREDITS = 5`, `CREDITS_PER_SEARCH = 3` (a flat price per search, whatever the volume), `SEARCH_VOLUMES`, `CREDIT_PACKS`. Use these constants and never hardcode the numbers in UI copy.
- `profiles.credits` is only ever changed through the `SECURITY DEFINER` RPCs `spend_credits`, `add_credits` and `complete_payment`. These RPCs also write the `credit_transactions` ledger. Migration `0002` revokes their EXECUTE from `anon`/`authenticated` and restricts the `profiles` UPDATE grant to the Settings columns, so they can only be called through the admin client.
- `spend_credits` raises `INSUFFICIENT_CREDITS`, and the caller redirects to `/billing?error=insufficient_credits`.
- New users get 5 credits from the `handle_new_user` trigger, with motif `bonus_bienvenue`. That motif also makes the one-time +5 for existing accounts in `0002` safe to rerun.
- `createSearch` rejects any `max_results` that isn't in `SEARCH_VOLUMES`, because the cost no longer scales with volume.
- A search that finds 0 leads, or that fails, is fully refunded. See below.

### Search lifecycle (the core flow)
1. `createSearch` in `src/actions/searches.ts` (server action, posted from `SearchForm`):
   - reserves `max_results × costPerLead` credits;
   - inserts the `searches` row with `statut: 'running'`;
   - redirects immediately to `/searches/[id]`.
2. The scraping itself runs **in-process** inside `process.nextTick`. `runGoogleMapsScraperSync` (`src/lib/apify.ts`) calls the Apify actor `compass/crawler-google-places` with `.call()`, which blocks until the run finishes and then reads the dataset.
3. The results then go through these steps:
   - `normalizeLeads` (`src/lib/normalize.ts`) converts phones to E.164 with libphonenumber. The default region is hardcoded to `'SN'`, and `wa.me` links are only created for mobile numbers.
   - The leads are upserted on the unique `(search_id, place_id)` key, which deduplicates them.
   - If 0 leads were found, `credits_reserved` is refunded in full. Otherwise the flat cost is billed.
   - The search is marked `succeeded`. On any exception, the full reservation is refunded and the search is marked `failed`.
4. `SearchDetailView` (a large client component of about 1000 lines) polls `/api/searches/[id]/status` every 2.5s and does a full `window.location.reload()` when the status leaves `running`.

`/api/webhooks/apify` (secured by the `?secret=APIFY_WEBHOOK_SECRET` query param) has a **duplicate** of the same finalize, refund and mark logic, for asynchronous Apify runs. `createSearch` doesn't register a webhook today. If you change how leads are finalized or refunded, change both places.

`search_status` enum: `pending | running | succeeded | failed`.

### AI outreach
`POST /api/leads/[id]/generate-message` takes `{ langue: 'fr' | 'wo', canal: 'whatsapp' | 'email' | 'voice' }`. It loads the lead and the sender's profile fields (`entreprise`, `offre`, `benefice_client`, `nom_expediteur`…), calls `generateOutreachMessage` in `src/lib/gemini.ts`, and stores the result in `messages`. The model comes from `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).

The prompts in `gemini.ts` include cultural instructions for French and authentic Senegalese Wolof. The "voice" channel produces a script that the user records in the browser (MediaRecorder, Wave-style waveform player in `SearchDetailView`). No audio is generated server-side.

### Payments (Moneroo)
Laplead is the only merchant, so there's no encrypted per-merchant key storage: the keys come from env vars. The flow is adapted from the `izisaas mobile money skills/` skill (`references/moneroo.md`).
1. `buyCredits` (`src/actions/billing.ts`):
   - reads the pack price **server-side** from `getPack()`;
   - inserts a `payments` row with `statut: 'pending'` **before** calling Moneroo;
   - calls `initiateMonerooPayment` (`src/lib/moneroo.ts`), then stores Moneroo's `py_…` id in `transaction_id`;
   - redirects to `checkout_url`.
   The `return_url` is `/billing/retour?ref=<our uuid>`. Don't name that param `paymentId`, because Moneroo appends its own `paymentId`.
2. `settleMonerooPayment` (`src/lib/payments.ts`) is the only path that grants credits:
   - it re-queries `GET /v1/payments/{id}/verify` and checks the amount and currency;
   - it then calls RPC `complete_payment`. That RPC takes a `FOR UPDATE` lock and only acts while `statut = 'pending'`, so it is idempotent.
3. `settleMonerooPayment` is triggered from two places, so credits arrive even if one of them fails:
   - **`/api/webhooks/moneroo`** verifies the `X-Moneroo-Signature` HMAC over the raw `request.text()`. The webhook body is only a trigger: its claims are never trusted.
   - **`/billing/retour`** settles the payment when the user comes back, which also covers local dev without a public webhook URL. `PaymentStatusRefresher` polls while the payment is still pending.

`payments.statut`: `pending | completed | failed`. The legacy `apply_payment` RPC is unused.

**Sandbox / local testing:**
- Moneroo's built-in "Test Payment Gateway" only accepts **USD**. XOF in sandbox needs a third-party gateway (PayDunya, KkiaPay…) connected with that provider's test credentials.
- For local tests, `MONEROO_TEST_CURRENCY=USD` in `.env.local` makes `getCheckoutPrice` charge the pack price converted at 600 XOF/USD. The `payments` row stores that amount and currency, so the amount check in `settleMonerooPayment` still matches. This mode is ignored when `NODE_ENV === 'production'`.
- The test phone numbers are (414) 951-8161 (success) and (414) 951-8163 (failure).
- To receive webhooks locally, run `ngrok http 3000` and point a second Moneroo webhook at `<ngrok-url>/api/webhooks/moneroo`, using the same secret as `.env.local`. Set `NEXT_PUBLIC_APP_URL` to the ngrok URL. `next.config.ts` allows `*.ngrok-free.*` through `allowedDevOrigins`; Next 16 blocks other dev origins otherwise.

Other unfinished pieces: `/api/cron/reconcile` is a stub, and these files are empty placeholders: `src/actions/{leads,messages,profile}.ts` and `src/lib/{csv,prompts,validations}.ts`.

### Data model
The migrations in `supabase/migrations/` are applied by hand in the Supabase SQL editor, in order. They define these tables: `profiles`, `searches`, `leads`, `messages`, `credit_transactions` and `payments`.

RLS gives users SELECT access to their own rows, and UPDATE on `profiles` and `leads`. All inserts go through the admin client or the RPCs. `messages.ton` is `NOT NULL`, and the API currently writes `'naturel'`.
