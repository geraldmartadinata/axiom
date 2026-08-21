# Analyze Page

The core page. Type a purchase in natural language → get a Health Score, cost
breakdown, and projections. This documents both the current implementation and
the target design (post-v0).

## Current Flow

```
User types prompt → extraction.js parses → calculations.js enriches → store saves → UI renders
```

### 1. Input: `src/services/extraction.js`

Parses natural language into a normalized scenario. Regex-based, deterministic
(no LLM call — cheap, instant, testable):

```js
// pattern: price, down payment, term, income
'Can I afford a $40k Tesla with $5k down over 60 months earning $8k/month?'
→ {
  scenario: { item_name: 'Tesla', category: 'vehicle', ... },
  financials: { base_price: 40000, down_payment: 5000, term_months: 60, monthly_income: 8000 },
  enrichment: { sanggup_score: { ... } }   // from frozen engine
}
```

**Rule:** extraction never computes — it only parses and delegates to the
frozen engine in `calculations.js`.

### 2. Enrichment: `src/utils/calculations.js` (FROZEN)

Deterministic engine: installment math, DTI, TCO, hidden costs, opportunity
cost, crossover year, 0–100 score. **Agents must not modify this file.**

### 3. Store: `src/store/useAxiomStore.js`

`analyzePrompt(text)` → parses → enriches → `set({ currentScenario })` →
`saveToHistory(scenario)`.

### 4. UI: `src/pages/Analyze.jsx`

Guard: if no `currentScenario`, redirect to Dashboard. (Target design changes
this — see "Session Scheme" below.)

## Target Design (approved direction)

The Analyze page becomes the **single analysis workspace**, absorbing History:

- `/analyze` — no session selected: show "No history yet" empty state +
  prominent input (NOT an inaccessible redirect)
- `/analyze/:sessionId` — per-session page: full analysis + projections +
  parameters for THAT session
- The input card gets the neon treatment from v0 (left cyan border, pulsing
  "AI Analyzer Active" status, category chips Auto/House/Tech — icons, NOT
  emojis)

## Components (current)

| Component | Role |
|---|---|
| `CommandCapsule` | Hero input: textarea + example buttons + Ctrl+Enter |
| `ScoreGauge` | 0–100 circular gauge, animated needle |
| `ScoreBreakdown` | Factor weights (DTI 35%, Emergency 25%, ...) |
| `DTICard` | DTI bar with SAFE/WARNING/DANGER zones |
| `TCOCard` | Base + DP + installments + taxes + maintenance |
| `HiddenCostsCard` | The costs people forget |
| `OpportunityCostCard` | What investing instead would return |
| `ProjectionChart` | Depreciation vs investment curves + crossover |

## Planned Additions (from v0 prototype)

- **Parameters card** — live sliders (DP / Term / Income) that recompute the
  score in real time. This is the "find your ceiling" interaction.
- **Neon input** — `border-l-2 border-cyan-400` + glow on focus.
- **Category chips** — Auto/House/Tech with Lucide icons, active state =
  cyan filled.
- **IDR/USD toggle** for salary/savings fields; thousands separators (dots for
  IDR: `1.500.000`).
- **Score gradation** — red → yellow → green conic zones on the gauge.

## Pitfalls

1. **Never let the guard redirect when history is empty** — show an empty
   state instead. Dead ends kill demos.
2. **Extraction must handle both languages** — regexes for `Rp`, `jt`, `bln`
   (ID) AND `$`, `k`, `mo` (EN). Test both.
3. **Keep the frozen engine untouched** — all new features (sliders) must
   recompute THROUGH it, never around it.
4. **Save to history on every successful analysis** — the session scheme
   depends on it.
