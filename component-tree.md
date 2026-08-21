# Component Tree — Axiom

> Every component, its props, its file path, and its behavior. Follow this exactly. Do NOT create components not listed here. Do NOT rename files. Do NOT add wrapper components "for reusability" unless explicitly specified.

## File Structure

```
src/
├── main.jsx                     # React entry (renders <App/>)
├── App.jsx                      # Router + layout shell
├── index.css                    # Tailwind import + global styles
├── store/
│   └── useAxiomStore.js          # Zustand store
├── utils/
│   ├── cn.js                    # Class name merge utility
│   ├── calculations.js          # ALL business logic (copy from business-logic.md)
│   └── format.js                # formatCurrency, formatNumber, formatDate
├── services/
│   └── extraction.js            # AI extraction (mock + Gemini swap)
├── mocks/
│   ├── mock-car.json
│   ├── mock-gadget.json
│   ├── mock-property.json
│   └── mock-bad.json
├── components/
│   ├── layout/
│   │   ├── DynamicIsland.jsx   # Morphing navbar
│   │   ├── Background.jsx       # Ambient glow background
│   │   └── Layout.jsx           # Page wrapper (navbar + outlet + bg)
│   ├── ui/
│   │   ├── Button.jsx           # variant: primary|secondary|ghost|danger
│   │   ├── Card.jsx             # Liquid glass card wrapper
│   │   ├── Badge.jsx            # status: safe|warning|danger|neutral
│   │   ├── Input.jsx            # Glass input with label + error
│   │   ├── InfoTooltip.jsx      # Info icon + tooltip (NICE TO HAVE)
│   │   └── Spinner.jsx          # Minimal loading dots
│   ├── capsule/
│   │   └── CommandCapsule.jsx   # Main input on Dashboard
│   ├── score/
│   │   ├── ScoreGauge.jsx       # Circular SVG gauge
│   │   └── ScoreBreakdown.jsx   # 4 component mini-bars
│   ├── charts/
│   │   └── ProjectionChart.jsx  # Recharts area chart (depreciation vs investment)
│   ├── cards/
│   │   ├── DTICard.jsx          # DTI bar + status
│   │   ├── TCOCard.jsx          # Total cost of ownership breakdown
│   │   ├── HiddenCostsCard.jsx  # List of hidden costs
│   │   ├── OpportunityCostCard.jsx  # "What if you invested" widget
│   │   └── ScenarioCard.jsx     # Compact scenario card for history
│   └── forms/
│       └── ProfileForm.jsx      # Financial profile input form
└── pages/
    ├── Dashboard.jsx            # /
    ├── Analyze.jsx              # /analyze
    ├── Projections.jsx          # /projections
    ├── History.jsx              # /history
    └── Profile.jsx             # /profile
```

