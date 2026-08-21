# Build Order — Axiom (5-Day Sprint)

> **Deadline: August 24, 2026.** Solo. JavaScript (no TS). Mock-first.
>
> **Rule:** Complete each day's tasks before moving to the next. If you're behind, cut NICE TO HAVE features first. Never cut MUST HAVE features.
>
> **Execution model:** Each task is one prompt to the coder agent. After each task, verify (build + visual check) before sending the next prompt. See `vibe-coding-delivery` skill: "one session = one intent, one prompt = one task."

---

## Pre-Flight (Before Day 1)

Read these files in order before writing ANY code:
1. `prd.md` — what we're building
2. `business-logic.md` — the math (copy verbatim)
3. `data-schema.md` — data shapes
4. `design-system.md` — colors, typography, CSS
5. `component-tree.md` — file structure, every component
6. `api-contract.md` — extraction layer

**Do not write code until you've read all 6 files and can summarize what Axiom does in 2 sentences.**

---

## Day 1 (Aug 19) — Foundation & Design System

**Goal:** Running Vite dev server with design system, core utils, and empty page shell.

### Task 1.1: Scaffold Project
```bash
cd D:\project\webdev\axiom
npm create vite@latest . -- --template react
npm install
npm install react-router-dom zustand recharts lucide-react clsx tailwind-merge
npm install -D tailwindcss @tailwindcss/vite
```

**Verify:** `npm run dev` shows Vite welcome page at localhost:5173.

### Task 1.2: Configure Vite + Tailwind
- Replace `vite.config.js` with:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 }
})
```

- Replace `src/index.css` with (from `design-system.md`):
```css
@import "tailwindcss";

