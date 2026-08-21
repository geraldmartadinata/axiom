# Liquid Glass Navbar

The signature UI element. Floating pill, frosted glass, cyan accent. This is
the pattern to reuse across every future page.

## Visual Recipe

| Property | Value |
|---|---|
| Position | `fixed top-4 left-1/2 -translate-x-1/2 z-50` |
| Background | `bg-zinc-900/70` (semi-transparent) |
| Blur | `backdrop-blur-xl saturate-150` — the "liquid" |
| Border | `border border-white/10` |
| Radius | `rounded-2xl` (pill-ish) |
| Height | `h-14` (56px) |
| Shadow | `shadow-2xl shadow-black/40` |

## Why It Works

Liquid glass = **translucency + blur + light border**. The trick is the
saturate:

```css
backdrop-filter: blur(20px) saturate(160%);
```

`saturate` makes colors behind the glass *pop* through it — that's what makes
it feel like liquid, not just "transparent gray". Without it, blurred
backgrounds look muddy.

## Structure

```
<nav>                      ← fixed, floating pill
  <Link brand>             ← logo mark (gradient square) + "Axiom"
  <div links>              ← Dashboard / Analyze / Projections / Profile
    <NavLink active class> ← active = text-cyan-400 + bg-cyan-400/10
  <div right>
    <LangToggle />         ← separate component, top-right (see below)
    <ScoreBadge />         ← overall health score (nav-level)
  </div>
</nav>
```

## Active Link State

```jsx
<NavLink
  to="/analyze"
  className={({ isActive }) =>
    cn(
      'px-4 py-2 rounded-xl text-sm font-medium transition-all',
      isActive
        ? 'text-cyan-400 bg-cyan-400/10'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'
    )
  }
>
```

## LangToggle (separate)

Per feedback: the language button gets its OWN position — top-right of the
page, not inside the nav pill. Add flag indicators:

```jsx
<button className="flex items-center gap-2 ...">
  <img src="/flags/id.svg" className="w-4 h-4 rounded-sm" />  {/* or EN */}
  <span>ID</span>
</button>
```

Flags: simple 4×3 SVG rectangles (`#CE1126` red / `#FFFFFF` white for ID,
`#B22234` / `#3C3B6E` for US). Keep them at 16×12px, `rounded-sm`.

## Score Badge (nav-level)

Shows the **overall** health score (not the latest session's). Computed from
confirmed purchases in the store:

```jsx
// store selector — derived, never stored
const overallScore = useAxiomStore(s => computeOverallScore(s.history))
```

Rendered as a small pill: `bg-emerald-500/10 text-emerald-400` for safe,
`amber` for caution, `red` for danger.

## Responsive

- `md` and up: full link row visible
- below `md`: collapse links into the floating pill; keep LangToggle + ScoreBadge
- mobile: pill shrinks (`px-4`), brand mark stays

## Pitfalls

1. **Don't blur the whole nav to full opacity** — translucency is the feature.
   `bg-zinc-900/70`, never `bg-zinc-900`.
2. **backdrop-blur needs a transparent background** — if you make the bg
   opaque, the blur does nothing visible.
3. **z-index** — nav is `z-50`; modals/toasts `z-40` or below, or they render
   *under* the glass.
4. **saturate is free polish** — always include it in the backdrop-filter.
5. On Firefox, `-webkit-backdrop-filter` is NOT needed (it's standard), but
   include it anyway for older Safari — costs nothing.
