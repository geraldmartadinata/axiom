# Axiom

**Can you afford it?** — The brutally honest financial decision companion.

Type a purchase (car, house, gadget). Axiom tells you the truth: total cost of ownership, hidden fees, DTI impact, opportunity cost, and a 0–100 Health Score — with interactive parameters to find your real ceiling before you commit.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 6 + React 19 |
| Styling | Tailwind CSS v4 (utility-first) |
| Routing | React Router v7 |
| State | Zustand + localStorage persistence |
| Charts | Recharts |
| i18n | Custom LanguageContext (EN/ID) |
| Motion (planned) | Framer Motion |

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Repo Layout

```
├── prd.md               # Product requirements
├── business-logic.md    # Scoring engine spec (FROZEN — source of truth)
├── data-schema.md       # Data shapes
├── design-system.md     # Design tokens
├── api-contract.md      # Mock→real API swap contract
├── component-tree.md    # Component inventory
├── build-order.md       # Build sequence
├── execution-guide.md   # For coder agents
├── AGENTS.md            # Execution policies
├── docs/                # How-to guides (see below)
├── v0-prototype.html    # Standalone design prototype (no build needed)
└── src/
    ├── utils/calculations.js   # FROZEN scoring engine
    ├── store/useAxiomStore.js  # Zustand store
    ├── store/LanguageContext.jsx
    ├── services/extraction.js  # NL prompt → scenario parser
    ├── mocks/                   # Mock scenarios
    ├── locales/                 # en.json / id.json
    ├── components/              # ui/, layout/, cards/, score/, charts/, forms/, capsule/
    └── pages/                   # Dashboard, Analyze, Projections, History, Profile
```

## Docs

- [How to Build: Architecture & Methodology](docs/ARCHITECTURE.md)
- [Liquid Glass Navbar](docs/NAVBAR.md)
- [Analyze Page](docs/ANALYZE.md)
- [History & Session Scheme](docs/HISTORY-SCHEME.md)

## Roadmap (current)

1. Port v0 prototype visuals into React (gauge, neon input, sliders, charts)
2. Merge History → Analyze with per-session routes (`/analyze/:sessionId`)
3. Overall Health Score based on confirmed purchases
4. RAG service for real product data (OJK/BI/BPS + spec sources)
5. Deploy to Vercel
