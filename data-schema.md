# Data Schema — Axiom

This document defines every data structure in the app. The AI extraction layer returns the **Raw Scenario JSON**. The enrichment layer adds the **enrichment** object. The store holds **Enriched Scenario**. localStorage holds arrays of Enriched Scenarios + the Profile.

---

## 1. Raw Scenario JSON (AI Extraction Output)

This is what the AI (or mock) returns from parsing the user's natural language prompt. **No calculations here — just extracted variables.**

```json
{
  "scenario": {
    "raw_prompt": "Can I afford a $40k Tesla Model 3 with $5k down over 60 months, earning $8k/month?",
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
    {
      "name": "Annual EV Registration & Tax",
      "amount_per_year": 850,
      "type": "mandatory"
    },
    {
      "name": "Insurance Premium",
      "amount_per_year": 1200,
      "type": "mandatory"
    },
    {
      "name": "Home Charging Setup",
      "amount_upfront": 500,
      "type": "upfront"
    }
  ]
}
```

### Field Reference

| Path | Type | Required | Description |
|---|---|---|---|
| `scenario.raw_prompt` | string | yes | Original user input, verbatim |
| `scenario.item_name` | string | yes | Short name for the item (e.g., "Tesla Model 3") |
| `scenario.category` | string | yes | One of: `"tech"`, `"vehicle"`, `"property"` |
| `financials.monthly_income` | number | yes | User's monthly income in USD |
| `financials.base_price` | number | yes | Total item price |
| `financials.down_payment` | number | yes | Upfront payment amount |
| `financials.tenor_months` | number | yes | Loan duration in months |
| `financials.interest_rate_assumed` | number | yes | Annual interest rate (e.g., 6.5 = 6.5%) |
| `financials.calculated_monthly_installment` | number\|null | no | If AI provides it, use it. If null, JS calculates it. |
| `hidden_costs[].name` | string | yes | Short description of the cost |
| `hidden_costs[].amount_per_year` | number | no* | Annual cost amount (*required if `amount_upfront` is absent) |
| `hidden_costs[].amount_upfront` | number | no* | One-time upfront cost (*required if `amount_per_year` is absent) |
| `hidden_costs[].type` | string | yes | One of: `"mandatory"`, `"upfront"`, `"optional"`, `"tax"`, `"maintenance"` |

---

## 2. Enriched Scenario JSON (After Calculations)

This is what gets stored in Zustand + localStorage. The `enrichment` object is added by `enrichScenario()`.

```json
{
  "id": "scenario_1724044800000",
  "created_at": "2026-08-19T12:00:00.000Z",
  "scenario": {
    "raw_prompt": "Can I afford a $40k Tesla Model 3 with $5k down over 60 months, earning $8k/month?",
    "item_name": "Tesla Model 3",
    "category": "vehicle"
  },
  "financials": {
    "monthly_income": 8000,
    "base_price": 40000,
    "down_payment": 5000,
    "tenor_months": 60,
    "interest_rate_assumed": 6.5,
    "calculated_monthly_installment": 684.81
  },
  "hidden_costs": [
    { "name": "Annual EV Registration & Tax", "amount_per_year": 850, "type": "mandatory" },
    { "name": "Insurance Premium", "amount_per_year": 1200, "type": "mandatory" },
    { "name": "Home Charging Setup", "amount_upfront": 500, "type": "upfront" }
  ],
  "enrichment": {
    "sanggup_score": {
      "score": 72,
      "status": "WARNING",
      "isPreliminary": false,
      "components": {
        "dti": { "score": 96, "weight": 0.35, "raw": 8.56 },
        "emergency": { "score": 0, "weight": 0.25, "raw": 0 },
        "downPayment": { "score": 30, "weight": 0.20, "raw": 0.125 },
        "savings": { "score": 0, "weight": 0.20, "raw": 0 }
      }
    },
    "tco": {
      "breakdown": {
        "basePrice": 40000,
        "downPayment": 5000,
        "totalInstallments": 41088.60,
        "totalTaxes": 4250,
        "totalMaintenance": 0,
        "totalOther": 500
      },
      "total": 85838.60
    },
    "opportunity_cost": {
      "futureValueDP": 7345.71,
      "futureValueMonthly": 50216.45,
      "total": 57562.16,
      "multiple": 1.28
    },
    "depreciation_curve": [
      { "year": 0, "value": 40000 },
      { "year": 1, "value": 34000 },
      { "year": 2, "value": 28900 }
    ],
    "investment_curve": [
      { "year": 0, "value": 5000 },
      { "year": 1, "value": 13734.57 },
      { "year": 2, "value": 22910.22 }
    ],
    "crossover_year": 2
  }
}
```

