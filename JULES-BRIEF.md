# Axiom — Build Brief for Jules (AI Coding Agent)

You are continuing work on **Axiom** — a financial decision web app ("Can you afford it?"). A human product owner and a design team have already made all product decisions. Your job is to **complete the in-progress refactor, fix what's broken, and verify**. Do NOT re-decide product direction.

---

## 1. Project Context

- **Repo**: `https://github.com/geraldmartadinata/axiom` (branch `main`)
- **Stack**: Vite 6 + React 19 + Tailwind CSS v4 + React Router v7 + Zustand (`persist` middleware) + Recharts
- **i18n**: custom `LanguageContext` (EN/ID), catalogs in `src/locales/en.json` + `id.json`
- **Backend**: NONE. All state in localStorage (Zustand persist). Data extraction is mock-first.
- **Extraction**: `src/services/extraction.js` — parses natural-language prompts (EN + ID) into scenarios; `USE_MOCK = true`; optional Gemini API key via `VITE_GEMINI_API_KEY` (server route not required).
- **Frozen engine**: `src/utils/calculations.js` — the scoring/amortization math. **CRITICAL: never modify any formula or function in this file.** All new features must recompute THROUGH it, never around it.

## 2. Files to Read FIRST (in this order)

1. `README.md` — project overview + layout
2. `prd.md` — product requirements
3. `business-logic.md` — the frozen scoring spec (source of truth for formulas)
4. `data-schema.md` — session JSON shapes
5. `design-system.md` — design tokens
6. `AGENTS.md` — execution policies (MAX 3 attempts per task, scope-lock, report format)
7. `docs/ARCHITECTURE.md` — build methodology
8. `docs/NAVBAR.md` — liquid glass navbar pattern
9. `docs/ANALYZE.md` — analyze page pattern
10. `docs/HISTORY-SCHEME.md` — session routing pattern
11. `v0-prototype.html` — standalone visual reference (open in a browser; it shows the approved look: neon input, segmented gauge, green sliders, what-if chart)
12. `src/App.jsx`, `src/store/useAxiomStore.js`, `src/utils/overallScore.js`, `src/utils/format.js`

## 3. Current Repo State (IMPORTANT — mid-refactor, not yet verified)

### Already done (do not redo, but verify)
- Docs written (`README.md`, `docs/*.md`) and pushed.
- `src/index.css` — DM Sans body + Space Grotesk display fonts, `tabular-nums`, emerald range-slider styling, `.glass` liquid-glass utility, animations.
- `src/utils/overallScore.js` — `computeOverallScore(history, profile)` (debt 40% / emergency 30% / savings 20% / DP 10%) with a `NO_DATA` guard returning `score: null` when there's no profile and no confirmed purchases.
- `src/store/useAxiomStore.js` — rewritten with `persist` (v2): `currency`, `confirmPurchase(id, overrides)`, `unconfirmPurchase(id)`, session `status` (`ANALYZED`/`CONFIRMED`), `analyzePrompt` saves to history.
- `src/App.jsx` — new routes: `/`, `/analyze`, `/analyze/new`, `/analyze/:sessionId`, `/profile`.
- `src/components/layout/DynamicIsland.jsx` — liquid-glass floating navbar, 3 links (Home/Analyze/Profile), **overall health score badge**, **separate language toggle fixed top-right with ID/US flag SVGs**.
- `src/components/ui/Flag.jsx` — inline SVG flags (no assets).
- `src/components/ui/Modal.jsx` — created (glass dialog).
- `src/components/score/ScoreGauge.jsx` — segmented zone gradation (red→amber→green) + active arc.
- `src/components/capsule/CommandCapsule.jsx` — neon input (cyan left border, pulsing status), Lucide category chips (Car/Home/Smartphone), typing-effect recommendations, Ctrl+Enter.
- `src/components/parameters/Parameters.jsx` — green sliders (DP/Term/Income), live score recompute through the frozen engine.
- `src/components/charts/ProjectionChart.jsx` — "What If" v2 with meaningful framing: savings recovery time, retirement-impact delay, time-to-ceiling, alternative milestone chips.
- `src/components/cards/ScenarioCard.jsx` — `to` prop (Link), CONFIRMED badge, per-session currency.
- `src/components/cards/{DTICard,TCOCard,HiddenCostsCard,OpportunityCostCard}.jsx` — accept `lang` + `currency` props.
- `src/locales/en.json` + `id.json` — fully rewritten with all new keys.
- `src/utils/format.js` — currency-aware statics: `formatCurrency(amount, lang, currency)` etc.
- `src/pages/analyze/AnalyzeIndex.jsx` (session picker), `AnalyzeEditor.jsx` (/new), `AnalyzeSession.jsx` (/:sessionId full workspace + confirm-purchase modal).
- `src/pages/Dashboard.jsx` — hero + overall health card + recent analyses + insight strip.

