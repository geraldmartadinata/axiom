import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { formatCurrency } from '../utils/format'
import { computeHealthScore, computeLiquidityGrade, scoreColor, withAlpha } from '../utils/healthScore'
import CommandCapsule from '../components/capsule/CommandCapsule'
import GrowthProjection from '../components/dashboard/GrowthProjection'
import HealthBreakdown from '../components/dashboard/HealthBreakdown'
import { motion } from 'framer-motion'
import {
  Activity, BarChart3, Wallet, TrendingUp, Car, Smartphone,
  Home, Package, ChevronRight,
} from 'lucide-react'

/**
 * Dashboard — prototype match.
 * Row 1: hero card (headline + pill input bar)
 * Row 2: Financial Health (38%) | Baseline Parameters (62%)
 * Row 3: Growth Projection (50%) | Recent Analysis (50%)
 * All numbers derive live from baseline sliders; empty states never fabricate.
 */

const INCOME_MAX = 50_000_000, INCOME_STEP = 500_000
const EXPENSES_MAX = 30_000_000, EXPENSES_STEP = 250_000
const RATE_MAX = 100, RATE_STEP = 1

const CAT_ICON = { vehicle: Car, tech: Smartphone, property: Home }
const CAT_KEY = { vehicle: 'catVehicle', tech: 'catTech', property: 'catProperty' }