* { scrollbar-width: thin; scrollbar-color: #27272a #09090b; }

body {
  @apply bg-zinc-950 text-zinc-300 antialiased;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}

/* Animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-slide-up { animation: slide-up 0.5s ease-out; }
.animate-scale-in { animation: scale-in 0.3s ease-out; }

.stagger-1 { animation-delay: 0.05s; animation-fill-mode: backwards; }
.stagger-2 { animation-delay: 0.1s; animation-fill-mode: backwards; }
.stagger-3 { animation-delay: 0.15s; animation-fill-mode: backwards; }
.stagger-4 { animation-delay: 0.2s; animation-fill-mode: backwards; }
.stagger-5 { animation-delay: 0.25s; animation-fill-mode: backwards; }
.stagger-6 { animation-delay: 0.3s; animation-fill-mode: backwards; }
```

- Add Inter font to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- Delete boilerplate: `src/App.css`, `src/assets/`, `public/vite.svg`. Remove favicon link from `index.html`.

**Verify:** `npm run dev` shows blank dark page. No console errors.

### Task 1.3: Create Core Utils
- `src/utils/cn.js`:
```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs) { return twMerge(clsx(inputs)) }
```

- `src/utils/calculations.js`: **Copy ALL functions verbatim from `business-logic.md` sections 1-8.** Do not modify any formula. Do not skip any function. The file must contain: `calculateMonthlyInstallment`, `calculateDTI`, `calculateSanggupScore`, `calculateTCO`, `calculateOpportunityCost`, `generateDepreciationCurve`, `generateInvestmentCurve`, `enrichScenario`, `findCrossoverYear`.

- `src/utils/format.js`:
```js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
export function formatNumber(amount) {
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}
export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
```

**Verify:** `npm run build` — no errors. Calculations file imported without issue.

### Task 1.4: Layout Shell + Background + DynamicIsland
- Create `src/components/layout/Background.jsx` (from `component-tree.md`)
- Create `src/components/layout/DynamicIsland.jsx` (from `component-tree.md`)
- Create `src/components/layout/Layout.jsx` (from `component-tree.md`)
- Create `src/App.jsx` with router setup (from `component-tree.md`)
- Create empty page files: `Dashboard.jsx`, `Analyze.jsx`, `Projections.jsx`, `History.jsx`, `Profile.jsx` — each just renders a `<div>Page name</div>` placeholder.

**Verify:** `npm run dev` shows dark page with navbar pill. All 5 routes navigable. No errors.

### Day 1 Completion Check:
- [ ] Vite dev server runs
- [ ] Dark zinc-950 background visible
- [ ] Dynamic Island navbar renders with links
- [ ] All 5 routes accessible (even if placeholder content)
- [ ] `calculations.js` has all 9 functions
- [ ] `npm run build` succeeds

---

## Day 2 (Aug 20) — Store, Mocks, Extraction, Dashboard

**Goal:** User can type a prompt, get mock extraction, and see enriched data in console.

### Task 2.1: Create Mock Data Files
- Create `src/mocks/mock-car.json` (from `api-contract.md`)
- Create `src/mocks/mock-gadget.json` (from `api-contract.md`)
- Create `src/mocks/mock-property.json` (from `api-contract.md`)
- Create `src/mocks/mock-bad.json` (from `api-contract.md`)

**Verify:** Files are valid JSON. `node -e "console.log(require('./src/mocks/mock-car.json'))"` prints the object.

### Task 2.2: Create Zustand Store
- Create `src/store/useAxiomStore.js` (from `data-schema.md` section 5)
- Implement all actions:
  - `analyzePrompt(prompt)`: calls `extractAndEnrich(prompt)`, sets `currentScenario`, sets `isAnalyzing` during call, sets `analyzeError` on failure
  - `loadFromHistory(id)`: finds scenario in history, sets as `currentScenario`
  - `deleteFromHistory(id)`: removes from history array + localStorage
  - `saveProfile(data)`: saves to localStorage key `axiom_profile`, updates store
  - `loadProfile()`: loads from localStorage on init
  - `loadHistory()`: loads from localStorage key `axiom_history` on init
- Helper functions: `getProfile()`, `saveScenarioToHistory(scenario)` (exported for extraction layer)

**Verify:** Import store in a component, call `analyzePrompt("Can I afford a $40k Tesla?")`, check console — should log enriched scenario with all calculations.

### Task 2.3: Create Extraction Service
- Create `src/services/extraction.js` (from `api-contract.md`)
- Keep `USE_MOCK = true` for now

**Verify:** Call `extractAndEnrich("Can I afford a $40k Tesla?")` from console — returns enriched scenario with sanggup_score, tco, opportunity_cost, depreciation_curve, investment_curve.

### Task 2.4: Build UI Components
- Create `src/components/ui/Button.jsx` (from `component-tree.md`)
- Create `src/components/ui/Card.jsx` (from `component-tree.md`)
- Create `src/components/ui/Badge.jsx` (from `component-tree.md`)
- Create `src/components/ui/Input.jsx` (from `component-tree.md`)
- Create `src/components/ui/Spinner.jsx` (from `component-tree.md`)

**Verify:** Import each in Dashboard.jsx, render a test card with a button + badge + input. Check visual styling matches design-system.md.

### Task 2.5: Build Command Capsule + Dashboard
- Create `src/components/capsule/CommandCapsule.jsx` (from `component-tree.md`)
- Implement Dashboard.jsx:
  - Hero headline: "Can you afford it?"
  - Sub-text: "Type your scenario. Get the brutal truth."
  - CommandCapsule
  - Recent scenarios (from store.history) OR empty state with 3 example prompts
  - Profile widget (small card)
  - On analyze success: `navigate('/analyze')`

**Verify:** Type "Can I afford a $40k Tesla?" → press submit → loading state → redirects to /analyze (still placeholder). Check console: enriched scenario in store.

### Day 2 Completion Check:
- [ ] Mock JSON files valid
- [ ] Store works (analyze, load, delete, save profile)
- [ ] Extraction returns enriched scenario with all metrics
- [ ] Dashboard renders with Command Capsule
- [ ] Typing + submitting redirects to /analyze
- [ ] `npm run build` succeeds

---

## Day 3 (Aug 21) — Analyze Page (The Money Page)

**Goal:** Full Analyze page with all metric cards. This is the page judges will look at most.

### Task 3.1: ScoreGauge Component
- Create `src/components/score/ScoreGauge.jsx` (from `component-tree.md`)
- SVG circular gauge with animated progress ring
- Score number in center, colored by status
- "Preliminary" badge if `isPreliminary`

**Verify:** Pass `{ score: 86 }` → green gauge renders. Pass `{ score: 35 }` → red gauge. Pass `{ score: 65 }` → amber.

### Task 3.2: ScoreBreakdown Component
- Create `src/components/score/ScoreBreakdown.jsx` (from `component-tree.md`)
- 4 horizontal progress bars for each component
- Each bar shows: label, weight, raw value, sub-score

**Verify:** Pass the components object from a mock enriched scenario. All 4 bars render with correct colors.

### Task 3.3: DTICard Component
- Create `src/components/cards/DTICard.jsx` (from `component-tree.md`)
- Horizontal bar with 3 colored zones (green/amber/red)
- Marker showing current DTI position
- Breakdown: new payment, existing debt, income

**Verify:** DTI 8.5% → marker in green zone. DTI 35% → marker in amber zone. DTI 60% → marker in red zone.

### Task 3.4: TCOCard Component
- Create `src/components/cards/TCOCard.jsx` (from `component-tree.md`)
- Stacked list of all cost components
- Grand total in large text
- "X× the sticker price" multiplier

**Verify:** Pass mock-car TCO data. Total ≈ $85k. Shows ~2.1× sticker price.

### Task 3.5: HiddenCostsCard Component
- Create `src/components/cards/HiddenCostsCard.jsx` (from `component-tree.md`)
- Each cost as a row with type badge
- Per-year costs show total over tenor

**Verify:** Pass mock-car hidden costs. Shows 4 costs with badges. Annual costs show total over 5 years.

### Task 3.6: OpportunityCostCard Component
- Create `src/components/cards/OpportunityCostCard.jsx` (from `component-tree.md`)
- BIG number (opportunity total)
- "X× what you'd spend" multiplier
- Breakdown of DP growth + monthly growth
- S&P 500 disclaimer

**Verify:** Pass mock-car opportunity cost. Shows ~$57k potential wealth. Shows ~1.3× multiplier.

### Task 3.7: Assemble Analyze Page
- Implement `src/pages/Analyze.jsx` (from `component-tree.md`)
- 2-column grid layout
- Left: ScoreGauge → ScoreBreakdown → DTICard
- Right: OpportunityCostCard → TCOCard → HiddenCostsCard
- Each card with `animate-slide-up stagger-N`
- Guard: redirect to / if no currentScenario

**Verify:** Submit Tesla scenario → /analyze renders full page with all cards. All numbers correct. Layout responsive (2-col desktop, 1-col mobile). Screenshot this.

### Day 3 Completion Check:
- [ ] ScoreGauge renders with correct colors
- [ ] ScoreBreakdown shows 4 components
- [ ] DTICard shows bar with marker
- [ ] TCOCard shows breakdown + total
- [ ] HiddenCostsCard lists all costs
- [ ] OpportunityCostCard shows big number
- [ ] Analyze page assembles all cards in 2-col layout
- [ ] `npm run build` succeeds

---

## Day 4 (Aug 22) — Projections, History, Profile

**Goal:** All remaining pages functional.

### Task 4.1: ProjectionChart Component
- Create `src/components/charts/ProjectionChart.jsx` (from `component-tree.md`)
- Recharts AreaChart with 2 areas (depreciation + investment)
- Crossover reference line if applicable
- Formatted tooltips
- Responsive height (400px desktop, 300px mobile)

**Verify:** Pass mock-car curves. Chart renders 2 overlapping areas. Red declining, green rising. Crossover marker visible.

### Task 4.2: Projections Page
- Implement `src/pages/Projections.jsx` (from `component-tree.md`)
- Chart + summary stats below
- Asset value, investment value, difference

**Verify:** Navigate to /projections after analyzing Tesla. Chart + stats render correctly.

### Task 4.3: ScenarioCard Component
- Create `src/components/cards/ScenarioCard.jsx` (from `component-tree.md`)
- Compact card: item name, category badge, score badge, date, key metrics
- Delete button on hover
- Clickable → loads scenario + navigates to /analyze

**Verify:** Pass 3 mock scenarios. Grid of cards renders. Click opens scenario. Delete removes it.

### Task 4.4: History Page
- Implement `src/pages/History.jsx` (from `component-tree.md`)
- Grid of ScenarioCards from store.history
- Empty state with CTA
- Delete functionality

**Verify:** Analyze 3 scenarios → go to /history → 3 cards visible. Delete one → 2 remain. Refresh page → 2 still there (localStorage).

### Task 4.5: ProfileForm Component
- Create `src/components/forms/ProfileForm.jsx` (from `component-tree.md`)
- 5 input fields (income, debt, emergency fund, savings, dependents)
- Save button → store.saveProfile()
- Pre-fill from store.profile

**Verify:** Fill profile → save → refresh → values persist. Analyze new scenario → score no longer shows "Preliminary."

### Task 4.6: Profile Page
- Implement `src/pages/Profile.jsx` (from `component-tree.md`)
- Impact notice card
- ProfileForm
- "Why we need this" explainer

**Verify:** Page renders form. Save works. Values persist across refresh.

### Day 4 Completion Check:
- [ ] ProjectionChart renders 2 areas with crossover
- [ ] Projections page complete
- [ ] ScenarioCard renders compact info
- [ ] History page with grid + empty state + delete
- [ ] ProfileForm saves to localStorage
- [ ] Profile page complete
- [ ] All 5 pages functional
- [ ] `npm run build` succeeds

---

## Day 5 (Aug 23) — Polish, Swap, Deploy

**Goal:** Production-ready, polished, deployed.

### Task 5.1: Loading & Empty States
- Add full-screen loading overlay on Dashboard when `isAnalyzing` (blur background + spinner + "Analyzing your scenario...")
- Add empty state illustrations on History (text-based, not images)
- Add error state on Analyze if enrichment fails
- Add "Preliminary Score" badge on ScoreGauge when no profile

**Verify:** Test all states visually.

### Task 5.2: Animations & Transitions
- Verify stagger animations on Analyze page cards
- Add hover transitions on cards, buttons, inputs
- Add smooth route transitions (optional, if time permits)
- Verify `animate-slide-up` + `stagger-N` on all card grids

**Verify:** Visual review. Screenshot every page.

### Task 5.3: Responsive Check
- Test all pages at: 375px (mobile), 768px (tablet), 1280px (desktop)
- Fix any layout breaks
- Ensure DynamicIsland collapses to hamburger on mobile (or simplifies to icon-only)
- Ensure 2-col grids become 1-col on mobile

**Verify:** Screenshots at all 3 breakpoints.

### Task 5.4: Gemini API Swap (Optional)
- Get Gemini API key from Google AI Studio
- Create `.env` in project root: `VITE_GEMINI_API_KEY=your_key`
- Set `USE_MOCK = false` in `src/services/extraction.js`
- Test with real prompt: "Can I afford a $40k Tesla Model 3 with $5k down over 60 months, earning $8k/month?"
- Verify response matches Master JSON schema
- If fails: set `USE_MOCK = true` again (mock is the fallback)

**Verify:** Real Gemini extraction works OR mock fallback confirmed.

### Task 5.5: Deploy
```bash
npm run build
```
- Deploy `dist/` to Vercel (drag-and-drop or CLI):
```bash
npm i -g vercel
vercel
```
- Verify deployed URL works
- Test all flows on deployed version

**Verify:** Live URL accessible. All 5 pages work. Mock extraction works on deployed version.

### Task 5.6: Final Polish
- Favicon (create simple SVG favicon)
- Page titles (`<title>`) for each route
- Meta description
- Check for console errors/warnings
- Remove any dead code
- Run `npm run build` one final time

### Day 5 Completion Check:
- [ ] Loading/empty/error states implemented
- [ ] Animations smooth
- [ ] Responsive at 375px / 768px / 1280px
- [ ] Gemini swap tested (or confirmed mock fallback)
- [ ] Deployed to Vercel (or similar)
- [ ] Live URL works
- [ ] No console errors
- [ ] `npm run build` succeeds

---

## Day 6 (Aug 24) — Buffer & Demo Prep

**Use this day for:**
- Fixing any bugs found during testing
- Preparing demo scenarios (memorize 3 prompts: Tesla, iPhone, Studio Apartment)
- Practicing demo flow: Dashboard → type prompt → Analyze → Projections → History → Profile
- If everything is solid: implement NICE TO HAVE features (Smart Alternative, Stress Test, Educational Tooltips, Side-by-side comparison)
- Final deploy if any changes were made

### Demo Flow Script:
1. **Open Dashboard** — "This is Axiom. You type a financial scenario, it tells you if you can afford it."
2. **Type:** "Can I afford a $40k Tesla Model 3 with $5k down over 60 months, earning $8k/month?"
3. **Show Analyze** — "Score 72, Warning. Here's why: zero emergency fund, thin down payment, no savings."
4. **Show Opportunity Cost** — "If you invested instead: $57k in 5 years. That's 1.3× what you'd spend."
5. **Show Projections** — "In 10 years: the Tesla is worth $8k, but the investment is worth $93k."
6. **Show History** — "Every scenario is saved. You can review past decisions."
7. **Show Profile** — "Complete your profile for accurate scoring."
8. **Type the bad scenario:** "Can I afford a $110k BMW M5 earning $2k/month?" → RED SCORE. "Axiom says no."

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Behind schedule after Day 3 | Cut: Stress Test, Educational Tooltips, Smart Alternative. Keep: all MUST HAVE. |
| Gemini API not working | Mock-first design. `USE_MOCK = true` is the default. Demo works without any API key. |
| Chart rendering issues | Recharts is well-documented. If stuck, use a simpler chart (just the depreciation curve without investment overlay). |
| Responsive issues on mobile | DynamicIsland → simplify to just brand + hamburger. Grids → 1-col. Charts → reduce height. |
| Build errors | Run `npm run build` after EVERY task, not just at end. Catch errors early. |
