# How to Build: Architecture & Methodology

This documents how Axiom was built — the methodology that makes it executable by
a coder agent without hallucination, and the patterns worth reusing in future
projects.

## The Core Principle

**The expensive model writes the plan AND all the hard code. The cheap model
only verifies, polishes, and ships.**

Hallucination happens when a model is asked to *invent*. It stops when the model
is asked to *execute*. Every file below exists because it was pre-written,
frozen, and verified — nothing is left to improvisation at build time.

## 5-Step Build Methodology

### Step 1: Planning Docs First (no code)

Before a single file, write these in markdown:

| Doc | Answers |
|---|---|
| `prd.md` | What problem? Who is it for? What are the features? |
| `business-logic.md` | Exact formulas, thresholds, scoring rules. **Frozen.** |
| `data-schema.md` | Every field, every type, every relationship. |
| `design-system.md` | Colors (oklch), fonts, spacing, radius, shadows, motion. |

**Why:** a coder agent can build from a spec but cannot *design* one. The spec
is the contract.

### Step 2: Freeze the Business Logic

The scoring engine lives in one file: `src/utils/calculations.js`. It is copied
**verbatim** from `business-logic.md` and never modified by an agent.

```js
// Rule: agents may NOT rewrite this file.
// The numbers ARE the product.
```

### Step 3: Mock-First with a Swap Contract

Everything that will later hit an API starts as a deterministic mock:

- `src/mocks/mock-car.json`, `mock-gadget.json`, `mock-property.json`
- `src/services/extraction.js` — parses natural-language prompts into
  normalized scenarios, then enriches via the frozen engine
- `api-contract.md` — documents the exact request/response shape so the mock
  can be swapped for a real endpoint without touching UI code

The mock is the API. The API becomes the mock's twin.

### Step 4: Deterministic UI Layer

- Zustand store with `persist` middleware → localStorage, zero backend needed
- Pure utility functions (`format.js`, `cn.js`) — no hidden state
- All calculations derived from store state, never from component state

### Step 5: Verify Like a Human

1. `npm run build` must exit 0
2. Smoke-test the full flow in a real browser (analyze → projections → history)
3. Check the console for JS errors
4. Screenshot for visual review

## Why This Beats "Just Prompt It"

| Without methodology | With methodology |
|---|---|
| Agent invents formulas | Formulas frozen from spec |
| Agent guesses component names | Component tree pre-declared |
| Agent fabricates data | Mock data is a contract |
| Agent rewrites working code | Execution guide says what NOT to touch |
| 3 attempts per task, no loop guard | AGENTS.md: MAX 3 attempts, scope-lock, timebox |

## Design Prototype Workflow

Before touching React, build `v0-prototype.html` — a single self-contained file
with inline CSS/JS that demonstrates:

1. The exact visual system (tokens from `design-system.md`)
2. The interactions (gauge draw, slider→score live update, language toggle)
3. The layout (hero above fold, dashboard below)

Iterate on THIS with the user — cheap, instant, no build step. Only when the
visuals are approved, port to React components.

## Reusable Patterns

- **Frozen engine pattern** — one file, no agent edits, spec is source of truth
- **Mock-as-contract pattern** — mocks shaped exactly like the future API
- **Prototype-first pattern** — standalone HTML before React
- **i18n context pattern** — LanguageProvider + JSON catalogs, no library needed
- **Persist middleware pattern** — localStorage persistence in 3 lines
