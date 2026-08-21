# Design System — Axiom

> **CRITICAL:** Follow these exact values. Do NOT invent colors, spacing, or typography. Do NOT add "AI-themed" dark gradients or neon glow. The aesthetic is Apple premium — restrained, confident, minimal.

## 1. Color Palette

### Base Surfaces
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `bg-base` | `#09090b` | `bg-zinc-950` | App background |
| `bg-card` | `#18181b` at 60% opacity | `bg-zinc-900/60` | Cards, panels |
| `bg-elevated` | `#27272a` at 50% opacity | `bg-zinc-800/50` | Hover states, inputs |
| `bg-input` | `#0a0a0a` | `bg-zinc-950` | Input fields (darker than card) |

### Text
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `text-heading` | `#fafafa` | `text-white` | Headlines, numbers |
| `text-body` | `#a1a1aa` | `text-zinc-400` | Body text |
| `text-muted` | `#71717a` | `text-zinc-500` | Labels, captions |
| `text-dim` | `#52525b` | `text-zinc-600` | Placeholder text |

### Accents (Score Status)
| Status | Hex | Tailwind Class | Usage |
|---|---|---|---|
| Safe (80-100) | `#4ade80` | `text-emerald-400` `bg-emerald-500/10` | Green score |
| Warning (50-79) | `#fbbf24` | `text-amber-400` `bg-amber-500/10` | Amber score |
| Danger (0-49) | `#f87171` | `text-red-400` `bg-red-500/10` | Red score |
| Primary CTA | `#fafafa` | `bg-white text-zinc-900` | Primary buttons (inverted) |

### Borders
| Token | Opacity | Tailwind Class | Usage |
|---|---|---|---|
| `border-subtle` | white @ 6% | `border-white/[6%]` | Card borders |
| `border-hover` | white @ 12% | `border-white/[12%]` | Hover borders |
| `border-active` | white @ 15% | `border-white/[15%]` | Active/focus borders |

## 2. Typography

```css
font-family: "Inter", system-ui, -apple-system, sans-serif;
```

Import Inter from Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Scale
| Element | Size | Weight | Class |
|---|---|---|---|
| Hero headline | 48px | 800 | `text-5xl font-extrabold` |
| Section heading | 24px | 700 | `text-2xl font-bold` |
| Card title | 18px | 600 | `text-lg font-semibold` |
| Body | 15px | 400 | `text-[15px] font-normal` |
| Caption/Label | 13px | 500 | `text-[13px] font-medium` |
| Micro/Tag | 11px | 600 | `text-xs font-semibold uppercase tracking-wider` |
| Score number | 72px | 900 | `text-[72px] font-black` |
| Big metric | 36px | 800 | `text-4xl font-extrabold` |

### Letter spacing
- Headings: `tracking-tight` (-0.025em)
- Uppercase tags: `tracking-wider` (0.05em)
- Numbers/metrics: `tracking-tighter` (-0.05em)

## 3. Liquid Glass Surfaces

**NOT glassmorphism.** The difference: liquid glass is subtle, uses lower opacity blur, and never has visible "frosted" borders. It should feel like a smooth, dark surface with depth — not a transparent overlay.

```css
/* Base glass card */
.glass-card {
  background: rgba(24, 24, 27, 0.6);     /* zinc-900 at 60% */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
}

/* Elevated glass (for modals, dropdowns) */
.glass-elevated {
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.5);
}

/* Glass input */
.glass-input {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: border-color 0.2s ease;
}
.glass-input:focus {
  border-color: rgba(255, 255, 255, 0.15);
  outline: none;
}
```

### Background Ambient Glow
Subtle, barely-visible mesh gradient behind the content. NOT a colorful gradient — monochrome white at 1-3% opacity.

```jsx
<div className="fixed inset-0 pointer-events-none overflow-hidden">
  <div className="absolute top-[-200px] left-[10%] w-[600px] h-[400px] bg-white/[2%] rounded-full blur-[120px]" />
  <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-white/[1.5%] rounded-full blur-[100px]" />
  <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] bg-white/[1%] rounded-full blur-[80px]" />
</div>
```

## 4. Spacing System

Use Tailwind's default spacing scale. Key values:

| Token | Value | Usage |
|---|---|---|
| `gap-2` | 8px | Tight element spacing |
| `gap-3` | 12px | Default card content gap |
| `gap-4` | 16px | Section within card |
| `gap-6` | 24px | Between cards in a grid |
| `gap-8` | 32px | Between page sections |
| `p-4` | 16px | Card padding (compact) |
| `p-6` | 24px | Card padding (default) |
| `p-8` | 32px | Card padding (large/hero) |

## 5. Border Radius

| Element | Radius | Class |
|---|---|---|
| Cards | 24px | `rounded-3xl` |
| Inputs | 16px | `rounded-2xl` |
| Buttons | 12px | `rounded-xl` |
| Badges/Tags | 8px | `rounded-lg` |
| Pills (navbar) | 9999px | `rounded-full` |
| Score gauge | 9999px | `rounded-full` |

## 6. Component Styles

### Button
```jsx
// Primary (inverted white)
className="bg-white text-zinc-900 font-medium px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors"

// Secondary (ghost border)
className="bg-zinc-800/50 border border-white/10 text-zinc-100 font-medium px-5 py-2.5 rounded-xl hover:border-white/20 hover:bg-zinc-800/80 transition-all"

// Danger
className="bg-red-500/10 border border-red-500/20 text-red-400 font-medium px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors"
```

### Card (Liquid Glass)
```jsx
className="bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl p-6"
```

### Badge
```jsx
// Status badges
// Safe
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold"
// Warning
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold"
// Danger
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold"
// Neutral
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 text-xs font-semibold"
```

### Input
```jsx
className="w-full bg-zinc-950/60 backdrop-blur-md border border-white/[6%] rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:border-white/[15%] focus:outline-none transition-colors"
```

## 7. Animations

Subtle, fast. No bouncing, no springs. Linear ease-out.

```css
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-slide-up { animation: slide-up 0.5s ease-out; }
.animate-scale-in { animation: scale-in 0.3s ease-out; }

/* Stagger delays for list items */
.stagger-1 { animation-delay: 0.05s; animation-fill-mode: backwards; }
.stagger-2 { animation-delay: 0.1s; animation-fill-mode: backwards; }
.stagger-3 { animation-delay: 0.15s; animation-fill-mode: backwards; }
.stagger-4 { animation-delay: 0.2s; animation-fill-mode: backwards; }
.stagger-5 { animation-delay: 0.25s; animation-fill-mode: backwards; }
.stagger-6 { animation-delay: 0.3s; animation-fill-mode: backwards; }
```

## 8. Layout Grid

### Page Container
```jsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
```

### Card Grid
```jsx
// 2-column on desktop, 1-column on mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// 3-column
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

## 9. Score Gauge Component

Circular gauge for the Sanggup Score. Uses SVG circle with stroke-dasharray.

```jsx
// Props: score (0-100), size (default 200), strokeWidth (default 12)
// Color determined by score: emerald (≥80), amber (≥50), red (<50)

// Gauge background ring
<circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />

// Gauge progress ring (rotated -90deg to start at top)
<circle
  cx={size/2} cy={size/2} r={radius}
  fill="none"
  stroke={color}
  strokeWidth={strokeWidth}
  strokeLinecap="round"
  strokeDasharray={circumference}
  strokeDashoffset={circumference - (score / 100) * circumference}
  transform={`rotate(-90 ${size/2} ${size/2})`}
  className="transition-all duration-1000 ease-out"
/>

// Score number in center
<text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
  className="fill-white font-black" style={{ fontSize: '48px' }}>
  {score}
</text>
```

## 10. Prohibited Patterns

Do NOT use any of these:
- ❌ Neon glow effects on text or borders
- ❌ Gradient text (rainbow, purple-blue, etc.)
- ❌ "Terminal" or "matrix" aesthetic (monospace fonts, blinking cursors)
- ❌ Excessive shadows (box-shadow blur > 60px)
- ❌ Colorful backgrounds (blue, purple, pink gradients on surfaces)
- ❌ Glassmorphism with visible frosted texture
- ❌ Animated number counters that take >1s (use 600ms max)
- ❌ Loading spinners that look "techy" (use minimal dots or skeleton)
- ❌ Any emoji in the UI
- ❌ Comic Sans, Papyrus, or decorative fonts