### Known broken / incomplete (YOUR TASKS)
- **`npm run build` has NOT been run since the refactor — it may fail. Fix until it passes.**
- `src/pages/History.jsx`, `src/pages/Projections.jsx`, `src/pages/Analyze.jsx` (old) are orphaned and reference removed/renamed exports — **delete them** (merged into Analyze per the new scheme).
- `src/pages/Profile.jsx` + `src/components/forms/ProfileForm.jsx` — NOT yet upgraded. Needs: **currency toggle (IDR/USD)** with dots-for-thousands formatting, placeholders in the active currency, and a check that all imports still exist in the new `format.js`.
- `src/pages/Dashboard.jsx` — insight strip uses `t('dashboard.insightLabel')` which does NOT exist in the catalogs (correct key: `cards.insight.label`). Fix it.
- `src/components/layout/DynamicIsland.jsx` — badge only shows when `confirmedCount > 0`; it should show the overall score whenever `overall.status !== 'NO_DATA'` (profile alone is enough). Also handle `NO_DATA` so the badge doesn't render red.
- `src/pages/analyze/AnalyzeSession.jsx` — DTI card status is hardcoded to `'SAFE'` fallback; compute status from the DTI value (<30 SAFE, ≤45 WARNING, else DANGER). Note: `enrichScenario` does NOT emit `enrichment.dti`, so compute it in the page from `financials` (do not touch `calculations.js`).

## 4. Product Spec (locked — implement exactly)

### 4.1 Pages (exactly 3)
| Route | Page | Content |
|---|---|---|
| `/` | Dashboard | Hero (title + subtitle + neon analyzer input) above the fold; below the fold: Overall Health card (gauge + factor bars), Recent Analyses grid, insight strip |
| `/analyze` | AnalyzeIndex | Session picker. **If no history: friendly empty state with a "Start your first analysis" CTA — NOT a redirect, NOT an error** |
| `/analyze/new` | AnalyzeEditor | Blank analyzer (same CommandCapsule, autofocused). On success → navigate to `/analyze/:id` |
| `/analyze/:sessionId` | AnalyzeSession | Full workspace: ScoreGauge + ScoreBreakdown, Parameters (live sliders), DTICard, TCOCard, HiddenCostsCard, OpportunityCostCard, ProjectionChart v2, **Confirm Purchase** button + modal, Delete |
| `/profile` | Profile | Financial profile form + **IDR/USD currency toggle** |

Old `/history` and `/projections` routes are GONE (merged). Navbar shows 3 links only.

### 4.2 Confirm Purchase → Overall Health Score
- A session has `status: 'ANALYZED'` by default. The workspace's **"I actually bought this"** button opens a modal (final price / final DP / final term pre-filled), and `confirmPurchase(sessionId, overrides)` marks it `status: 'CONFIRMED'` with a `confirmation` object.
- The **Overall Health Score** (navbar badge + Dashboard card) is computed by `computeOverallScore(history, profile)` from CONFIRMED purchases + profile. Factor weights: Debt Load 40% / Emergency Fund 30% / Savings Rate 20% / DP Discipline 10%.
- `unconfirmPurchase` restores `ANALYZED`.

