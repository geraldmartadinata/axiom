# AGENTS.md — Axiom Coder Agent Rules

> This file is read by AI coding agents (Hermes, OpenCode, Claude Code, Cursor) when working in this repo. It defines hard rules, guardrails, and anti-hallucination constraints. Follow these exactly. Do NOT deviate.

---

## Project Overview

**Axiom** is a financial decision companion web app. Users type a natural-language scenario, AI extracts the numbers, deterministic JavaScript math delivers a brutally honest verdict (Sanggup Score 0-100, TCO, Opportunity Cost, Projections).

**Competition:** Genesis AI Lab mini project (Raymond Chin). Deadline: August 24, 2026.

**Read these files before writing any code:**
1. `prd.md` — product requirements, feature priority, scope
2. `business-logic.md` — all math formulas (copy verbatim, do NOT modify)
3. `data-schema.md` — data shapes, store structure, validation
4. `design-system.md` — exact colors, typography, CSS, prohibited patterns
5. `component-tree.md` — file structure, every component, props, routing
6. `api-contract.md` — extraction layer, mock data, Gemini swap
7. `build-order.md` — day-by-day execution plan

**After reading, summarize your understanding in 2-3 sentences before writing code. Do NOT write code until confirmed.**

---

## Hard Rules

### 1. JavaScript ONLY — NO TypeScript
**Reason:** User decision to avoid TypeScript due to supply chain security concerns.
- All files use `.jsx` and `.js` extensions
- NO `.tsx` or `.ts` files
- Use JSDoc comments for type documentation
- Use runtime validation instead of compile-time types
- Do NOT install `typescript`, `@types/*`, or any TS-related packages

### 2. NO AI for Math
**Reason:** LLMs hallucinate numbers. Axiom's credibility depends on deterministic math.
- ALL calculations are in `src/utils/calculations.js`
- Copy the functions VERBATIM from `business-logic.md`
- Do NOT modify, optimize, refactor, or "improve" any formula
- Do NOT use `eval()`, `Function()`, or any dynamic code execution
- Do NOT use AI/LLM calls for any calculation, score, or projection
- The ONLY use of AI is extracting variables from natural language → JSON (see `api-contract.md`)

### 3. Mock-First Architecture
- `USE_MOCK = true` is the DEFAULT in `src/services/extraction.js`
- The app MUST work 100% without any API key
- Gemini is a swap-at-the-end option, NOT a dependency
- Do NOT add API calls anywhere except `src/services/extraction.js`
- If Gemini fails, the code falls back to mock silently

### 4. Exact File Structure
- Follow `component-tree.md` exactly
- Do NOT create files not listed there
- Do NOT rename files
- Do NOT add "utility" or "helper" files unless explicitly listed
- Do NOT create separate `hooks/`, `context/`, or `lib/` directories
- The only directories: `src/{store,utils,services,mocks,components/{layout,ui,capsule,score,charts,cards,forms},pages}`

### 5. Exact Design Tokens
- Use colors from `design-system.md` ONLY
- Do NOT invent new colors, gradients, or shadows
- Do NOT add "AI-themed" visuals (neon, matrix, terminal aesthetic)
- Do NOT use any font other than Inter
- If a design decision isn't in `design-system.md`, ask — don't guess

### 6. Exact Dependencies
Install ONLY these packages. Do NOT add others without explicit approval:
```
react (via vite template)
react-dom (via vite template)
react-router-dom
zustand
recharts
lucide-react
clsx
tailwind-merge
tailwindcss (dev)
@tailwindcss/vite (dev)
```
- Do NOT install: `framer-motion`, `@emotion/*`, `styled-components`, `axios`, `swr`, `react-query`, `moment`, `dayjs`, `lodash`, `underscore`, or any UI kit (MUI, Chakra, Ant, etc.)
- Tailwind v4 handles all styling. No CSS-in-JS.

### 7. No Backend
- This is a pure client-side app
- NO server, NO API server, NO database
- Persistence: `localStorage` only (keys: `axiom_profile`, `axiom_history`)
- Do NOT create any server-side files, routes, or middleware

### 8. No Authentication
- NO login, NO auth, NO user accounts
- Do NOT install auth libraries (NextAuth, Clerk, Firebase Auth, etc.)
- The app is single-user, local-first

---

## Anti-Hallucination Guardrails

### Rule A: Do NOT invent data
- Use the mock data from `api-contract.md` exactly as written
- Do NOT generate "sample" or "example" data that isn't in the mock files
- Do NOT hardcode test data in components — pull from the store

### Rule B: Do NOT invent components
- Every component is listed in `component-tree.md` with its props
- Do NOT create additional components "for reusability" or "for cleanliness"
- Do NOT add wrapper components, HOCs, or render-props patterns
- If a component file doesn't exist in the tree, don't create it

### Rule C: Do NOT invent formulas
- Every formula is in `business-logic.md` with exact code
- Do NOT create your own scoring algorithm
- Do NOT add "extra" metrics not defined in the docs
- Do NOT round differently than specified

### Rule D: Do NOT invent design
- Every color, spacing, radius, and animation is in `design-system.md`
- Do NOT pick colors that "look good" — use the defined tokens
- Do NOT add effects not listed (no neon, no glow, no gradient text)
- When in doubt, use `zinc-*` defaults

