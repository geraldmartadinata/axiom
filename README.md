# Axiom

> Make smarter big-ticket purchase decisions with honest, math-driven affordability analysis — built for the Indonesian market (IDR).

**License MIT · React 19 + Vite · Zustand · Recharts · Tailwind v4 · Deployed on Vercel**

Axiom takes a natural-language purchase scenario ("Honda Civic 2025, 5-year loan, my salary is 15 jt/month"), extracts the numbers with Gemini, and runs a deterministic JavaScript calculation engine — no AI math, ever — to deliver a brutally honest verdict: Sanggup Score, total cost of ownership, hidden costs, opportunity cost, and asset projections.

## ✨ Features

- **AI-powered scenario analysis** — type a purchase in plain Indonesian or English; Gemini extracts structured financials via a serverless proxy (the API key never reaches the client). Graceful mock fallback keeps the app usable without a key.
- **Affordability engine** — flat-rate consumer-credit installments (the way HP/paylater and dealer credit actually bill), DTI ratio, multi-factor Sanggup Score (0–100), and a full ownership-cost breakdown (DP + principal + interest + tax/fees + insurance + service — never double-counting the sticker price).
- **Live "what if" parameters** — DP, tenor (0 = cash), flat interest, and income sliders recompute the score, DTI, TCO, chart, and recommendations in real time, with a reset-to-initial control.
- **Financial health score** — single shared util powering the navbar pill, dashboard gauge (with a clearly-labeled simulation mode), and analyze page; collapsible per-component breakdown with real weights plus prioritized, formula-derived improvement steps.
- **"What if you invested instead?"** — 10-year opportunity-cost horizon (down payment + redirected installments at 8%/yr) with a transparent breakdown and an honest hypothetical-scenario disclaimer.
- **Growth projection chart** — three lines: personal assets (savings, emergency fund, stocks at IHSG-average return, crypto at a discounted return), bought assets depreciating per category, and dashed planned purchases.
- **Session management** — history, confirm-purchase flow, and a Recalculate action that refreshes user-side financials from the latest profile while preserving session-specific fields.
- **Profile baseline** — income, expenses, savings, emergency fund, stocks, crypto, dependents, risk profile; thousand-grouped inputs; old sessions transparently recalculate against the latest profile.
- **Recommendations** — postpone-vs-buy guidance with a realistic ≤18-month threshold, cheaper alternatives from Gemini, and contextual emergency-fund/dependents notes.
- **ID/EN UI, IDR-first** — language and currency are decoupled; numbers render in `id-ID`, with an optional display-only USD toggle.
- **Dark theme, responsive, smooth motion** — liquid-glass navbar, page transitions, typewriter prompt suggestions that pause/resume without losing state.

## 🖼️ Screenshots

<!-- TODO: add screenshot — Dashboard -->
<!-- TODO: add screenshot — Analyze session -->
<!-- TODO: add screenshot — Profile -->

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 6 (JavaScript, no TypeScript) |
| Routing | react-router-dom v7 (SPA + Vercel rewrite) |
| State | Zustand (persist → localStorage) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Charts | Recharts + hand-rolled SVG gauges |
| Animation | framer-motion |
| Icons | lucide-react |
| AI | Google Gemini (`generateContent`) via `/api/gemini` Vercel serverless function + inline Vite dev middleware |
| Deployment | Vercel (`vercel.json` SPA rewrite, API-safe) |

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- A Gemini API key (optional — the app falls back to mock scenarios without one)

### Installation

```bash
git clone https://github.com/geraldmartadinata/axiom.git
cd axiom
npm install
cp .env.example .env   # add your GEMINI_API_KEY
npm run dev
```

The dev server includes inline middleware that serves `POST /api/gemini`, so one `npm run dev` gives you the full pipeline — no separate API process.

### Build & Deploy

```bash
npm run build   # outputs to dist/
npm run preview # local preview of the production build
```

Deploy on Vercel: import the repo, set `GEMINI_API_KEY` in Project → Settings → Environment Variables, then redeploy. `vercel.json` rewrites `/api/*` to the serverless function and everything else to `index.html` (SPA refresh support).

## 📁 Project Structure

```
├── api/gemini.js              # Vercel serverless: Gemini proxy (key stays server-side)
├── vercel.json                # SPA + API rewrites
├── src/
│   ├── components/
│   │   ├── capsule/           # Hero prompt input + typewriter suggestions
│   │   ├── cards/             # TCO, DTI, hidden costs, opportunity cost, recommendations
│   │   ├── charts/            # "What if" projection chart
│   │   ├── dashboard/         # Growth projection, health breakdown
│   │   ├── layout/            # Liquid-glass navbar, footer, background
│   │   ├── parameters/        # Live what-if sliders
│   │   ├── score/             # Sanggup score gauge + breakdown
│   │   └── ui/                # Buttons, inputs, modal, page transitions…
│   ├── locales/               # en.json / id.json (all UI strings)
│   ├── mocks/                 # Fallback scenarios (car/gadget/property)
│   ├── pages/                 # Dashboard, Analyze (hub + session), Profile, Legal, Contact
│   ├── services/              # Extraction pipeline (Gemini → validate → enrich)
│   ├── store/                 # Zustand store (history, profile, currency) + language context
│   └── utils/                 # calculations.js (deterministic engine), healthScore, format, depreciation
```

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini key. Read only by `api/gemini.js` — never expose with a `VITE_` prefix. | For real analysis (mock fallback works without) |
| `VITE_USE_MOCK` | Set to `true` to force the mock extraction pipeline (offline dev). | No |

## ⚠️ Disclaimer

Axiom is an educational simulation, not professional financial advice. Results are estimates based on stated assumptions (e.g. 8%/yr investment return, flat-rate credit interest, category depreciation curves). Real returns fluctuate and inflation is not modeled. Every financial decision remains your responsibility — see the in-app [Terms of Service](https://axiom-gen.vercel.app/terms).

## 📄 License

[MIT](./LICENSE) © Gerald Martadinata

## 👤 Author

**Gerald Martadinata**

- GitHub: [geraldmartadinata](https://github.com/geraldmartadinata)
- Instagram: [@gerald404_](https://instagram.com/gerald404_)
