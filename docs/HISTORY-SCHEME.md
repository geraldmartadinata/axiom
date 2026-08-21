# History & Session Scheme

How past analyses are stored, listed, and routed. This is the trickiest
pattern in the app — get it right and the app feels like a real product.

## Data Model (current)

Each analysis is a **session**:

```jsonc
{
  "id": "s_8f2k3j",                 // stable, URL-safe, unique
  "created_at": "2026-08-21T14:00:00Z",
  "scenario": {
    "raw_prompt": "Bisa beli Honda Civic Rp550jt...",
    "item_name": "Honda Civic RS",
    "category": "vehicle"           // vehicle | property | tech
  },
  "financials": {
    "base_price": 550000000,
    "down_payment": 100000000,
    "term_months": 60,
    "monthly_income": 15000000,
    "currency": "IDR"               // NEW: per-session currency
  },
  "enrichment": {
    "sanggup_score": { "score": 46, "label": "PRELIMINARY", ... },
    "dti": { ... },
    "tco": { ... },
    "hidden_costs": [ ... ],
    "opportunity_cost": { ... },
    "projections": { ... }          // curves + crossover year
  }
}
```

## Persistence

Zustand `persist` middleware → localStorage key `axiom-storage`.

```js
export const useAxiomStore = create(
  persist(
    (set, get) => ({ /* state + actions */ }),
    { name: 'axiom-storage' }
  )
)
```

**Rule:** every session is immutable once saved. Editing a session = new
session. (This is what makes per-session URLs stable.)

## Current Routing (to be replaced)

| Route | Behavior |
|---|---|
| `/` | Dashboard: hero, input, recent sessions |
| `/analyze` | Guard: no currentScenario → redirect to `/` |
| `/history` | List all sessions (to be merged into Analyze) |
| `/projections` | Chart for currentScenario (to be merged) |
| `/profile` | Profile form (keep) |

## Target: Per-Session Routing

The key improvement — **every session gets its own page**:

| Route | Behavior |
|---|---|
| `/analyze` | Session picker: list history, or empty state "No history yet — analyze your first purchase" |
| `/analyze/:sessionId` | Full workspace for that session: score, breakdown, parameters, projections |
| `/analyze/new` | Blank input — the v0 neon analyzer |

### Why per-session URLs

1. **Shareable / bookmarkable** — `axiom.vercel.app/analyze/s_8f2k3j` survives reloads
2. **No lost state** — each page reads its own session from the store, no
   "currentScenario" global race
3. **Fewer bugs** — the page is a pure function of `:sessionId`
4. **Back button works** — browser history = session history

### Implementation sketch

```jsx
// App.jsx
<Route path="/analyze" element={<AnalyzeIndex />} />
<Route path="/analyze/new" element={<AnalyzeEditor />} />
<Route path="/analyze/:sessionId" element={<AnalyzeSession />} />
```

```jsx
// AnalyzeSession.jsx
const { sessionId } = useParams()
const session = useAxiomStore(s => s.history.find(h => h.id === sessionId))

if (!session) return <NotFound />   // stale link — show "session not found"
// pure render: <ScoreGauge />, <Breakdown />, <Parameters />, <Projections />
```

### The "Confirm Purchase" hook (overall health score)

When a user confirms they actually made the purchase:

```js
confirmPurchase(sessionId, { finalDownPayment, finalTerm, actualPrice })
```

This marks the session `status: 'CONFIRMED'` and feeds the **overall health
score** — computed from all confirmed purchases (debts, remaining savings,
DTI) — displayed in the navbar and dashboard.

```
overallScore = f(confirmed purchases, profile, savings)
  80-100 → SAFE (emerald)
  50-79  → CAUTION (amber)
  0-49   → DANGER (red)
```

## Deletion

```js
deleteFromHistory(id)  // filter out + persist
```

On a per-session page, a "Delete" action returns to `/analyze`.

## Pitfalls

1. **Never generate IDs at render time** — `crypto.randomUUID()` or a counter
   in the store action, once, at save.
2. **Session pages must tolerate stale links** — deleted session → NotFound
   state, not a crash.
3. **The empty state is a feature** — "/analyze with no history" should be a
   friendly onboarding, not an error. "You haven't analyzed anything yet.
   Your first purchase is waiting." + the input right there.
4. **Currency per session** — a session analyzed in IDR must render in IDR
   forever, even if the user later switches to USD. Store it on the session.