## Routing

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analyze" element={<Analyze />} />
      <Route path="/projections" element={<Projections />} />
      <Route path="/history" element={<History />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
  </Routes>
</BrowserRouter>
```

If `currentScenario` is null and user navigates to `/analyze` or `/projections`, redirect to `/`.

---

## Component Specs

### Layout Components

#### `Layout.jsx`
```jsx
// Wraps all pages. Renders Background + DynamicIsland + page content.
// Props: none (uses <Outlet/> from react-router)
function Layout() {
  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <DynamicIsland />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### `Background.jsx`
```jsx
// Fixed ambient glow. No props. Pure decorative.
function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-200px] left-[10%] w-[600px] h-[400px] bg-white/[2%] rounded-full blur-[120px]" />
      <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-white/[1.5%] rounded-full blur-[100px]" />
      <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] bg-white/[1%] rounded-full blur-[80px]" />
    </div>
  );
}
```

#### `DynamicIsland.jsx`
```jsx
// Pill-shaped navbar. Morphs based on app state.
// Reads from store: isAnalyzing, currentScenario (for score badge)
// Links: Dashboard (/), Analyze (/analyze), Projections (/projections), History (/history), Profile (/profile)
// States:
//   - Default: brand "Axiom" + nav links
//   - Analyzing: shows "Analyzing..." with pulse animation
//   - Has result: shows score badge (colored by status) next to brand
function DynamicIsland() {
  // Use useAxiomStore for isAnalyzing + currentScenario
  // Use useLocation for active link styling
  // Render as sticky top-4, centered, pill-shaped (rounded-full)
  // Glass background: bg-zinc-900/80 backdrop-blur-2xl border border-white/[6%]
}
```

### UI Components

#### `Button.jsx`
```jsx
// Props:
//   variant: 'primary' | 'secondary' | 'ghost' | 'danger'  (default: 'primary')
//   size: 'sm' | 'md' | 'lg'  (default: 'md')
//   loading: boolean  (shows spinner, disables click)
//   disabled: boolean
//   children: ReactNode
//   onClick: function
//   className: string (optional override)
//   type: 'button' | 'submit'  (default: 'button')
```

#### `Card.jsx`
```jsx
// Props:
//   children: ReactNode
//   className: string (optional, merged with base glass styles)
//   onClick: function (optional, adds hover + cursor-pointer if provided)
// Base class: "bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl p-6"
// If onClick: add "hover:border-white/[12%] transition-all cursor-pointer"
```

#### `Badge.jsx`
```jsx
// Props:
//   status: 'safe' | 'warning' | 'danger' | 'neutral'  (default: 'neutral')
//   children: ReactNode (usually text or icon+text)
// Renders pill with color based on status (see design-system.md)
```

#### `Input.jsx`
```jsx
// Props:
//   label: string (optional)
//   error: string (optional, shows red text below input)
//   type: 'text' | 'number'  (default: 'text')
//   value: string|number
//   onChange: function
//   placeholder: string
//   icon: ReactNode (optional, rendered inside left of input)
// Base class: "w-full bg-zinc-950/60 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
// Border color: red-500/30 if error, white/[6%] default, white/[15%] on focus
```

#### `Spinner.jsx`
```jsx
// Minimal loading indicator. Three dots that pulse.
// Props: size (default: 'md')
// Uses animate-pulse-glow from design-system.md
function Spinner() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse-glow" />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse-glow" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
```

### Feature Components

#### `CommandCapsule.jsx`
```jsx
// The main input on the Dashboard. Large glass-textured textarea + submit button.
// Props: none (reads/writes via store)
// State: local text state for the input
// Behavior:
//   1. User types scenario text
//   2. On submit (Enter or button click), calls store.analyzePrompt(text)
//   3. Shows loading state (button disabled, spinner)
//   4. On success: navigate to /analyze
//   5. On error: show error text below input
// Placeholder: "Can I afford a $40k Tesla with $5k down over 60 months, earning $8k/month?"
// Also renders 3 example prompt buttons below when input is empty.
```

#### `ScoreGauge.jsx`
```jsx
// Circular SVG gauge showing the Sanggup Score (0-100).
// Props:
//   score: number (0-100)
//   size: number (default: 200)
//   strokeWidth: number (default: 12)
//   isPreliminary: boolean (shows "Preliminary" text below score)
// Color: emerald-400 if score >= 80, amber-400 if >= 50, red-400 if < 50
// Renders SVG with background ring + progress ring + score number in center
// Animation: progress ring animates from 0 to score on mount (1s ease-out)
```

#### `ScoreBreakdown.jsx`
```jsx
// Shows the 4 components of the Sanggup Score as mini progress bars.
// Props:
//   components: Object (from enrichment.sanggup_score.components)
//   isPreliminary: boolean
// Renders 4 horizontal bars:
//   1. DTI (35% weight) — shows raw DTI % and sub-score
//   2. Emergency Fund (25%) — shows months covered and sub-score
//   3. Down Payment (20%) — shows DP ratio and sub-score
//   4. Savings Rate (20%) — shows savings % and sub-score
// Each bar colored by sub-score (emerald/amber/red)
```

#### `ProjectionChart.jsx`
```jsx
// Recharts area chart showing 10-year depreciation vs investment growth.
// Props:
//   depreciationCurve: Array<{year, value}>
//   investmentCurve: Array<{year, value}>
//   crossoverYear: number|null
// Uses Recharts AreaChart with two Area components:
//   - Depreciation: red-500/20 fill, red-400 stroke
//   - Investment: emerald-500/20 fill, emerald-400 stroke
// X-axis: year (0-10)
// Y-axis: dollar value (formatted with $ and K/M suffixes)
// Tooltip: shows year + both values
// If crossoverYear is not null: render a vertical reference line at that year
//   with label "Crossover: Year X" — "Your investment surpasses the asset value"
// Chart height: 400px on desktop, 300px on mobile
// Background: transparent, grid lines: white/[4%]
```

#### `DTICard.jsx`
```jsx
// Props:
//   dti: number (percentage)
//   status: 'SAFE' | 'WARNING' | 'DANGER' | 'NO_INCOME'
//   newInstallment: number
//   existingDebt: number
//   income: number
// Renders:
//   - Card title: "Debt-to-Income Ratio"
//   - Large DTI percentage number (colored by status)
//   - Horizontal bar with 3 zones (green < 30%, amber 30-45%, red > 45%)
//   - Marker showing current DTI position on the bar
//   - Breakdown: "New Payment: $X | Existing Debt: $Y | Income: $Z"
```

#### `TCOCard.jsx`
```jsx
// Props:
//   breakdown: Object (from enrichment.tco.breakdown)
//   total: number
// Renders:
//   - Card title: "Total Cost of Ownership"
//   - Stacked list: Base Price, Down Payment, Total Installments, Taxes, Maintenance, Other
//   - Grand total in large text (different color — this is the "real cost")
//   - Sub-text: "That's X× the sticker price" (calculate total/basePrice)
```

#### `HiddenCostsCard.jsx`
```jsx
// Props:
//   hiddenCosts: Array<{name, amount_per_year?, amount_upfront?, type}>
//   tenorMonths: number (to calculate per-year → total)
// Renders:
//   - Card title: "Hidden Costs"
//   - Each cost as a row: name | amount | type badge
//   - Amount formatted: "$850/yr → $4,250 total" or "$500 upfront"
//   - Type badge colored: mandatory=amber, upfront=blue, optional=zinc, tax=red, maintenance=purple
//   If no hidden costs: "No hidden costs detected."
```

#### `OpportunityCostCard.jsx`
```jsx
// Props:
//   opportunity: Object (from enrichment.opportunity_cost)
//   purchasePrice: number (DP + total installments, for comparison)
// Renders:
//   - Card title: "What If You Invested Instead?"
//   - Large number: opportunity.total (formatted as currency)
//   - Sub-text: "That's {multiple}× what you'd spend on the purchase"
//   - Breakdown: "Down Payment grown: $X | Monthly invested: $Y"
//   - "Assumes 8% annual return (S&P 500 historical average)"
//   - Small disclaimer: "Past performance ≠ future results"
// This is the most persuasive card. Make the number BIG.
```

#### `ScenarioCard.jsx`
```jsx
// Props:
//   scenario: Object (Enriched Scenario)
//   onClick: function (open scenario in /analyze)
//   onDelete: function (remove from history)
//   compact: boolean (default: false, hides some details)
// Renders:
//   - Item name + category badge
//   - Score badge (colored)
//   - Date
//   - Key metrics: base price, monthly installment, DTI
//   - Delete button (trash icon, top-right, only shows on hover)
```

#### `ProfileForm.jsx`
```jsx
// Props: none (reads/writes via store)
// Fields: monthly_income, existing_monthly_debt, emergency_fund, monthly_savings, dependents
// Each field: Input component with number type
// Save button calls store.saveProfile(data)
// Shows toast on save: "Profile saved — your scores are now more accurate."
// Pre-fills from store.profile if exists.
```

---

## Page Specs

### `Dashboard.jsx`
```jsx
// Route: /
// Reads: store.history (for recent scenarios), store.profile
// Contains:
//   1. Hero section: "Can you afford it?" headline + sub-text
//   2. CommandCapsule (main input)
//   3. Recent Scenarios: grid of ScenarioCard (max 3, from history)
//      OR empty state with 3 example prompt buttons if no history
//   4. Profile widget: small card showing profile completeness
// If store.isAnalyzing: show full-screen loading overlay (blur background)
```

### `Analyze.jsx`
```jsx
// Route: /analyze
// Guard: if !store.currentScenario, redirect to /
// Reads: store.currentScenario
// Layout: 2-column grid on desktop
//   Left column (wider):
//     1. ScoreGauge (centered)
//     2. ScoreBreakdown
//     3. DTICard
//   Right column:
//     4. OpportunityCostCard (at top — most impactful)
//     5. TCOCard
//     6. HiddenCostsCard
// Each card has animate-slide-up with stagger-N
```

### `Projections.jsx`
```jsx
// Route: /projections
// Guard: if !store.currentScenario, redirect to /
// Reads: store.currentScenario.enrichment (depreciation_curve, investment_curve, crossover_year)
// Contains:
//   1. Page title: "10-Year Projection"
//   2. ProjectionChart (full width)
//   3. Summary stats below chart:
//      - "Asset value in 10 years: $X"
//      - "Investment value in 10 years: $Y"
//      - "Difference: $Z" (green if positive)
//   4. (NICE TO HAVE) Stress Test toggles
//   5. (NICE TO HAVE) Timeline slider
```

### `History.jsx`
```jsx
// Route: /history
// Reads: store.history
// Contains:
//   1. Page title: "Scenario History"
//   2. If empty: empty state illustration + "Analyze your first purchase" CTA → /
//   3. If not empty: grid of ScenarioCard
//   4. Each card clickable → loads scenario into store + navigates to /analyze
//   5. Delete button on each card
//   6. (NICE TO HAVE) Compare mode: checkbox on cards, "Compare 2" button
```

### `Profile.jsx`
```jsx
// Route: /profile
// Contains:
//   1. Page title: "Financial Profile"
//   2. Impact notice card: "Your profile makes the Sanggup Score ~40% more accurate."
//   3. ProfileForm
//   4. "Why we need this" explainer: brief text on how each field affects the score
```
