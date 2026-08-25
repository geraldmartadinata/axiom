import { enrichScenario } from '../utils/calculations'
import { useAxiomStore } from '../store/useAxiomStore'
import { matchMock } from './mockMatcher'

// Mock mode is opt-in ONLY via env flag (default OFF): real prompts go through the
// /api/gemini serverless proxy — the API key never exists in client code.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Calls the SERVERLESS PROXY (/api/gemini). The Gemini key lives only server-side;
// this function holds no reference to any VITE_GEMINI* variable by design.
// Server returns { fallback: true } + mock payload when Gemini is unavailable
// (Zense-style), so the app always gets a result.
async function extractViaProxy(prompt) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    // non-JSON error body — handled below via status
  }
  if (!response.ok) {
    // Network/deploy failure with no fallback payload → local mock as last resort.
    console.warn('[extraction] proxy error, using local mock:', response.status)
    return { ...matchMock(prompt), fallback: true }
  }
  if (payload?.fallback) {
    console.warn('[extraction] server returned mock fallback (Gemini unavailable)')
    return { ...payload, scenario: { ...payload.scenario, raw_prompt: payload.scenario?.raw_prompt || prompt } }
  }
  return validateRawScenario(payload, prompt)
}

// Internal price knowledge base (IDR) — used when the prompt/Gemini gives no
// price. Matched by substring against the item name.
const CAR_PRICE_DB = {
  'civic': 550000000,
  'brio': 180000000,
  'avanza': 250000000,
  'veloz': 300000000,
  'innova': 420000000,
  'fortuner': 550000000,
  'pajero': 600000000,
  'xpander': 280000000,
  'rush': 280000000,
  'raize': 220000000,
  'rocky': 220000000,
  'stargazer': 250000000,
  'ionic': 550000000,
  'tesla model 3': 750000000,
  'tesla model y': 850000000,
  'bmw m5': 1800000000,
  'porsche': 1500000000,
  'ferrari': 4000000000,
  'iphone 17 pro max': 25000000,
  'iphone 17 pro': 20000000,
  'iphone 17': 15000000,
  'iphone 16': 12000000,
  'macbook': 25000000,
}

/** Best-effort price lookup from the internal DB. Returns 0 when unknown. */
function estimatePriceFromDB(itemName) {
  const name = String(itemName || '').toLowerCase()
  for (const [key, price] of Object.entries(CAR_PRICE_DB)) {
    if (name.includes(key)) return price
  }
  return 0
}

function validateRawScenario(data, originalPrompt, profile) {
  const scenario = { ...(data.scenario || {}) }
  const fin = { ...(data.financials || {}) }

  // Never reject: normalize instead of throwing on missing/invalid fields.
  if (!scenario.category || !['tech', 'vehicle', 'property'].includes(scenario.category)) {
    scenario.category = 'vehicle'
  }
  if (!scenario.item_name || !String(scenario.item_name).trim()) {
    scenario.item_name = originalPrompt.trim().slice(0, 48) || 'Pembelian'
  }

  // Price fallback chain: Gemini → internal price DB → generic estimate.
  // The user is never blocked; the UI marks estimated prices clearly.
  let price = Number(fin.base_price) || 0
  let priceEstimated = false
  if (!price) {
    price = estimatePriceFromDB(scenario.item_name)
    if (price) priceEstimated = true
  }
  if (!price) {
    price = 350000000
    priceEstimated = true
  }
  fin.base_price = price

  // Missing income → fall back to the user's Baseline Parameters (profile).
  if (fin.monthly_income == null) {
    fin.monthly_income = Number(profile?.monthly_income) || null
  }

  return {
    ...data,
    scenario: { ...scenario, raw_prompt: scenario.raw_prompt || originalPrompt },
    financials: fin,
    priceEstimated,
  }
}

export async function extractAndEnrich(prompt) {
  if (!prompt || !prompt.trim()) throw new Error('Prompt is empty')
  const profile = useAxiomStore.getState().profile

  if (USE_MOCK) return enrichScenario({ ...matchMock(prompt), scenario: { ...matchMock(prompt).scenario, raw_prompt: prompt } }, profile)

  // Real pipeline: proxy fails gracefully into mock fallback (never a hard error).
  const raw = await extractViaProxy(prompt.trim())
  const rawScenario = validateRawScenario(raw, prompt.trim(), profile)
  const enriched = enrichScenario(rawScenario, profile)
  if (rawScenario.fallback) enriched.fallback = true
  if (rawScenario.priceEstimated) enriched.priceEstimated = true
  return enriched
}

export function useExtraction() {
  return { extract: extractAndEnrich, loading: false, error: null, result: null }
}
