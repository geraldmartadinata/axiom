/**
 * Vercel Serverless Function — POST /api/gemini
 * ---------------------------------------------
 * Keeps the Gemini API key SERVER-SIDE (env var: GEMINI_API_KEY, NOT VITE_-prefixed).
 * Contract: receives { prompt }, returns the exact structured extraction JSON the
 * Analyze page already consumes (scenario/financials/hidden_costs). No key is ever
 * logged or echoed.
 *
 * Setup (Vercel → Project Settings → Environment Variables):
 *   GEMINI_API_KEY = <your Gemini API key>
 * The previously-exposed VITE_GEMINI_API_KEY should be REVOKED/ROTATED in AI Studio.
 */

const GEMINI_MODEL = 'gemini-3.6-flash'
const MAX_PROMPT_LEN = 2000
const RATE_LIMIT = 10           // requests…
const RATE_WINDOW_MS = 60_000   // …per minute per IP

// Zense-style fallback: when Gemini is unavailable, return a mock extraction
// (marked fallback:true) instead of an error, so the app always responds.
import { matchMock } from '../src/services/mockMatcher.js'

// TODO(rate-limit-durability): this in-memory counter resets per serverless instance
// and on cold start. Acceptable for now; swap for Upstash Redis / Vercel KV later.
/** @type {Map<string, number[]>} */
const hits = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter(ts => now - ts < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // crude memory bound
  return false
}

const SYSTEM_PROMPT = `You are a financial data extraction assistant. Your ONLY job is to extract financial variables from a user's natural-language scenario and return them as a JSON object.

CRITICAL RULES:
1. Do NOT calculate anything. Only extract numbers the user mentioned.
2. Do NOT add advice, opinions, or commentary.
3. If a value is not mentioned, use null (do NOT guess or estimate).
4. For hidden_costs: estimate REALISTIC costs based on the item category (e.g., cars have insurance, registration, maintenance; phones have insurance, accessories, AppleCare). These are estimates, not exact quotes.
5. Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
6. Handle both English and Indonesian input. Currency can be USD ($) or IDR (Rp/jt/miliar).
7. Consumer credit in Indonesia (phones, paylater, credit-card installments) usually has NO down payment — leave down_payment null unless the user mentions one. Store/installment interest is typically FLAT 1.5–3% per MONTH; when the user mentions a monthly rate (or for tech-category installment scenarios), set interest_rate_assumed to the annualized figure (monthly × 12, e.g. 2%/mo → 24). Mortgages (KPR) and car loans use annual rates directly.

Return this exact JSON structure:
{
  "scenario": {
    "raw_prompt": "<the user's original text>",
    "item_name": "<short item name>",
    "category": "<one of: tech, vehicle, property>"
  },
  "financials": {
    "monthly_income": <number or null>,
    "base_price": <number or null>,
    "down_payment": <number or null>,
    "tenor_months": <number or null>,
    "interest_rate_assumed": <number or null>,
    "calculated_monthly_installment": null
  },
  "hidden_costs": [
    {
      "name": "<cost description>",
      "amount_per_year": <number or null>,
      "amount_upfront": <number or null>,
      "type": "<one of: mandatory, upfront, optional, tax, maintenance>"
    }
  ]
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — try again in a minute.' })
  }

  // ---- Body validation ----
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  const prompt = body?.prompt
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_LEN) {
    return res.status(400).json({ error: `prompt must be a non-empty string under ${MAX_PROMPT_LEN} characters` })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // No key configured → mock fallback (Zense-style), app still responds.
    console.warn('[api/gemini] missing GEMINI_API_KEY — serving mock')
    return res.status(200).json({ ...matchMock(prompt), fallback: true })
  }

  try {
    // Key travels in the header, never in the URL/query string.
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser scenario: "${prompt}"` }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    )

    if (!upstream.ok) {
      const status = upstream.status
      console.error(`[api/gemini] upstream error status=${status}`)
      // Zense-style: rate-limited or upstream failure → mock fallback, never a dead end.
      return res.status(200).json({ ...matchMock(prompt), fallback: true })
    }

    const data = await upstream.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.warn('[api/gemini] empty upstream response — serving mock')
      return res.status(200).json({ ...matchMock(prompt), fallback: true })
    }
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.warn('[api/gemini] malformed upstream JSON — serving mock')
      return res.status(200).json({ ...matchMock(prompt), fallback: true })
    }
    return res.status(200).json(parsed)
  } catch (err) {
    console.error(`[api/gemini] fetch failure: ${err?.message || err}`) // message only — never env/config
    return res.status(200).json({ ...matchMock(prompt), fallback: true })
  }
}