export default function Dashboard() {
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { t, lang } = useLanguage()

  // ---- Baseline state, initialized from EXISTING profile keys ----
  const [income, setIncome] = useState(() => Math.min(INCOME_MAX, Number(profile?.monthly_income) || 0))
  const [expenses, setExpenses] = useState(() => Math.min(EXPENSES_MAX, Number(profile?.monthly_expenses) || 0))
  const [rate, setRate] = useState(() => {
    const inc = Number(profile?.monthly_income) || 0
    const sav = Number(profile?.monthly_savings) || 0
    return inc > 0 ? Math.max(0, Math.min(RATE_MAX, Math.round((sav / inc) * 100))) : 0
  })

  const hasData = income > 0 || expenses > 0 || rate > 0
  const showHealth = Boolean(
    Number(profile?.monthly_income) || Number(profile?.monthly_expenses) ||
    Number(profile?.monthly_savings) || Number(profile?.emergency_fund) ||
    hasData
  )

  // ---- Health score — ONE shared util for navbar, dashboard and analyze ----
  // Default: REAL score from the profile. When a slider deviates from the
  // saved profile, the gauge switches to SIMULATION mode (clearly labeled)
  // using the exact same util — only the inputs differ.
  const profileRate = income > 0
    ? Math.max(0, Math.min(100, Math.round(((Number(profile?.monthly_savings) || 0) / income) * 100)))
    : 0
  const realHealth = useMemo(
    () => computeHealthScore(profile, history),
    [profile, history]
  )
  const simHealth = useMemo(
    () => computeHealthScore(profile, history, {
      incomeOverride: income,
      expensesOverride: expenses,
      savingsRateOverride: rate,
    }),
    [profile, history, income, expenses, rate]
  )
  const isSimulation = income !== (Number(profile?.monthly_income) || 0) ||
    expenses !== (Number(profile?.monthly_expenses) || 0) ||
    rate !== profileRate
  const health = isSimulation ? simHealth : realHealth
  const rawSavings = (rate / 100) * income

  // ---- Per-slider change handlers (pure — each touches ONLY its own state).
  // Invariant: expenses + savings ≤ income. The slider being dragged yields
  // (clamps to the nearest valid step) and an amber warning flashes; the
  // other two sliders are never mutated as a side effect.
  const [warnVisible, setWarnVisible] = useState(false)
  const warnTimer = useRef(null)

  const flashClampWarning = useCallback(() => {
    setWarnVisible(true)
    clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setWarnVisible(false), 2600)
  }, [])

  useEffect(() => () => clearTimeout(warnTimer.current), [])

  const handleIncomeChange = (e) => {
    let v = Math.max(0, Math.min(INCOME_MAX, Number(e.target.value) || 0))
    if (v < expenses + rawSavings) {
      // dragged income yields: floor to nearest step that fits commitments
      v = Math.floor(Math.max(0, expenses + rawSavings) / INCOME_STEP) * INCOME_STEP
      flashClampWarning()
    }
    setIncome(v)
  }

  const handleExpensesChange = (e) => {
    let v = Math.max(0, Math.min(EXPENSES_MAX, Number(e.target.value) || 0))
    const headroom = income - rawSavings
    if (v > headroom) {
      v = Math.floor(headroom / EXPENSES_STEP) * EXPENSES_STEP
      flashClampWarning()
    }
    setExpenses(Math.max(0, v))
  }

  const handleRateChange = (e) => {
    let v = Math.max(0, Math.min(RATE_MAX, Number(e.target.value) || 0))
    if (income > 0) {
      const maxAllowed = Math.floor(((income - expenses) / income) * 100)
      if (v > maxAllowed) {
        v = Math.max(0, maxAllowed)
        flashClampWarning()
      }
    }
    setRate(v)
  }

  // ---- Sliders are a live PREVIEW of the profile baseline: they initialize
  // from the profile on every mount (so a refresh snaps back to the saved
  // values, or 0 when no profile exists) and never write back to it — the
  // Profile page is the single source of truth for the baseline. ----

  const liquidityGrade = useMemo(() => {
    const fund = Number(profile?.emergency_fund) || 0
    return computeLiquidityGrade(fund, expenses)
  }, [profile, expenses])


  // Up to 5 most recent sessions, defensively sorted newest-first
  const recent = useMemo(() => {
    const list = Array.isArray(history) ? [...history] : []
    list.sort((a, b) => (new Date(b?.created_at || 0).getTime() || 0) - (new Date(a?.created_at || 0).getTime() || 0))
    return list.slice(0, 5)
  }, [history])

  const verdictOf = (s) => {
    const sc = s?.enrichment?.sanggup_score?.score
    if (typeof sc !== 'number' || isNaN(sc)) return 'MODERATE'
    return sc >= 80 ? 'SAFE' : sc >= 50 ? 'MODERATE' : 'HIGH_RISK'
  }

  const fmtDateShort = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  }

  const focusHeroInput = () => {
    document.querySelector('input[type="text"][aria-label]')?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  })

  // Ring gauge colors follow the score band (red <40 · amber→gold 40–69 · green-gold ≥70)
  const arcColor = scoreColor(health.score)

  return (
    <div className="relative min-h-screen bg-zinc-950 pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Subtle warm radial glow behind hero */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[480px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% -10%, rgba(212,163,115,0.07), transparent 70%)' }}
      />

      <div className="relative max-w-[1200px] mx-auto flex flex-col gap-6">

        {/* ================= ROW 1 — HERO CARD ================= */}
        <motion.section {...fadeUp(0)} className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {t('dashboard.title')}{' '}<span className="text-amber-300">{t('dashboard.titleAccent')}</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-500">{t('dashboard.heroSubtitle')}</p>
          <div className="mt-8">
            <CommandCapsule />
          </div>
        </motion.section>

        {/* ================= ROW 2 ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[38fr_62fr] gap-6 items-stretch">

          {/* ---- FINANCIAL HEALTH ---- */}
          <motion.section {...fadeUp(0.08)} className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">{t('dashboard.healthTitle')}</h2>
              <div className="flex items-center gap-2">
                {isSimulation && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-golden/30 bg-golden/10 font-mono text-[8px] font-bold uppercase tracking-widest text-golden">
                    <span className="w-1 h-1 rounded-full bg-golden animate-pulse shrink-0" />
                    {t('dashboard.simulation')}
                  </span>
                )}
                <BarChart3 className="h-4 w-4 text-amber-400" strokeWidth={2} />
              </div>
            </header>

            {!showHealth ? (
              /* EMPTY STATE — dashed track, no fake numbers */
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="relative w-[180px] h-[180px]">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7" strokeLinecap="round" strokeDasharray="4 7" />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-3xl font-semibold text-zinc-600">—</span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-zinc-600 text-center max-w-[220px] leading-relaxed">{t('dashboard.overallEmpty')}</p>
              </div>
            ) : (
              <>
                {/* Ring gauge */}
                <div className="flex-1 flex flex-col items-center justify-center py-2">
                  <div className="relative w-[180px] h-[180px]">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                      <motion.circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={arcColor} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 52}
                        initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - health.score / 100) }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          filter: `drop-shadow(0 0 6px ${withAlpha(arcColor, 0.45)})`,
                          transition: 'stroke 0.4s ease, filter 0.4s ease',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <span className="text-4xl font-semibold text-white tabular-nums">{health.score}</span>
                        <span
                          className="block mt-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: arcColor, transition: 'color 0.4s ease' }}
                        >
                          {health.status === 'HEALTHY' ? t('dashboard.statusHealthy') : health.status === 'TIGHT' ? t('dashboard.statusTight') : t('dashboard.statusRisky')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Mini stat tiles */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-xl border border-white/[7%] bg-zinc-950/60 px-4 py-3.5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{t('dashboard.liquidity')}</p>
                <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">{liquidityGrade || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[7%] bg-zinc-950/60 px-4 py-3.5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{t('dashboard.debtToIncome')}</p>
                <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">{health.dtiPercent != null ? `${health.dtiPercent}%` : '—'}</p>
              </div>
            </div>
          </motion.section>

          {/* ---- BASELINE PARAMETERS ---- */}
          <motion.section {...fadeUp(0.14)} className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
            <header className="flex items-center justify-between mb-8">
              <h2 className="text-base font-semibold text-white">{t('dashboard.baselineTitle')}</h2>
              <Wallet className="h-4 w-4 text-amber-400" strokeWidth={2} />
            </header>

            <div className="flex-1 flex flex-col justify-center gap-9">
              {/* MONTHLY INCOME */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="sl-income" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{t('dashboard.monthlyIncome')}</label>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">{income > 0 ? formatCurrency(income, lang, 'IDR') : '—'}</span>
                </div>
                <input id="sl-income" type="range" min="0" max={INCOME_MAX} step={INCOME_STEP} value={income}
                  onChange={handleIncomeChange}
                  style={{ '--fill': `${(income / INCOME_MAX) * 100}%`, '--range-color': '#e8c47a', '--range-glow': 'rgba(232,196,122,0.55)' }} />
              </div>

              {/* MONTHLY EXPENSES */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="sl-expenses" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{t('dashboard.monthlyExpenses')}</label>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">{expenses > 0 ? formatCurrency(expenses, lang, 'IDR') : '—'}</span>
                </div>
                <input id="sl-expenses" type="range" min="0" max={EXPENSES_MAX} step={EXPENSES_STEP} value={expenses}
                  onChange={handleExpensesChange}
                  style={{ '--fill': `${(expenses / EXPENSES_MAX) * 100}%`, '--range-color': '#7a8ba3', '--range-glow': 'rgba(122,139,163,0.5)' }} />
              </div>

              {/* SAVINGS RATE */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="sl-rate" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{t('dashboard.savingsRate')}</label>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">{rate > 0 ? `${rate}%` : '—'}</span>
                </div>
                <input id="sl-rate" type="range" min="0" max={RATE_MAX} step={RATE_STEP} value={rate}
                  onChange={handleRateChange}
                  style={{ '--fill': `${(Math.min(rate, RATE_MAX) / RATE_MAX) * 100}%`, '--range-color': '#e8c47a', '--range-glow': 'rgba(232,196,122,0.55)' }} />
              </div>

              {/* Constraint warning — flashes only when a drag was clamped */}
              {warnVisible && (
                <motion.p
                  className="font-mono text-[10px] uppercase tracking-wide text-amber-400 flex items-center gap-2 -mt-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  {t('dashboard.warnExceeds')}
                </motion.p>
              )}
            </div>
          </motion.section>
        </div>

        {/* Health score transparency + actionable steps */}
        {showHealth && <HealthBreakdown health={health} />}

        {/* ================= ROW 3 ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* ---- GROWTH PROJECTION (asset timeline) ---- */}
          <GrowthProjection />

          {/* ---- RECENT ANALYSIS ---- */}
          <motion.section {...fadeUp(0.26)} className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{t('dashboard.recentTitle')}</h2>
              {recent.length > 0 && (
                <Link to="/analyze" className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300">
                  {t('dashboard.recentViewAll')}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </header>

            {recent.length === 0 ? (
              <button
                onClick={focusHeroInput}
                className="flex-1 min-h-[160px] rounded-xl border border-dashed border-white/[8%] grid place-items-center text-xs text-zinc-600 hover:text-zinc-400 hover:border-white/15 transition-colors"
              >
                {t('dashboard.recentEmptyNew')}
              </button>
            ) : (
              <ul className="flex-1 flex flex-col gap-2">
                {recent.map(s => {
                  const Icon = CAT_ICON[s?.scenario?.category] || Package
                  const price = Number(s?.financials?.base_price)
                  const verdict = verdictOf(s)
                  const badgeCls = verdict === 'SAFE' ? 'bg-sand/10 text-sand border-sand/25'
                    : verdict === 'MODERATE' ? 'bg-golden/10 text-golden border-golden/25'
                    : 'bg-terracotta/10 text-terracotta border-terracotta/25'
                  const badgeLabel = verdict === 'SAFE' ? t('analyze.filterSafe')
                    : verdict === 'HIGH_RISK' ? t('analyze.filterHighRisk')
                    : verdict === 'MODERATE' ? t('analyze.filterModerate')
                    : t('analyze.filterWarning')
                  return (
                    <li key={s.id}>
                      <Link
                        to={`/analyze/${s.id}`}
                        className="group flex items-center gap-4 rounded-xl border border-transparent hover:border-amber-400/25 hover:bg-white/[3%] px-3 py-3 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-950/70 border border-white/[7%] grid place-items-center shrink-0">
                          <Icon className="h-4.5 w-4.5 text-amber-400" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-amber-100">{s?.scenario?.item_name || '—'}</h3>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5 truncate">
                            {fmtDateShort(s?.created_at)} · {t(`dashboard.${CAT_KEY[s?.scenario?.category] || 'catOther'}`)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold text-white tabular-nums">
                            {Number.isFinite(price) ? formatCurrency(price, lang, s?.currency || 'IDR') : '—'}
                          </p>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border font-mono text-[8px] font-bold uppercase tracking-wider ${badgeCls}`}>
                            <span className={`w-1 h-1 rounded-full ${verdict === 'SAFE' ? 'bg-sand' : verdict === 'MODERATE' ? 'bg-golden' : 'bg-terracotta'}`} />
                            {badgeLabel}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  )
}
