# Execution Guide — Axiom

> For the coder agent. Read AGENTS.md first (rules, iteration limit, timebox, scope-lock).
> **STATUS: The app is FULLY BUILT and VERIFIED.** Your job is verification, polish, and deployment — NOT writing code.

## Current State (verified 2026-08-20)

- ✅ All 41 source files written (JSX/JS/JSON — no TypeScript)
- ✅ `npm install` completed (125 packages)
- ✅ `npm run build` PASSES (zero errors)
- ✅ `npm run dev` runs at http://localhost:5173
- ✅ Full flow tested in browser: Dashboard → Analyze → Projections → History → Profile
- ✅ Mock-first extraction works (no API key needed)

## Your Tasks (in order)

### Task 1: Verify the app runs
```bash
cd D:\project\webdev\axiom
npm run dev
```
Open http://localhost:5173 in a browser. Verify:
1. Dark premium UI renders (zinc-950 background, pill navbar)
2. Type the Tesla example → click Analyze → score gauge appears (~46, Preliminary badge)
3. Click Projections → chart renders with crossover line
4. Click History → scenario is listed
5. Click Profile → form with 5 fields
6. Reload page → recent scenario still in History (localStorage works)

**Report:** Status DONE/FAILED + build result + issues found (NOTED, not fixed).

### Task 2: Responsive check (15 min timebox)
Test at 375px, 768px, 1280px widths. Fix ONLY layout breaks in files listed below.
Allowed fixes:
- `src/index.css` (grid breakpoints)
- `src/pages/*.jsx` (layout classes)
- `src/components/layout/DynamicIsland.jsx` (nav on mobile)
Do NOT touch: calculations, store, extraction service, mock data.

### Task 3: Deploy to Vercel
```bash
cd D:\project\webdev\axiom
npm run build
npx vercel --prod
```
Follow the CLI prompts (login if needed). Report the deployed URL.
If Vercel fails (no account), report and ask — do NOT try Netlify/other platforms without approval.

### Task 4: (OPTIONAL — only if user provides a key) Gemini swap
1. Create `.env` in project root: `VITE_GEMINI_API_KEY=your_key_here`
2. In `src/services/extraction.js`, change `const USE_MOCK = true` → `false`
3. Test with the Tesla prompt. Verify JSON parses correctly.
4. If it fails: revert USE_MOCK to true. Report what happened.

---

## Do NOT Do

- Do NOT write new features (everything is specified in prd.md — all MUST HAVE are done)
- Do NOT add dependencies
- Do NOT change formulas in `src/utils/calculations.js`
- Do NOT restructure files (component-tree.md is the source of truth)
- Do NOT run `npm create vite` (project already scaffolded)
- Do NOT modify AGENTS.md or the *.md planning docs
- Do NOT fix pre-existing issues outside your current task (scope-lock)

## Iteration Policy Reminder

- MAX 3 attempts per task → then STOP + report
- 15 min timebox per task
- Report format: Status / Files / Build result / Issues / Ready