### Rule E: Do NOT invent features
- If a feature is in the "CUT" section of `prd.md`, do NOT build it
- If a feature is in the "NICE TO HAVE" section, only build it if `build-order.md` says to
- Do NOT add features the user didn't ask for
- Do NOT add "dark mode toggle" — the app is dark-only
- Do NOT add "internationalization" — the app is English-only
- Do NOT add "analytics" or "tracking"
- Do NOT add "PWA" or "service workers"

### Rule F: Verify before claiming
- After each task, run `npm run build` and check for errors
- Do NOT claim a task is "complete" without a successful build
- Do NOT claim "it works" without testing it in the browser
- If you can't verify something, say so honestly — don't fabricate success

---

## Execution Policies (Anti-Loop Guardrails)

### Iteration Limit — MAX 3 ATTEMPTS
- Each task gets MAX 3 attempts. If you fail after 3: STOP, report the error, wait for human guidance.
- Do NOT retry the same approach twice. If attempt 1 fails, change approach for attempt 2.
- After 3 failed `npm run build` attempts: report the EXACT error (first 5 lines), what you tried, and STOP.
- Do NOT loop. Report and wait.

### Timebox — 15 MINUTES PER TASK
- Each task has a 15-minute timebox. If exceeded: STOP and report.
- If you're "researching" or "exploring": STOP. The code is provided. Copy it.
- If a dependency or import is confusing: check the file. Don't guess.

### Scope Lock — ONE TASK ONLY
- Work on ONE task only. Do NOT fix bugs in other files.
- If you notice an issue in a file you're not working on: NOTE it, continue your task.
- Do NOT "improve", "refactor", or "optimize" code you're not asked to touch.
- Do NOT add imports, dependencies, or code not specified.
- If a bug in another file blocks your task: report and STOP. Do NOT fix it yourself.

### Self-Repair Prohibition
- Do NOT fix errors you didn't create.
- Pre-existing error: report it, do NOT fix it.
- YOUR code has an error: fix YOUR code only (within 3-attempt limit).
- Do NOT modify other files to "work around" an error.

### Report Format (After Each Task)
1. **Status:** DONE | FAILED | BLOCKED
2. **Files:** Created/modified which files
3. **Build:** `npm run build` result (PASS/FAIL + first error line if FAIL)
4. **Issues:** Problems in other files (NOTED, NOT fixed)
5. **Ready:** Confirm ready for next task or need human help

---

## Coding Conventions

### File Naming
- Components: `PascalCase.jsx` (e.g., `ScoreGauge.jsx`, `CommandCapsule.jsx`)
- Utils/Services: `camelCase.js` (e.g., `calculations.js`, `extraction.js`)
- Store: `useAxiomStore.js` (Zustand convention)
- Mocks: `kebab-case.json` (e.g., `mock-car.json`)

### Import Order
1. React / React Router imports
2. Third-party (zustand, recharts, lucide-react)
3. Internal absolute (store, services)
4. Internal relative (components, utils)
5. CSS/JSON imports

### Component Structure
```jsx
// 1. Imports
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAxiomStore } from '../../store/useAxiomStore';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/format';

// 2. Component
function ComponentName({ prop1, prop2 }) {
  // hooks first
  const navigate = useNavigate();
  const [localState, setLocalState] = useState(null);

  // derived values
  const derivedValue = prop1 * 0.35;

  // handlers
  const handleClick = () => { ... };

  // render
  return (
    <div className="...">
      {/* content */}
    </div>
  );
}

// 3. Export
export default ComponentName;
```

### Tailwind Class Order
Follow this order for readability:
1. Layout: `flex`, `grid`, `relative`, `absolute`
2. Spacing: `p-*`, `m-*`, `gap-*`
3. Sizing: `w-*`, `h-*`, `max-w-*`
4. Colors: `bg-*`, `text-*`, `border-*`
5. Effects: `backdrop-blur-*`, `rounded-*`, `border`
6. States: `hover:*`, `focus:*`
7. Transitions: `transition-*`

### Comments
- JSDoc on all exported functions
- No inline comments for obvious code
- Comment only "why", not "what"
- No commented-out code

---

## Git Workflow

```bash
# Branch per day (or per feature)
git checkout -b day1-foundation
git add .
git commit -m "day1: scaffold, design system, core utils, layout shell"

# After verification:
git checkout main
git merge day1-foundation
```

Commit message format: `dayN: <short description>`

---

## Quality Checklist (Before Claiming Done)

- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run dev` runs without console errors
- [ ] All files from `component-tree.md` exist
- [ ] All formulas from `business-logic.md` are copied verbatim
- [ ] All colors from `design-system.md` are used (no invented colors)
- [ ] All mock data from `api-contract.md` is used exactly
- [ ] `USE_MOCK = true` is the default
- [ ] No TypeScript files exist
- [ ] No unauthorized packages installed
- [ ] No backend/auth code exists
- [ ] Responsive at 375px, 768px, 1280px
- [ ] No emoji in the UI
- [ ] No console.log in production code (use comments or remove)

---

## If Stuck

1. **Formula question:** Read `business-logic.md` again. The exact code is there.
2. **Design question:** Read `design-system.md`. The exact values are there.
3. **Component question:** Read `component-tree.md`. The exact props and behavior are there.
4. **API question:** Read `api-contract.md`. The exact contract is there.
5. **"What should I build next?"** Read `build-order.md`. The exact task order is there.
6. **Still stuck:** Ask the user. Do NOT guess. Do NOT invent. A wrong answer honestly stated is better than a confident fabrication.
