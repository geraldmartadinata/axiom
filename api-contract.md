# API Contract — Axiom Extraction Layer

> This document defines the exact contract between the UI and the AI extraction layer. Mock-first: the app works 100% with mock data. Gemini is a clean swap at the end.

---

## File: `src/services/extraction.js`

```javascript
import { enrichScenario } from '../utils/calculations';
import { getProfile, saveScenarioToHistory } from '../store/useAxiomStore';
import mockCar from '../mocks/mock-car.json';
import mockGadget from '../mocks/mock-gadget.json';
import mockProperty from '../mocks/mock-property.json';
import mockBad from '../mocks/mock-bad.json';

// ─── Configuration ───────────────────────────────────────
const USE_MOCK = true;  // ← Flip to false when Gemini is ready

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Mock Matcher ───────────────────────────────────────
// Matches user prompt keywords to mock scenarios for development.
function matchMock(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('tesla') || p.includes('car') || p.includes('vehicle') || p.includes('bmw')) {
    if (p.includes('bmw') || p.includes('m5') || p.includes('110')) return mockBad;
    return mockCar;
  }
  if (p.includes('iphone') || p.includes('phone') || p.includes('laptop') || p.includes('gadget') || p.includes('macbook')) {
    return mockGadget;
  }
  if (p.includes('house') || p.includes('apartment') || p.includes('property') || p.includes('home') || p.includes('studio')) {
    return mockProperty;
  }
  return mockCar; // default fallback
}

// ─── Mock Extraction ────────────────────────────────────
async function mockExtract(prompt) {
  // Simulate network delay (600-1200ms)
  const delay = 600 + Math.random() * 600;
  await new Promise(resolve => setTimeout(resolve, delay));
  const matched = matchMock(prompt);
  // Return a fresh copy with the user's actual prompt
  return {
    ...matched,
    scenario: { ...matched.scenario, raw_prompt: prompt }
  };
}

// ─── Gemini Extraction ──────────────────────────────────
const SYSTEM_PROMPT = `You are a financial data extraction assistant. Your ONLY job is to extract financial variables from a user's natural-language scenario and return them as a JSON object.

CRITICAL RULES:
1. Do NOT calculate anything. Only extract numbers the user mentioned.
2. Do NOT add advice, opinions, or commentary.
3. If a value is not mentioned, use null (do NOT guess or estimate).
4. For hidden_costs: estimate REALISTIC costs based on the item category (e.g., cars have insurance, registration, maintenance; phones have insurance, accessories, AppleCare). These are estimates, not exact quotes.
5. Return ONLY a valid JSON object. No markdown, no explanation, no code fences.

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
}`;

async function geminiExtract(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser scenario: "${prompt}"` }]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  // Parse and validate
  const parsed = JSON.parse(text);
  return validateRawScenario(parsed, prompt);
}

// ─── Validation ──────────────────────────────────────────
function validateRawScenario(data, originalPrompt) {
  const errors = [];

  if (!data.scenario?.item_name) errors.push('item_name is missing');
  if (!data.scenario?.category) errors.push('category is missing');
  if (!['tech', 'vehicle', 'property'].includes(data.scenario?.category)) {
    errors.push(`category "${data.scenario?.category}" is invalid`);
  }
  if (data.financials?.base_price == null) errors.push('base_price is missing');
  if (data.financials?.monthly_income == null) errors.push('monthly_income is missing');

  if (errors.length > 0) {
    throw new Error(`Invalid extraction: ${errors.join(', ')}. Please rephrase with specific numbers (price, income, down payment, duration).`);
  }

  // Ensure raw_prompt is set
  return {
    ...data,
    scenario: {
      ...data.scenario,
      raw_prompt: data.scenario?.raw_prompt || originalPrompt
    }
  };
}

// ─── Public API ─────────────────────────────────────────
/**
 * Extract financial data from a natural-language prompt.
 * Returns an enriched scenario ready for the store.
 * @param {string} prompt - User's natural language scenario
 * @returns {Promise<Object>} Enriched scenario
 */
