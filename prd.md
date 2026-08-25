# Product Requirements Document (PRD) — Axiom

## 1. Product Vision & Identity

**Axiom** is a financial decision companion that tells you the brutal truth about whether you can afford something — and what it actually costs you.

Most financial apps exist to sell you products. Axiom exists to tell you NO.

Users type a natural-language scenario ("Can I afford a $40k Tesla with $5k down over 60 months earning $8k/month?"). AI extracts the numbers. Deterministic math delivers the verdict. The user sees their Sanggup Score, hidden costs, total cost of ownership, opportunity cost, and a smart alternative — all in a premium, Apple-esque dark interface.

**Differentiator:** The honesty. We show what you'd lose by buying, what you'd gain by investing instead, and what a smarter choice looks like. No upsell. No "you deserve it." Just math.

**Vibe:** Apple premium. Liquid glass surfaces (subtle, not glassmorphism). Dark mode zinc-950. Vercel/Linear aesthetic. No "AI slop" — no robotic fonts, no fake terminal UI, no blinking cursors, no gratuitous animations. Every pixel deliberate.

**Context:** Genesis AI Lab mini project (Raymond Chin). Goal: solve a real problem with AI applied responsibly. Must be ready-to-use, relevant to many people, and visually outstanding.

## 2. Core Architecture — Single-Call Data Engine

Minimizes AI cost and loading states through a single API call flow:

1. **Input:** User types a scenario in the Command Capsule (Dashboard).
2. **AI Extraction (1 call):** A single API call (Gemini or mock) parses the text and returns a `Master JSON` — raw extracted financial variables only. AI does NOT calculate anything.
3. **Enrichment:** Pure JavaScript deterministic functions enrich the Master JSON with all calculated metrics (installment, DTI, TCO, opportunity cost, depreciation curves, Sanggup Score).
4. **State:** The enriched scenario is saved to a Zustand store (current scenario) + localStorage (history).
5. **Deterministic Render:** All views (Analyze, Projections) read from the global store. ZERO further AI calls when navigating between tabs.

## 3. Feature Priority

### MUST HAVE (core value — ship these)
| Feature | Why It Matters |
|---|---|
| Command Capsule (NL input → JSON) | The core "wow" — type a sentence, get analysis |
| Multi-factor Sanggup Score (0-100) | Headline number. Brutally honest verdict. |
| DTI Metrics with threshold bars | Core financial health indicator |
| Total Cost of Ownership (TCO) | Shows the REAL cost, not just sticker price |
| Opportunity Cost ("What If") | Most persuasive number — "you'd have $X if you invested" |
| Hidden Costs List | AI-extracted costs most people forget (insurance, tax, maintenance) |
| Projections Chart (10-year) | Depreciation vs investment growth — visual impact |
| Scenario History (localStorage) | Retention hook — save and review past decisions |
| Financial Profile | Baseline context for accurate, responsible scoring |
| Premium dark UI (liquid glass) | Stands out from other participants |

### NICE TO HAVE (if time permits)
| Feature | Why |
|---|---|
| Side-by-side comparison | "Tesla vs Honda" — very practical, very visual |
| Smart Alternative | AI-generated one-sentence better option |
| Stress Test toggles | "What if interest +2%?" — shows depth |
| Educational tooltips | Micro-lessons — "positive impact" goal |
| Gemini real API integration | Makes the demo feel real |

### CUT (scope creep — do NOT build)
| Feature | Why Cut |
|---|---|
| ~~Wallet view~~ | Placeholder UI with no core value. Dead weight. |
| ~~Investments view~~ | "Recommend safe-haven assets" + "Not Financial Advice" = contradictory filler. Smart Alternative replaces it. |
| ~~Monte Carlo simulation~~ | Simplified to deterministic 10-year projection. Full Monte Carlo is overkill for 5-day solo. |
| ~~User auth/accounts~~ | localStorage persistence is enough for MVP. No backend needed. |
| ~~Banking integration~~ | Not feasible in 5 days. Non-goal. |
| ~~Mobile native app~~ | Responsive web is enough. |

