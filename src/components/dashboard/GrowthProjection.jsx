import { useMemo, useRef, useState, useCallback } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import { formatCurrency } from '../../utils/format'
import { assetValueAt, formatCompactIDR, YEAR_MS } from '../../utils/depreciation'

/**
 * Growth Projection — THREE lines, never fabricated:
 *   a) PERSONAL ASSETS (solid gold): savings + emergency fund + stocks + crypto.
 *      Stocks grow at the risk profile's expected return; crypto at the same
 *      return × 0.8 (volatility discount). Monthly contribution = free cash flow.
 *   b) BOUGHT ASSETS (solid blue-gray): confirmed sessions, each asset decaying
 *      via assetGrowthRate from its own purchase date.
 *   c) PLANNED (dashed amber): analyzed-but-not-confirmed sessions.
 * Empty states: no profile AND no sessions → axes only; profile only → line (a).
 */

const GOLD = '#e8c47a'
const AMBER = '#f5d9a8'
const GRAY = '#7a8ba3'
const W = 400, H = 210
const PL = 8, PR = 8, PT = 26, PB = 20

const MONTH_MS = YEAR_MS / 12
const N = 160

export default function GrowthProjection() {
  const { t, lang } = useLanguage()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)

  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const fmtDate = useCallback((ms, opts) =>
    new Date(ms).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', opts || { day: 'numeric', month: 'short', year: 'numeric' })
  , [lang])

  const income = Number(profile?.monthly_income) || 0
  const expenses = Number(profile?.monthly_expenses) || 0
  const monthlySavings = Number(profile?.monthly_savings) || 0
  const fcf = Math.max(0, income - expenses - monthlySavings)

  // ---------- data model ----------
  const model = useMemo(() => {
    const sessions = Array.isArray(history) ? history : []
    const toAsset = s => ({
      id: s?.id,
      name: String(s?.scenario?.item_name || '').trim(),
      price: Number(s?.financials?.base_price),
      category: s?.scenario?.category,
      ms: new Date(s?.created_at || NaN).getTime(),
      currency: s?.currency || 'IDR',
    })
    const valid = sessions.map(toAsset).filter(a => a.name && Number.isFinite(a.price) && a.price > 0 && Number.isFinite(a.ms))
    const bought = valid.filter(a => sessions.find(s => s?.id === a.id)?.status === 'CONFIRMED').sort((a, b) => a.ms - b.ms)
    const planned = valid.filter(a => sessions.find(s => s?.id === a.id)?.status !== 'CONFIRMED').sort((a, b) => a.ms - b.ms)

    const hasProfile = Boolean(profile) && (
      income > 0 || Number(profile?.emergency_fund) > 0 ||
      Number(profile?.stocks_value) > 0 || Number(profile?.crypto_value) > 0
    )
    if (!hasProfile && valid.length === 0) return null

    const now = Date.now()
    const purchaseDates = [...bought, ...planned].map(a => a.ms)
    const t0 = purchaseDates.length ? Math.min(now, ...purchaseDates) : now
    const tEnd = now + 5 * YEAR_MS
    const ts = Array.from({ length: N }, (_, i) => t0 + ((tEnd - t0) * i) / (N - 1))

    // (a) personal assets — stocks at expected return, crypto at 0.8×, cash flat,
    // plus free-cash-flow contributions compounded monthly from today.
    const r = (Number(profile?.investment_return) || 7) / 100
    const stocks0 = Number(profile?.stocks_value) || 0
    const crypto0 = Number(profile?.crypto_value) || 0
    const cash0 = Number(profile?.emergency_fund) || 0
    const monthlyR = r / 12
    const personal = ts.map(time => {
      if (time < now) return null
      const months = (time - now) / MONTH_MS
      const stocks = stocks0 * Math.pow(1 + r, months)
      const crypto = crypto0 * Math.pow(1 + r * 0.8, months)
      const contribs = fcf > 0 && monthlyR > 0
        ? fcf * ((Math.pow(1 + monthlyR, months) - 1) / monthlyR)
        : fcf * months
      return cash0 + stocks + crypto + contribs
    })

    // (b)/(c) purchased & planned asset stacks (0 before each purchase date).
    const stackAt = (assets, time) => {
      let sum = 0
      for (const a of assets) {
        const v = assetValueAt({ price: a.price, category: a.category, purchaseMs: a.ms }, time)
        if (v != null) sum += v
      }
      return sum
    }
    const boughtLine = bought.length ? ts.map(time => stackAt(bought, time)) : null
    const plannedLine = planned.length ? ts.map(time => stackAt(planned, time)) : null

    const nowI = Math.min(N - 1, Math.round(((now - t0) / (tEnd - t0)) * (N - 1)))
    const markers = [...bought, ...planned].map(a => ({
      ...a,
      i: Math.min(N - 1, Math.round(((a.ms - t0) / (tEnd - t0)) * (N - 1))),
      confirmed: bought.includes(a),
    }))

    const spentBought = bought.reduce((acc, a) => acc + a.price, 0)
    const currentBought = boughtLine ? boughtLine[nowI] : null
    const currentPct = spentBought > 0 && currentBought != null ? ((currentBought - spentBought) / spentBought) * 100 : null

    return {
      bought, planned, ts, personal, boughtLine, plannedLine,
      markers, nowI, t0, now, tEnd,
      personalEnd: personal[N - 1],
      boughtEnd: boughtLine ? boughtLine[N - 1] : null,
      plannedEnd: plannedLine ? plannedLine[N - 1] : null,
      spentBought, currentBought, currentPct,
      hasProfile,
    }
  }, [history, profile, income, expenses, monthlySavings, fcf])

  // ---------- scales & paths ----------
  const geo = useMemo(() => {
    if (!model) return null
    const values = [
      ...model.personal.filter(v => v != null),
      ...(model.boughtLine || []),
      ...(model.plannedLine || []),
    ]
    const maxY = Math.max(...values, 1)
    const X = time => PL + ((time - model.t0) / (model.tEnd - model.t0)) * (W - PL - PR)
    const Y = v => H - PB - (v / maxY) * (H - PT - PB)
    const path = line => line == null
      ? null
      : model.ts.map((time, i) => `${i === 0 ? 'M' : 'L'}${X(time).toFixed(2)},${Y(line[i]).toFixed(2)}`).join(' ')
    const personalPath = path(model.personal)
    const areaPath = personalPath
      ? `${personalPath} L${X(model.tEnd).toFixed(2)},${H - PB} L${X(Math.max(model.t0, model.now)).toFixed(2)},${H - PB} Z`
      : null
    const dashed = line => {
      if (line == null) return []
      const segs = []
      let seg = null
      model.ts.forEach((time, i) => {
        const v = line[i]
        if (v <= 0 && i > 0 && line[i - 1] <= 0) { seg = null; return }
        seg = seg || []
        seg.push(`${seg.length === 0 ? 'M' : 'L'}${X(time).toFixed(2)},${Y(v).toFixed(2)}`)
        if (i === N - 1) { segs.push(seg.join(' ')); seg = null }
      })
      return segs
    }
    const yTicks = [0.25, 0.5, 0.75, 1].map(f => ({ y: Y(maxY * f), label: formatCompactIDR(maxY * f) }))
    return {
      X, Y, maxY, yTicks,
      personalPath, areaPath,
      boughtPath: path(model.boughtLine),
      plannedSegs: dashed(model.plannedLine),
    }
  }, [model])

  const onMove = useCallback((e) => {
    if (!model || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHover(h => (h?.type === 'marker' ? h : { type: 'crosshair', i: Math.round(frac * (N - 1)) }))
  }, [model])
  const onLeave = useCallback(() => setHover(null), [])

  const hoverInfo = useMemo(() => {
    if (!hover || !model || !geo) return null
    const i = hover.i ?? model.nowI
    const time = model.ts[i]
    return {
      i, time,
      personal: model.personal[i],
      boughtV: model.boughtLine?.[i],
      plannedV: model.plannedLine?.[i],
      asset: hover.type === 'marker' ? hover.asset : null,
      leftPct: (geo.X(time) / W) * 100,
      flip: geo.X(time) / W > 0.62,
    }
  }, [hover, model, geo])

  // Endpoint labels with anti-collision.
  const endpoints = useMemo(() => {
    if (!model || !geo) return null
    const pts = [{ v: model.personalEnd, c: GOLD, k: 'p' }]
    if (model.boughtEnd != null) pts.push({ v: model.boughtEnd, c: GRAY, k: 'b' })
    if (model.plannedEnd != null) pts.push({ v: model.plannedEnd, c: AMBER, k: 'pl' })
    pts.sort((a, b) => geo.Y(a.v) - geo.Y(b.v))
    for (let i = 1; i < pts.length; i++) {
      if (geo.Y(pts[i].v) - geo.Y(pts[i - 1].v) < 22) {
        pts[i].y = geo.Y(pts[i - 1].y ?? geo.Y(pts[i - 1].v)) + 22
        pts[i].y = (pts[i - 1].y ?? geo.Y(pts[i - 1].v)) + 22
      } else {
        pts[i].y = geo.Y(pts[i].v)
      }
    }
    pts[0].y = geo.Y(pts[0].v)
    return Object.fromEntries(pts.map(p => [p.k, p.y]))
  }, [model, geo])

  // ---------- EMPTY — no profile AND no sessions ----------
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

  const trans = reducedMotion ? undefined : { transition: 'd 0.6s ease' }

  return (
    <section className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
      <Header t={t} />

      {/* Legend chips */}
      <div className="flex items-center justify-end gap-4 mb-2 flex-wrap pointer-events-none">
        <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
          <span className="w-3.5 h-0 shrink-0 border-t-2" style={{ borderColor: GOLD }} />
          {t('dashboard.legendPersonal')}
        </span>
        {model.boughtLine && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
            <span className="w-3.5 h-0 shrink-0 border-t-2" style={{ borderColor: GRAY }} />
            {t('dashboard.legendBought')}
          </span>
        )}
        {model.plannedLine && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
            <span className="w-3.5 h-0 shrink-0 border-t-2 border-dashed" style={{ borderColor: AMBER }} />
            {t('dashboard.legendPlanned')}
          </span>
        )}
      </div>

      {/* Chart */}
      <div ref={wrapRef} className="relative h-[240px]" onMouseMove={onMove} onMouseLeave={onLeave}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
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
          {geo.areaPath && <path d={geo.areaPath} fill="url(#gpGoldFill)" style={trans} />}
          {geo.plannedSegs.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={AMBER} strokeWidth="1.75" strokeDasharray="5 5" opacity="0.9" vectorEffect="non-scaling-stroke" style={trans} />
          ))}
          {geo.boughtPath && (
            <path d={geo.boughtPath} fill="none" stroke={GRAY} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={trans} />
          )}
          {geo.personalPath && (
            <path d={geo.personalPath} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px rgba(232,196,122,0.35))', ...trans }} />
          )}
        </svg>

        {/* Y-axis labels */}
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
              top: `${(geo.Y((m.confirmed ? model.boughtLine : model.plannedLine)[m.i]) / H) * 100}%`,
              borderColor: m.confirmed ? GRAY : AMBER,
              boxShadow: hover?.type === 'marker' && hover.asset?.id === m.id ? `0 0 10px ${m.confirmed ? GRAY : AMBER}` : 'none',
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

        {/* Tooltip — date + all three lines */}
        {hoverInfo && (
          <div
            className={`absolute z-10 pointer-events-none rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur px-3 py-2 shadow-xl min-w-[160px] ${hoverInfo.flip ? '-translate-x-full -ml-2' : 'ml-2'}`}
            style={{ top: '4%', left: `${hoverInfo.leftPct}%` }}
          >
            <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">{fmtDate(hoverInfo.time)}</p>
            {hoverInfo.asset && (
              <>
                <p className="mt-1 text-[11px] font-semibold text-amber-100 truncate">{hoverInfo.asset.name}</p>
                <p className="font-mono text-[9px] text-zinc-400 tabular-nums">
                  {formatCurrency(hoverInfo.asset.price, lang, hoverInfo.asset.currency)} · {fmtDate(hoverInfo.asset.ms, { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </>
            )}
            {hoverInfo.personal != null && (
              <p className="mt-1 font-mono text-[10px] tabular-nums" style={{ color: GOLD }}>
                {t('dashboard.legendPersonal')} {formatCurrency(hoverInfo.personal, lang, 'IDR')}
              </p>
            )}
            {hoverInfo.boughtV != null && (
              <p className="font-mono text-[10px] tabular-nums" style={{ color: GRAY }}>
                {t('dashboard.legendBought')} {formatCurrency(hoverInfo.boughtV, lang, 'IDR')}
              </p>
            )}
            {hoverInfo.plannedV != null && (
              <p className="font-mono text-[10px] tabular-nums" style={{ color: AMBER }}>
                {t('dashboard.legendPlanned')} {formatCurrency(hoverInfo.plannedV, lang, 'IDR')}
              </p>
            )}
          </div>
        )}

        {/* Endpoint labels */}
        <div className="absolute font-mono text-[7px] font-bold uppercase tracking-wider pointer-events-none -translate-y-1/2 text-right" style={{ top: `${((endpoints?.p ?? geo.Y(model.personalEnd)) / H) * 100}%`, right: 0, color: GOLD }}>
          {t('dashboard.legendPersonal')}<br />{formatCompactIDR(model.personalEnd)}
        </div>
        {model.boughtEnd != null && (
          <div className="absolute font-mono text-[7px] font-bold uppercase tracking-wider pointer-events-none -translate-y-1/2 text-right" style={{ top: `${((endpoints?.b ?? geo.Y(model.boughtEnd)) / H) * 100}%`, right: 0, color: GRAY }}>
            {t('dashboard.legendBought')}<br />{formatCompactIDR(model.boughtEnd)}
          </div>
        )}
        {model.plannedEnd != null && (
          <div className="absolute font-mono text-[7px] font-bold uppercase tracking-wider pointer-events-none -translate-y-1/2 text-right" style={{ top: `${((endpoints?.pl ?? geo.Y(model.plannedEnd)) / H) * 100}%`, right: 0, color: AMBER }}>
            {t('dashboard.legendPlanned')}<br />{formatCompactIDR(model.plannedEnd)}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[6%]">
        <Stat label={t('dashboard.summaryPersonal')} value={formatCurrency(model.personalEnd, lang, 'IDR')} accent />
        <Stat
          label={t('dashboard.summaryBought')}
          value={model.currentBought != null ? (
            <>
              {formatCurrency(model.currentBought, lang, 'IDR')}{' '}
              {model.currentPct != null && (
                <span className={model.currentPct < 0 ? 'text-terracotta' : 'text-sand'}>
                  ({model.currentPct >= 0 ? '+' : '−'}{Math.abs(Math.round(model.currentPct))}%)
                </span>
              )}
            </>
          ) : '—'}
        />
        <Stat
          label={t('dashboard.summaryPlanned')}
          value={model.plannedEnd != null ? formatCurrency(model.plannedEnd, lang, 'IDR') : '—'}
        />
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

function Stat({ label, value, accent }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-600 truncate">{label}</p>
      <p className={`mt-0.5 font-mono text-xs font-bold tabular-nums truncate ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}