export async function extractAndEnrich(prompt) {
  let rawScenario;

  if (USE_MOCK || !GEMINI_API_KEY) {
    rawScenario = await mockExtract(prompt);
  } else {
    try {
      rawScenario = await geminiExtract(prompt);
    } catch (error) {
      console.warn('Gemini extraction failed, falling back to mock:', error.message);
      rawScenario = await mockExtract(prompt);
    }
  }

  const profile = getProfile();
  const enriched = enrichScenario(rawScenario, profile);
  saveScenarioToHistory(enriched);
  return enriched;
}
```

---

## Mock Data Files

### `src/mocks/mock-car.json`
```json
{
  "scenario": {
    "raw_prompt": "",
    "item_name": "Tesla Model 3",
    "category": "vehicle"
  },
  "financials": {
    "monthly_income": 8000,
    "base_price": 40000,
    "down_payment": 5000,
    "tenor_months": 60,
    "interest_rate_assumed": 6.5,
    "calculated_monthly_installment": null
  },
  "hidden_costs": [
    { "name": "Annual EV Registration & Tax", "amount_per_year": 850, "amount_upfront": null, "type": "mandatory" },
    { "name": "Insurance Premium", "amount_per_year": 1800, "amount_upfront": null, "type": "mandatory" },
    { "name": "Home Charging Setup", "amount_per_year": null, "amount_upfront": 1200, "type": "upfront" },
    { "name": "Tire Replacement (every 2 yrs)", "amount_per_year": 600, "amount_upfront": null, "type": "maintenance" }
  ]
}
```

### `src/mocks/mock-gadget.json`
```json
{
  "scenario": {
    "raw_prompt": "",
    "item_name": "iPhone 16 Pro Max",
    "category": "tech"
  },
  "financials": {
    "monthly_income": 4500,
    "base_price": 1199,
    "down_payment": 1199,
    "tenor_months": 12,
    "interest_rate_assumed": 0,
    "calculated_monthly_installment": null
  },
  "hidden_costs": [
    { "name": "AppleCare+", "amount_per_year": 199, "amount_upfront": null, "type": "optional" },
    { "name": "Case & Screen Protector", "amount_per_year": null, "amount_upfront": 80, "type": "upfront" },
    { "name": "iCloud Storage (50GB)", "amount_per_year": 11.99, "amount_upfront": null, "type": "optional" }
  ]
}
```

### `src/mocks/mock-property.json`
```json
{
  "scenario": {
    "raw_prompt": "",
    "item_name": "Studio Apartment",
    "category": "property"
  },
  "financials": {
    "monthly_income": 6000,
    "base_price": 150000,
    "down_payment": 30000,
    "tenor_months": 360,
    "interest_rate_assumed": 4.5,
    "calculated_monthly_installment": null
  },
  "hidden_costs": [
    { "name": "Property Tax", "amount_per_year": 2250, "amount_upfront": null, "type": "mandatory" },
    { "name": "Home Insurance", "amount_per_year": 800, "amount_upfront": null, "type": "mandatory" },
    { "name": "HOA / Maintenance Fund", "amount_per_year": 1800, "amount_upfront": null, "type": "maintenance" },
    { "name": "Closing Costs", "amount_per_year": null, "amount_upfront": 4500, "type": "upfront" }
  ]
}
```

### `src/mocks/mock-bad.json`
```json
{
  "scenario": {
    "raw_prompt": "",
    "item_name": "BMW M5 Competition",
    "category": "vehicle"
  },
  "financials": {
    "monthly_income": 2000,
    "base_price": 110000,
    "down_payment": 5000,
    "tenor_months": 72,
    "interest_rate_assumed": 7.5,
    "calculated_monthly_installment": null
  },
  "hidden_costs": [
    { "name": "Annual Registration & Tax", "amount_per_year": 1200, "amount_upfront": null, "type": "mandatory" },
    { "name": "Insurance Premium (Full Coverage)", "amount_per_year": 4200, "amount_upfront": null, "type": "mandatory" },
    { "name": "Premium Fuel (monthly→annual)", "amount_per_year": 3600, "amount_upfront": null, "type": "mandatory" },
    { "name": "Tire Set (every 2 yrs)", "amount_per_year": 800, "amount_upfront": null, "type": "maintenance" }
  ]
}
```

---

## Swap Procedure (Mock → Gemini)

When ready to test with real Gemini API:

1. Create `.env` file in project root:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

2. In `src/services/extraction.js`, change:
   ```javascript
   const USE_MOCK = true;
   ```
   to:
   ```javascript
   const USE_MOCK = false;
   ```

3. Test with a real prompt. If Gemini fails, the code automatically falls back to mock (see try/catch in `extractAndEnrich`).

4. **IMPORTANT:** If you have multiple Gemini API keys (free tier rotation), use comma-separated format:
   ```
   VITE_GEMINI_API_KEY=key1,key2,key3
   ```
   And implement round-robin in the fetch call (optional, nice to have).

---

## Error Handling

| Scenario | User-facing message |
|---|---|
| Gemini API rate limited (429) | "AI is processing too many requests. Using offline mode." (silent fallback to mock) |
| Gemini returns invalid JSON | "Couldn't parse your scenario. Try rephrasing with specific numbers." |
| Missing required fields after extraction | "Couldn't extract key numbers. Include: price, income, down payment, and loan duration." |
| Network error | "Connection issue. Using offline mode." (fallback to mock) |
| Empty prompt | "Type a scenario to analyze." (inline validation, no API call) |

All errors except empty prompt should fall back to mock extraction silently (the user sees a result, not an error). Only show error messages if mock ALSO fails (which should never happen).
