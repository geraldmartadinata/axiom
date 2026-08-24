import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import { formatCurrency } from '../../utils/format'
import { assetValueAt, formatCompactIDR, YEAR_MS } from '../../utils/depreciation'

/**
 * Growth Projection — "Total Asset Value Over Time".
 * STATE A (no sessions): bare axes + muted hint. Never fabricates curves.
 * STATE B: solid gold TOTAL ASSETS line (each purchase steps the line up at its own
 * date, then decays by category rate) vs dashed blue-gray CASH & SAVINGS trajectory
 * (current savings compounding + monthly contribution from the baseline sliders).
 * Cash history before today is unknowable → the cash line intentionally starts at
 * today rather than inventing a past balance.
 */

const GOLD = '#e8c47a'
const GRAY = '#7a8ba3'
const W = 400, H = 210          // viewBox units
const PL = 8, PR = 8, PT = 26, PB = 20 // paddings (labels live in HTML overlays)

const MONTH_MS = YEAR_MS / 12
const N = 160                    // sample points across the domain

export default function GrowthProjection() {
  const { t, lang } = useLanguage()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)

  // Baseline slider state lives in Dashboard… read the persisted profile instead —
  // it is debounced-written by those very sliders (~300ms), so this recomputes live.
  const income = Number(profile?.monthly_income) || 0
  const expenses = Number(profile?.monthly_expenses) || 0
  const savingsRatePct = income > 0 ? Math.max(0, Math.min(100, Math.round(((Number(profile?.monthly_savings) || 0) / income) * 100))) : 0

  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null) // { type:'crosshair', i } | { type:'marker', i, asset }
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const fmtDate = useCallback((ms, opts) =>
    new Date(ms).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', opts || { day: 'numeric', month: 'short', year: 'numeric' })
  , [lang])

  // ---------- data model ----------
  const model = useMemo(() => {
    const valid = (Array.isArray(history) ? history : [])
      .map(s => ({
        id: s?.id,
        name: String(s?.scenario?.item_name || '').trim(),
        price: Number(s?.financials?.base_price),
        category: s?.scenario?.category,
        ms: new Date(s?.created_at || NaN).getTime(),
        currency: s?.currency || 'IDR',
      }))
      .filter(a => a.name && Number.isFinite(a.price) && a.price > 0 && Number.isFinite(a.ms))
      .sort((a, b) => a.ms - b.ms)

    if (valid.length === 0) return null

    const now = Date.now()
    const t0 = valid[0].ms
    const tEnd = now + 5 * YEAR_MS

    const ts = Array.from({ length: N }, (_, i) => t0 + ((tEnd - t0) * i) / (N - 1))

    // Per-asset decay, stacked into a total (0 before each asset's purchase).
    const totals = ts.map(time => {
      let sum = 0
      for (const a of valid) {
        const v = assetValueAt({ price: a.price, category: a.category, purchaseMs: a.ms }, time)
        if (v != null) sum += v
      }
      return sum
    })

    // Cash & savings: current balance compounds at the expected return, plus the
    // monthly contribution implied by the baseline sliders. Starts at TODAY.
    const annualReturn = (Number(profile?.investment_return) || 7) / 100
    const startBalance = Math.max(0, Number(profile?.emergency_fund) || 0)
    const monthlyContrib = Math.max(0, Math.min((savingsRatePct / 100) * income, income - expenses))
    const cash = ts.map(time => {
      if (time < now) return null // no fabricated history
      const months = (time - now) / MONTH_MS
      const grown = startBalance * Math.pow(1 + annualReturn / 12, months)
      const contribs = monthlyContrib > 0
        ? monthlyContrib * ((Math.pow(1 + annualReturn / 12, months) - 1) / (annualReturn / 12))
        : 0
      return grown + contribs
    })

    // Purchase markers sit ON the total line at each asset's buy date (nearest sample).
    const markers = valid.map(a => {
      const i = Math.min(N - 1, Math.round(((a.ms - t0) / (tEnd - t0)) * (N - 1)))
      return { ...a, i }
    })

    const spent = valid.reduce((acc, a) => acc + a.price, 0)
    const nowI = Math.min(N - 1, Math.round(((now - t0) / (tEnd - t0)) * (N - 1)))
    const current = totals[nowI]

    return {
      assets: valid, ts, totals, cash, markers, nowI,
      spent, current,
      currentPct: spent > 0 ? ((current - spent) / spent) * 100 : 0,
      est5y: totals[N - 1],
      cashEnd: cash[N - 1],
      t0, now, tEnd,
    }
  }, [history, profile, income, expenses, savingsRatePct])

  // ---------- scales & paths ----------
  const geo = useMemo(() => {
    if (!model) return null
    const maxY = Math.max(...model.totals, ...model.cash.filter(v => v != null), 1)
    const X = time => PL + ((time - model.t0) / (model.tEnd - model.t0)) * (W - PL - PR)
    const Y = v => H - PB - (v / maxY) * (H - PT - PB)
    const totalPath = model.ts.map((time, i) => `${i === 0 ? 'M' : 'L'}${X(time).toFixed(2)},${Y(model.totals[i]).toFixed(2)}`).join(' ')
    const cashSegs = []
    let seg = null
    model.ts.forEach((time, i) => {
      const v = model.cash[i]
      if (v == null) { seg = null; return }
      seg = seg || []
      seg.push(`${seg.length === 0 ? 'M' : 'L'}${X(time).toFixed(2)},${Y(v).toFixed(2)}`)
      if (i === N - 1 || model.cash[i + 1] == null) { cashSegs.push(seg.join(' ')); seg = null }
    })
    const areaPath = `${totalPath} L${X(model.tEnd).toFixed(2)},${H - PB} L${X(model.t0).toFixed(2)},${H - PB} Z`
    const yTicks = [0.25, 0.5, 0.75, 1].map(f => ({ y: Y(maxY * f), label: formatCompactIDR(maxY * f) }))
    return { X, Y, maxY, totalPath, cashSegs, areaPath, yTicks }
  }, [model])

  const onMove = useCallback((e) => {
    if (!model || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHover(h => (h?.type === 'marker' ? h : { type: 'crosshair', i: Math.round(frac * (N - 1)) }))
  }, [model])
  const onLeave = useCallback(() => setHover(null), [])

  const hoverInfo = useMemo(() => {
    if (!hover || !model) return null
    const i = hover.i ?? model.nowI
    const time = model.ts[i]
    return {
      i, time,
      total: model.totals[i],
      cash: model.cash[i],
      asset: hover.type === 'marker' ? hover.asset : null,
      leftPct: (geo.X(time) / W) * 100,
      flip: geo.X(time) / W > 0.62,
    }
  }, [hover, model, geo])

  // Endpoint label anti-collision: nudge apart when finals land close together.
  const endpoints = useMemo(() => {
    if (!model || !geo) return null
    let ay = geo.Y(model.est5y)
    let cy = geo.Y(model.cashEnd)
    if (Math.abs(ay - cy) < 12) { const mid = (ay + cy) / 2; ay = mid - 6; cy = mid + 6 }
    return { ay, cy }
  }, [model, geo])

  // ---------- STATE A — empty ----------
  if (!model || !geo) {
    return (
      <section className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
        <Header t={t} />
        <div className="relative h-[240px]">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
            {[0.25, 0.5, 0.75].map(f => (
              <line key={f} x1={PL} y1={H - PB - f * (H - PT - PB)} x2={W - PR} y2={H - PB - f * (H - PT - PB)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="rgba(255,255,255,0.09)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <p className="text-xs text-zinc-600 text-center leading-relaxed max-w-[260px]">{t('dashboard.growthEmptyMsg')}</p>
          </div>
          <div className="absolute bottom-2 left-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{t('dashboard.estValue')}</p>
            <p className="font-mono text-2xl font-bold text-zinc-600">—</p>
          </div>
        </div>
      </section>
    )
  }

  // ---------- STATE B — populated ----------
  const trans = reducedMotion ? undefined : { transition: 'd 0.6s ease' }

  return (
    <section className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
      <Header t={t} />

      {/* Legend chips */}
      <div className="flex items-center justify-end gap-4 mb-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}55` }} />
          {t('dashboard.legendAssets')}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
          <span className="w-3.5 h-0 shrink-0 border-t border-dashed" style={{ borderColor: GRAY }} />
          {t('dashboard.legendCash')}
        </span>
      </div>

      {/* Chart */}
      <div
        ref={wrapRef}
        className="relative h-[240px]"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          {/* grid */}
          {geo.yTicks.map(tick => (
            <line key={tick.y} x1={PL} y1={tick.y} x2={W - PR} y2={tick.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="rgba(255,255,255,0.09)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <defs>
            <linearGradient id="gpGoldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(232,196,122,0.14)" />
              <stop offset="100%" stopColor="rgba(232,196,122,0)" />
            </linearGradient>
          </defs>
          <path d={geo.areaPath} fill="url(#gpGoldFill)" style={trans} />
          {geo.cashSegs.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={GRAY} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" vectorEffect="non-scaling-stroke" style={trans} />
          ))}
          <path d={geo.totalPath} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px rgba(232,196,122,0.35))', ...trans }} />
        </svg>

        {/* Y-axis labels (HTML — immune to distortion) */}
        {geo.yTicks.map(tick => (
          <span key={tick.label} className="absolute font-mono text-[7px] uppercase tracking-wider text-zinc-600 -translate-y-1/2 pointer-events-none" style={{ top: `${(tick.y / H) * 100}%`, left: 0 }}>
            {tick.label}
          </span>
        ))}
        {/* X-axis labels */}
        <span className="absolute font-mono text-[7px] uppercase tracking-wider text-zinc-600 pointer-events-none" style={{ bottom: 0, left: 0 }}>{fmtDate(model.t0)}</span>
        <span className="absolute font-mono text-[7px] uppercase tracking-wider text-zinc-500 pointer-events-none" style={{ bottom: 0, left: `${(geo.X(model.now) / W) * 100}%`, transform: 'translateX(-50%)' }}>{t('dashboard.todayLabel')}</span>
        <span className="absolute font-mono text-[7px] uppercase tracking-wider text-zinc-600 pointer-events-none" style={{ bottom: 0, right: 0 }}>+5{lang === 'id' ? ' thn' : ' yr'}</span>

        {/* Today divider */}
        <div className="absolute top-[8%] bottom-[10%] w-px bg-white/[6%] pointer-events-none" style={{ left: `${(geo.X(model.now) / W) * 100}%` }} />

        {/* Purchase markers */}
        {model.markers.map(m => (
          <button
            key={m.id}
            type="button"
            aria-label={`${m.name} — ${formatCurrency(m.price, lang, m.currency)}`}
            className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-zinc-950 transition-transform hover:scale-125 cursor-pointer"
            style={{
              left: `${(geo.X(m.ms) / W) * 100}%`,
              top: `${(geo.Y(model.totals[m.i]) / H) * 100}%`,
              borderColor: GOLD,
              boxShadow: hover?.type === 'marker' && hover.asset?.id === m.id ? `0 0 10px ${GOLD}` : 'none',
            }}
            onMouseEnter={() => setHover({ type: 'marker', i: m.i, asset: m })}
            onFocus={() => setHover({ type: 'marker', i: m.i, asset: m })}
            onBlur={onLeave}
          />
        ))}

        {/* Crosshair */}
        {hover?.type === 'crosshair' && (
          <div
            className="absolute top-[6%] bottom-[9%] w-px bg-white/20 pointer-events-none"
            style={{ left: `${(geo.X(model.ts[hover.i]) / W) * 100}%` }}
          />
        )}

        {/* Tooltip */}
        {hoverInfo && (
          <div
            className={`absolute z-10 pointer-events-none rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur px-3 py-2 shadow-xl min-w-[150px] ${hoverInfo.flip ? '-translate-x-full -ml-2' : 'ml-2'}`}
            style={{ top: '4%', left: `${hoverInfo.leftPct}%` }}
          >
            <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">{fmtDate(hoverInfo.time)}</p>
            {hoverInfo.asset && (
              <p className="mt-1 text-[11px] font-semibold text-amber-100 truncate">{hoverInfo.asset.name}</p>
            )}
            {hoverInfo.asset && (
              <p className="font-mono text-[9px] text-zinc-400 tabular-nums">
                {formatCurrency(hoverInfo.asset.price, lang, hoverInfo.asset.currency)} · {fmtDate(hoverInfo.asset.ms, { day: 'numeric', month: 'short', year: '2-digit' })}
              </p>
            )}
            <p className="mt-1 font-mono text-[10px] tabular-nums" style={{ color: GOLD }}>
              {t('dashboard.tooltipAssets')} {formatCurrency(hoverInfo.total, lang, 'IDR')}
            </p>
            {hoverInfo.cash != null && (
              <p className="font-mono text-[10px] tabular-nums" style={{ color: GRAY }}>
                {t('dashboard.tooltipCash')} {formatCurrency(hoverInfo.cash, lang, 'IDR')}
              </p>
            )}
          </div>
        )}

        {/* Endpoint labels */}
        <div className="absolute font-mono text-[7px] font-bold uppercase tracking-wider pointer-events-none -translate-y-1/2 text-right" style={{ top: `${(endpoints.ay / H) * 100}%`, right: 0, color: GOLD }}>
          {t('dashboard.endpointAssets')}<br />{formatCompactIDR(model.est5y)}
        </div>
        <div className="absolute font-mono text-[7px] font-bold uppercase tracking-wider pointer-events-none translate-y-1/2 text-right" style={{ top: `${(endpoints.cy / H) * 100}%`, right: 0, color: GRAY }}>
          {t('dashboard.endpointCash')}<br />{formatCompactIDR(model.cashEnd)}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[6%]">
        <Stat label={t('dashboard.summarySpent')} value={formatCurrency(model.spent, lang, 'IDR')} />
        <Stat
          label={t('dashboard.summaryCurrent')}
          value={
            <>
              {formatCurrency(model.current, lang, 'IDR')}{' '}
              <span className={model.currentPct < 0 ? 'text-terracotta' : 'text-sand'}>
                ({model.currentPct >= 0 ? '+' : '−'}{Math.abs(Math.round(model.currentPct))}%)
              </span>
            </>
          }
        />
        <Stat label={t('dashboard.summaryEst5')} value={formatCurrency(model.est5y, lang, 'IDR')} accent />
      </div>
    </section>
  )
}

function Header({ t }) {
  return (
    <header className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white">{t('dashboard.growthTitle')}</h2>
      <MoreHorizontal className="h-4 w-4 text-zinc-600" strokeWidth={2} />
    </header>
  )
}

function Frame() { return null } // reserved: empty-state grid handled inline

function Stat({ label, value, accent }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-600 truncate">{label}</p>
      <p className={`mt-0.5 font-mono text-xs font-bold tabular-nums truncate ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}