---

## 3. Financial Profile (localStorage)

Stored in `localStorage` under key `axiom_profile`. Entered once, used as context for all scenarios.

```json
{
  "monthly_income": 8000,
  "existing_monthly_debt": 500,
  "emergency_fund": 12000,
  "monthly_savings": 800,
  "dependents": 0,
  "updated_at": "2026-08-19T12:00:00.000Z"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `monthly_income` | number | 0 | Gross monthly income in USD |
| `existing_monthly_debt` | number | 0 | Total existing monthly debt obligations (credit cards, other loans) |
| `emergency_fund` | number | 0 | Current emergency fund balance |
| `monthly_savings` | number | 0 | Monthly amount put into savings/investments |
| `dependents` | number | 0 | Number of financial dependents |
| `updated_at` | string | — | ISO timestamp of last update |

---

## 4. Scenario History (localStorage)

Stored in `localStorage` under key `axiom_history`. Array of Enriched Scenario objects, newest first.

```json
[
  { "id": "scenario_1724044800000", "created_at": "...", "scenario": {...}, ... },
  { "id": "scenario_1723958400000", "created_at": "...", "scenario": {...}, ... }
]
```

**Maximum 50 scenarios.** When exceeding 50, remove the oldest.

---

## 5. Zustand Store Shape

```javascript
// src/store/useAxiomStore.js
import { create } from 'zustand';

const useAxiomStore = create((set, get) => ({
  // --- Current scenario (being analyzed or viewed) ---
  currentScenario: null,        // Enriched Scenario or null
  isAnalyzing: false,           // Loading state during AI extraction
  analyzeError: null,           // Error message string or null

  // --- History ---
  history: [],                  // Array of Enriched Scenarios from localStorage

  // --- Profile ---
  profile: null,                // Profile object or null

  // --- Actions ---
  analyzePrompt: async (prompt) => { /* see api-contract.md */ },
  loadFromHistory: (id) => { /* load scenario from history into currentScenario */ },
  deleteFromHistory: (id) => { /* remove from history + localStorage */ },
  saveProfile: (profileData) => { /* save to localStorage + update store */ },
  loadProfile: () => { /* load from localStorage on app init */ },
  loadHistory: () => { /* load from localStorage on app init */ },
}));
```

---

## 6. Mock Scenario Library

Pre-built mock responses for development and demo. See `api-contract.md` for full JSON.

| Mock ID | Item | Category | Purpose |
|---|---|---|---|
| `mock-car` | Tesla Model 3 ($40k) | vehicle | Default demo scenario |
| `mock-gadget` | iPhone 16 Pro Max ($1.2k) | tech | Gadget affordability |
| `mock-property` | Studio Apartment ($150k) | property | Property appreciation scenario |
| `mock-bad` | BMW M5 ($110k, $2k income) | vehicle | Triggers DANGER score — shows brutal honesty |

---

## 7. Validation Rules

The enrichment layer must validate the Raw Scenario JSON before calculating. If validation fails, show a user-facing error.

```javascript
// Required fields for enrichment to work
const REQUIRED_FIELDS = [
  'scenario.raw_prompt',
  'scenario.item_name',
  'scenario.category',
  'financials.monthly_income',
  'financials.base_price',
  'financials.down_payment',
  'financials.tenor_months'
];

// Valid category values
const VALID_CATEGORIES = ['tech', 'vehicle', 'property'];

// Valid hidden cost types
const VALID_COST_TYPES = ['mandatory', 'upfront', 'optional', 'tax', 'maintenance'];
```

If any required field is missing or invalid, the enrichment function should throw:
```javascript
throw new Error(`Invalid scenario data: missing ${fieldName}`);
```

The UI catches this and shows: "Couldn't parse your scenario. Try rephrasing with specific numbers (price, income, down payment, duration)."
