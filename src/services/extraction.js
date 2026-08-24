import { enrichScenario } from '../utils/calculations'
import { useAxiomStore } from '../store/useAxiomStore'
import mockCar from '../mocks/mock-car.json'
import mockGadget from '../mocks/mock-gadget.json'
import mockProperty from '../mocks/mock-property.json'
import mockBad from '../mocks/mock-bad.json'
import { useState, useCallback } from 'react'

const USE_MOCK = true

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

function detectLanguage(prompt) {
  const idWords = ['bisa', 'beli', 'nggak', 'gak', 'cicil', 'dp', 'gaji', 'jt', 'miliar', 'triliun', 'bln', 'thn', 'tahun', 'bulan', 'rumah', 'apartemen', 'mobil', 'motor', 'hp', 'ponsel', 'laptop', 'cicilan', 'tenor', 'bunga', 'angsuran']
  const words = prompt.toLowerCase().split(/\s+/)
  const idCount = words.filter(w => idWords.some(iw => w.includes(iw))).length
  return idCount >= 2 ? 'id' : 'en'
}

function matchMock(prompt) {
  const p = prompt.toLowerCase()
  const lang = detectLanguage(prompt)
  
  // Indonesian vehicle keywords
  const vehicleKeywords = [
    'civic', 'avanza', 'veloz', 'honda', 'toyota', 'mobil', 'motor', 'car', 'vehicle',
    'tesla', 'bmw', 'm5', 'bmw m5', 'innova', 'fortuner', 'cr-v', 'hr-v', 'brio', 'jazz',
    'city', 'mobilio', 'xpander', 'pajero', 'triton', 'ranger', 'everest'
  ]
  
  // Indonesian tech keywords
  const techKeywords = [
    'iphone', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'hp', 'ponsel', 'phone',
    'laptop', 'macbook', 'ipad', 'tablet', 'gadget', 'mac', 'galaxy', 'redmi', 'poco',
    'iphone 16', 'iphone 15', 'ipad pro', 'airpods', 'apple watch'
  ]
  
  // Indonesian property keywords
  const propertyKeywords = [
    'rumah', 'apartemen', 'apartment', 'property', 'house', 'home', 'studio',
    'jakarta', 'bekasi', 'depok', 'tangerang', 'bogor', 'bandung', 'surabaya',
    'kpr', 'cicilan rumah', 'dp rumah', 'sertifikat', 'shm', 'shgb'
  ]

  const isVehicle = vehicleKeywords.some(kw => p.includes(kw))
  const isTech = techKeywords.some(kw => p.includes(kw))
  const isProperty = propertyKeywords.some(kw => p.includes(kw))

  // Check for bad scenario (low income, high price)
  const isBad = (p.includes('avanza') || p.includes('veloz') || p.includes('bmw') || p.includes('m5') || p.includes('110')) &&
                (p.includes('5jt') || p.includes('5 juta') || p.includes('2jt') || p.includes('2 juta') || p.includes('2k'))

  if (isBad) return mockBad
  if (isVehicle) return mockCar
  if (isTech) return mockGadget
  if (isProperty) return mockProperty
  
  // Default based on language
  return lang === 'id' ? mockCar : mockCar
}

async function mockExtract(prompt) {
  const delay = 600 + Math.random() * 600
  await new Promise(resolve => setTimeout(resolve, delay))
  const matched = matchMock(prompt)
  return {
    ...matched,
    scenario: { ...matched.scenario, raw_prompt: prompt }
  }
}

const SYSTEM_PROMPT = `You are a financial data extraction assistant. Your ONLY job is to extract financial variables from a user's natural-language scenario and return them as a JSON object.

CRITICAL RULES:
1. Do NOT calculate anything. Only extract numbers the user mentioned.
2. Do NOT add advice, opinions, or commentary.
3. If a value is not mentioned, use null (do NOT guess or estimate).
4. For hidden_costs: estimate REALISTIC costs based on the item category (e.g., cars have insurance, registration, maintenance; phones have insurance, accessories, AppleCare). These are estimates, not exact quotes.
5. Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
6. Handle both English and Indonesian input. Currency can be USD ($) or IDR (Rp/jt/miliar).

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

async function geminiExtract(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser scenario: "${prompt}"` }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    })
  })
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  const parsed = JSON.parse(text)
  return validateRawScenario(parsed, prompt)
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
  let rawScenario
  if (USE_MOCK || !GEMINI_API_KEY) {
    rawScenario = await mockExtract(prompt)
  } else {
    try {
      rawScenario = await geminiExtract(prompt)
    } catch (error) {
      console.warn('Gemini extraction failed, falling back to mock:', error.message)
      rawScenario = await mockExtract(prompt)
    }
  }
  const profile = useAxiomStore.getState().profile
  const enriched = enrichScenario(rawScenario, profile)
  return enriched
}

export function useExtraction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const extract = useCallback(async (prompt) => {
    setLoading(true)
    setError(null)
    try {
      const enriched = await extractAndEnrich(prompt)
      setResult(enriched)
      setLoading(false)
      return enriched
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [])

  return { extract, loading, error, result }
}