## 4. View Specifications

### Dashboard (`/`)
- **Dynamic Island Navbar:** Pill-shaped navbar that morphs based on context (shows "Analyzing..." during AI call, shows score badge after results).
- **Command Capsule:** Large glass-textured input field. Placeholder shows example prompts. Submit triggers AI extraction → enrichment → navigate to Analyze.
- **Recent Scenarios:** Cards showing last 3 analyzed scenarios from localStorage. Click to re-open full analysis.
- **Empty State:** If no history, show 3 example prompt buttons ("Can I afford a $40k Tesla?") that fill the capsule on click.
- **Profile Widget:** Small card in corner showing profile completeness. If incomplete, "Complete profile for accurate scoring" link.

### Analyze (`/analyze`)
The primary verdict page. All data from Zustand store.

- **Sanggup Score Gauge:** Circular gradient gauge (0-100). Green (80-100), amber (50-79), red (0-49). Number large in center. If no profile: "Preliminary Score" badge.
- **Score Breakdown:** 4 mini progress bars showing each component (DTI 35%, Emergency Fund 25%, Down Payment 20%, Savings Rate 20%).
- **DTI Bar:** Horizontal bar showing DTI ratio with threshold markers (30%, 45%).
- **TCO Breakdown:** Stacked list — Base Price, Total Installments, Annual Taxes, Maintenance → Grand Total.
- **Hidden Costs:** Cards listing each AI-extracted hidden cost with type badge (mandatory/upfront/optional).
- **Opportunity Cost Widget:** Large number — "If you invested this instead: $X in 10 years." Sub-text: "That's Y× your purchase price."
- **Smart Alternative:** (NICE TO HAVE) AI-generated one-sentence suggestion for a smarter choice.
- **Educational Tooltips:** (NICE TO HAVE) Info icons next to each metric with 1-2 sentence explanations.

### Projections (`/projections`)
- **10-Year Area Chart:** Two overlapping areas — Asset Depreciation (declining) vs Investment Growth (rising). X-axis: years 0-10. Y-axis: dollar value.
- **Intersection Point:** Marker where investment growth surpasses asset value (the "crossover" moment).
- **Stress Test Toggles:** (NICE TO HAVE) Toggle buttons that recalculate with stressed values: "Interest +2%", "Income -10%", "Tenor +12 months".
- **Timeline Slider:** Drag to see values at a specific year.

### History (`/history`)
- **Scenario List:** Cards showing each saved scenario — item name, category, score badge, date, key metrics.
- **Delete:** Trash icon on each card (removes from localStorage).
- **Compare Mode:** (NICE TO HAVE) Select 2 scenarios → side-by-side comparison table.
- **Empty State:** "No scenarios yet. Try analyzing your first purchase on the Dashboard."

### Profile (`/profile`)
- **Financial Baseline Form:**
  - Monthly income (number, required)
  - Existing monthly debt obligations (number, default 0)
  - Emergency fund balance (number, default 0)
  - Monthly savings contribution (number, default 0)
  - Number of dependents (number, default 0)
- **Save:** Persists to localStorage. Shows toast "Profile saved — your scores are now more accurate."
- **Impact Notice:** "Your profile makes the Sanggup Score ~40% more accurate."
- This data feeds into the Sanggup Score calculation. Without it, score uses conservative defaults and shows "Preliminary" badge.

## 5. Non-Goals
- We are NOT a budgeting app.
- We are NOT an investment advisor.
- We are NOT a banking integration.
- We are NOT building user accounts/auth.
- We are a **decision tool** — you bring a question, we give you an honest answer.

## 6. Demo Strategy
- Mock-first: the app works 100% without any API key.
- For live demo: swap to Gemini API (if key available + stable). If Gemini fails, fall back to mock seamlessly.
- Prepare 3 demo scenarios: car purchase, gadget purchase, property purchase.
- "Wow" moments: (1) type a sentence → instant analysis, (2) the Opportunity Cost number, (3) the premium UI, (4) the brutally honest red score.

