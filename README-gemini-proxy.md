# Gemini API — Serverless Proxy Setup

The Gemini API key **never ships to the browser**. All client code calls `/api/gemini`
(a Vercel serverless function in `api/gemini.js`), and the key lives only in
**server-side** environment variables.

## Vercel setup (required for production)

1. Vercel Dashboard → your project → **Settings → Environment Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
   - Environments: Production, Preview, Development
2. Redeploy so the new env var takes effect.

> ⚠️ **Rotate the old key.** The previous setup exposed the key client-side via
> `VITE_GEMINI_API_KEY` (embedded in the public JS bundle). Revoke/rotate that key in
> Google AI Studio after switching to `GEMINI_API_KEY`. Do NOT re-add any `VITE_GEMINI*`
> variable — nothing reads them anymore.

## Local development

```bash
npm run dev    # single command — /api/gemini is served INLINE by the Vite dev server
```

Put the key in `.env` (gitignored) as `GEMINI_API_KEY=...`. The dev middleware reads it
via `loadEnv` — no separate API process, no proxy.

> When Gemini is unavailable (missing key / 429 rate limit / network error), the API
> returns a **mock extraction** with `fallback: true` (Zense-style), and the Analyze
> session shows a "Demo mode" notice. The app never dead-ends.

## Hardening included

- Body validation: prompt must be a non-empty string ≤ 2000 chars, else 400
- In-memory per-IP rate limit: 10 req/min (resets per serverless instance — TODO:
  durable limiting via Upstash/Vercel KV later)
- Key sent via `x-goog-api-key` header, never in URLs; never logged or echoed
- Upstream failures map to clean JSON errors (429/502), never HTML stack traces

## Contract

`POST /api/gemini` with `{ "prompt": "..." }` → returns the structured extraction JSON
(`scenario`, `financials`, `hidden_costs`) identical to what the Analyze pages consume.
Errors: `{ "error": "..." }` with appropriate status codes.
