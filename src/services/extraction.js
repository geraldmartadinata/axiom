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

function validateRawScenario(data, originalPrompt) {
  const errors = []
  if (!data.scenario?.item_name) errors.push('item_name is missing')
  if (!data.scenario?.category) errors.push('category is missing')
  if (!['tech', 'vehicle', 'property'].includes(data.scenario?.category)) {
    errors.push(`category "${data.scenario?.category}" is invalid`)
  }
  if (data.financials?.base_price == null) errors.push('base_price is missing')
  if (data.financials?.monthly_income == null) errors.push('monthly_income is missing')
  if (errors.length > 0) {
    throw new Error(`Invalid extraction: ${errors.join(', ')}. Please rephrase with specific numbers (price, income, down payment, duration).`)
  }
  return {
    ...data,
    scenario: { ...data.scenario, raw_prompt: data.scenario?.raw_prompt || originalPrompt }
  }
}

export async function extractAndEnrich(prompt) {
  if (!prompt || !prompt.trim()) throw new Error('Prompt is empty')
  const profile = useAxiomStore.getState().profile

  if (USE_MOCK) return enrichScenario({ ...matchMock(prompt), scenario: { ...matchMock(prompt).scenario, raw_prompt: prompt } }, profile)

  // Real pipeline: proxy fails gracefully into mock fallback (never a hard error).
  const rawScenario = await extractViaProxy(prompt.trim())
  const enriched = enrichScenario(rawScenario, profile)
  if (rawScenario.fallback) enriched.fallback = true
  return enriched
}

export function useExtraction() {
  return { extract: extractAndEnrich, loading: false, error: null, result: null }
}