## 7. Tech Stack
- **Framework:** React 19 + Vite
- **Language:** JavaScript (NO TypeScript — see AGENTS.md)
- **Styling:** Tailwind CSS v4
- **State:** Zustand (global store) + localStorage (persistence)
- **Charts:** Recharts
- **Icons:** lucide-react
- **AI:** Gemini API (mock-first, clean swap path)
- **Routing:** react-router-dom v7
- **No backend.** Pure client-side. localStorage for persistence.

---

## Implemented Features (current version)

> This section reflects the app AS BUILT. Where an older section above disagrees, this section wins. Items not yet built are marked **[Planned]**.

### Pages & Routing
- / Dashboard (hero prompt bar, health gauge with real-vs-simulation mode, baseline sliders, 3-line growth projection, recent analyses)
- /analyze hub + /analyze/:sessionId session workspace; /profile; legal pages /privacy, /terms, /contact
- SPA refresh fix via ercel.json (API-safe rewrite); scroll-to-top on every route change

### AI Extraction
- Gemini via serverless proxy (pi/gemini.js): key server-side only, rate-limited (10 req/min/IP), mock fallback with visible "Demo mode" banner
- Lenient parsing: missing price falls back to an internal vehicle/tech price DB then a marked estimate; missing income falls back to the profile baseline; requests are never rejected for missing fields
- Gemini returns lternatives (cheaper options + reasons) used by the Recommendations card

### Calculation Engine (src/utils/calculations.js — deterministic, no AI math)
- creditCalc: flat-rate installments (Indonesian store-credit style), breakdown DP/principal/interest/tax/insurance/service; TCO never double-counts the base price
- Sanggup Score (DTI 35% / emergency 25% / DP health 20% / savings 20%); DTI guarded — empty income renders "—", never a false "Safe"
- Opportunity cost on a fixed 10-year horizon; front-loaded depreciation curves; 
ormalizeInterestRate (fraction/rupiah garbage → sane %)

### Analyze Session
- Two-layer model: static session data + derived values recomputed live from the CURRENT profile ("Recalculated with latest profile" badge)
- Live sliders (DP 0–70%, tenor 0=cash/6–72, flat interest 0–30%/yr, income) + reset-to-initial; everything downstream recomputes (TCO, DTI, chart, recommendations)
- Recalculate button: persists latest profile income into the session, keeps session-specific fields; no-profile fallback message
- Hidden-costs vertical card (wrap-safe), opportunity-cost explainer with hypothetical disclaimer, recommendations with ≤18-month postpone threshold and risk-profile investment suggestions

### Health Score
- One shared computeHealthScore(profile, sessions, opts) for navbar pill, dashboard gauge (simulation mode labeled), and analyze page
- Collapsible breakdown with real component weights + prioritized improvement steps with formula-derived point estimates

### Profile
- Sections: income/expenses/savings, obligations, reserves (+ stocks & crypto with IHSG/top-100 growth modeling), risk profile
- Thousand-grouped inputs; completeness meter; live synthesis (FCF, runway, DTI, portfolio growth)

### UI/UX
- ID/EN i18n (all strings in locale files); language decoupled from currency; display-only USD toggle (USD_RATE=16000) via burger dropdown (click-outside + Escape, aria)
- Typewriter prompt suggestions: pause on focus/typing, resume same phase <0.5s after blur; suggestion chips fade out while typing; no "cth/e.g." prefixes
- Liquid-glass navbar with live health score; premium dark footer (link grid, social icons, dynamic copyright); legal pages; scroll reset on navigation

### **[Planned]** (not yet implemented)
- USD as a true input currency (currently display-only)
- Export data / settings page (buttons exist as placeholders)
- Backend accounts & sync (intentionally none — local-first)