### 4.3 Projections v2 (meaningful framing)
The What-If card shows, alongside the emerald investment-vs-red-asset chart:
1. **Savings Recovery Time** — months to rebuild a 6-month expense buffer at the savings rate
2. **Retirement Impact** — how many months the purchase delays reaching first Rp100M invested
3. **Time-to-Ceiling** — months until this purchase fits at ≤25% DTI (5% annual income growth assumption)
4. **Alternative Milestones** — chips: "a fully-funded emergency fund", "20% of your next down payment", "a year of groceries"

All framing numbers are derived in the component layer from `financials` — do not touch the frozen engine.

### 4.4 Currency
- Global default `currency` in store (`IDR` default). Sessions store their own `currency` at analysis time (per-session persistence).
- All money renders via `formatCurrency(amount, lang, currency)` — IDR uses dots for thousands (`Rp1.500.000`), USD uses commas. `id-ID` / `en-US` Intl formats.
- Profile page gets an IDR/USD toggle that updates the store currency.

## 5. Design System (locked — do not drift)

- **Colors**: zinc-950 base; surfaces `bg-zinc-900/60-70` + `backdrop-blur-xl` + `border-white/[6-10%]`; **cyan-400 = primary action + gauge accents ONLY**; **emerald = sliders/success**; amber = warnings; red = danger.
- **Fonts**: DM Sans (body), Space Grotesk (display, via `.font-display`). Numbers use `tabular-nums`. **NO JetBrains Mono / no "tech" fonts anywhere.**
- **Liquid glass**: `backdrop-filter: blur(20px) saturate(160%)` + translucent bg + hairline border (`.glass` class exists).
- **Gauge**: segmented zones red→amber→green visible behind a colored active arc (already implemented in ScoreGauge).
- **Input**: neon cyan left border, pulsing "AI Analyzer Active" status dot, category chips with **Lucide icons** (Car/Home/Smartphone), gradient cyan ANALYZE button.
- **Navbar**: floating pill top-center, glass, brand mark (gradient "A" square) + "Axiom" + overall-score badge; links Home/Analyze/Profile; **language toggle is a SEPARATE fixed button top-right with ID/US flag + "EN"/"ID" text** (NOT inside the pill).
- **No emojis anywhere** — Lucide icons only. No fabricated testimonials.

## 6. Non-Negotiable Rules

1. **Never modify `src/utils/calculations.js`** — it is frozen verbatim from `business-logic.md`. New features compute THROUGH it.
2. **No emojis** in any UI string or component.
3. **One font family set** — DM Sans + Space Grotesk only; `tabular-nums` for all figures.
4. **Green for sliders** (already styled in `index.css`); cyan only for primary action/gauge.
5. i18n: every user-facing string must come from `t('...')` with keys in BOTH `en.json` and `id.json`. No hardcoded UI text.
6. Currency-aware formatting everywhere money appears (pass `lang` + `currency`).
7. Follow `AGENTS.md`: MAX 3 attempts per task, scope-lock, no silent retries, report in the required format.
8. Session pages must tolerate stale links (`/analyze/:id` for a deleted session → "Session not found" state, not a crash).

## 7. Deliverables / Definition of Done

1. `npm install && npm run build` exits 0 with zero errors.
2. `npm run dev` — verify in a browser:
   - `/` hero renders; typing effect plays; chips work; ANALYZE → lands on `/analyze/:id`
   - `/analyze` with empty history shows the friendly empty state (not a dead end)
   - `/analyze/:id` full workspace renders; **sliders change the score live**; confirm purchase → modal → navbar overall score updates; undo works
   - `/profile` form saves; currency toggle switches IDR↔USD and dots formatting
   - Language toggle (top-right, flags) switches the ENTIRE UI EN↔ID
   - Direct URL to a deleted session shows "Session not found"
3. Orphaned pages deleted; no dead imports; no console errors.
4. Commit with clear messages; push to `main` (this repo's current convention for this project).

## 8. Report Format (required)

```
Status: DONE / BLOCKED
Files changed: <list>
Build: PASS / FAIL <paste last 5 lines of output>
Verified: <what you tested in the browser>
Issues: <anything you could not fix, or pre-existing issues you left alone>
Ready: YES / NO + why
```
