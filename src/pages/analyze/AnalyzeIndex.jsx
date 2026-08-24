import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, SlidersHorizontal, ArrowLeft, ArrowRight, RefreshCw,
  Car, Smartphone, Home, Package, BarChart3, TrendingUp,
} from 'lucide-react'

/**
 * /analyze — Two states driven purely by the session store:
 *   STATE A (zero sessions): "Reality Check" empty state
 *   STATE B (≥1 session):    "Intelligence Logs" history hub
 * Clicking any item → /analyze/:sessionId (results view, unchanged).
 */

const PAGE_SIZE = 6

// ---------- helpers ----------

/** ISO date "YYYY-MM-DD" for meta rows; returns '—' on bad input. */
function isoDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Map a session to a normalized verdict tier. Unknown → WARNING. */
function getVerdict(session) {
  const score = session?.enrichment?.sanggup_score?.score
  if (typeof score !== 'number' || isNaN(score)) return 'WARNING'
  if (score >= 80) return 'SAFE'
  if (score >= 50) return 'WARNING'
  return 'HIGH_RISK'
}

const CATEGORY_ICONS = { vehicle: Car, tech: Smartphone, property: Home }

function CategoryIcon({ category, className }) {
  const Icon = CATEGORY_ICONS[category] || Package
  return <Icon className={className} strokeWidth={1.75} />
}

const VERDICT_BADGE = {
  SAFE: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  WARNING: 'bg-golden/10 text-golden border-golden/30',
  HIGH_RISK: 'bg-terracotta/10 text-terracotta border-terracotta/30',
}

const VERDICT_DOT = {
  SAFE: 'bg-amber-400',
  WARNING: 'bg-golden',
  HIGH_RISK: 'bg-terracotta',
}

export default function AnalyzeIndex() {
  const history = useAxiomStore(s => s.history)
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  // ----- STATE B local state -----
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [verdictFilter, setVerdictFilter] = useState('ALL')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false)

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    const close = () => setFilterOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [filterOpen])

  // Reset pagination whenever the query/filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, verdictFilter])

  /** Most recent first, defensively sorted. */
  const sorted = useMemo(() => {
    return [...(history || [])].sort((a, b) => {
      const ta = new Date(a?.created_at || 0).getTime() || 0
      const tb = new Date(b?.created_at || 0).getTime() || 0
      return tb - ta
    })
  }, [history])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter(s => {
      if (verdictFilter !== 'ALL' && getVerdict(s) !== verdictFilter) return false
      if (!q) return true
      const name = String(s?.scenario?.item_name ?? '').toLowerCase()
      const date = isoDate(s?.created_at)
      return (
        name.includes(q) ||
        date.includes(q) ||
        verdictLabelKey(getVerdict(s)).toLowerCase().includes(q)
      )
    })
  }, [sorted, query, verdictFilter, lang]) // eslint-disable-line

  function verdictLabelKey(v) {
    return v === 'SAFE' ? t('analyze.filterSafe')
      : v === 'WARNING' ? t('analyze.filterWarning')
      : t('analyze.filterHighRisk')
  }

  const visible = filtered.slice(0, visibleCount)
  const featured = sorted[0] // most recent session, independent of filters

  // Featured panel derived data
  const fScore = featured?.enrichment?.sanggup_score?.score
  const fComplete = typeof fScore === 'number' && !isNaN(fScore)
  // Completeness from real fields only — never fabricated
  const fFieldsPresent = [
    Boolean(featured?.scenario?.item_name),
    Number.isFinite(Number(featured?.financials?.base_price)),
    Number.isFinite(Number(featured?.financials?.term_months)),
    Number.isFinite(Number(featured?.financials?.calculated_monthly_installment)),
    fComplete,
  ].filter(Boolean).length
  const fProgress = Math.round((fFieldsPresent / 5) * 100)

  const fImageQuery = useMemo(() => {
    if (!featured?.scenario?.item_name) return ''
    const cat = featured?.scenario?.category
    const kw = cat === 'vehicle' ? 'car' : cat === 'property' ? 'house' : cat === 'tech' ? 'gadget' : ''
    return encodeURIComponent(`${featured.scenario.item_name} ${kw}`.trim())
  }, [featured])

  const fRelTime = useMemo(() => relativeTime(featured?.created_at, lang, t), [featured, lang, t])

  const hasSessions = history && history.length > 0

  // ============================================================
  // STATE A — EMPTY STATE
  // ============================================================
  if (!hasSessions) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
        <motion.div
          className="w-full max-w-xl rounded-3xl border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl px-8 py-16 sm:px-12 sm:py-20 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hero icon composition */}
          <motion.div
            className="relative w-fit mx-auto mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 16 }}
          >
            {/* Main icon inside soft radial gold glow */}
            <div
              className="w-[72px] h-[72px] rounded-full grid place-items-center bg-zinc-900 border border-amber-400/25"
              style={{ boxShadow: '0 0 48px rgba(212,163,115,0.22), 0 0 120px rgba(212,163,115,0.08)' }}
            >
              <Search className="h-9 w-9 text-amber-400" strokeWidth={1.5} />
            </div>
            {/* Satellite chips */}
            <motion.div
              className="absolute -top-3 -right-7 w-9 h-9 rounded-full bg-zinc-900 border border-white/10 grid place-items-center"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <TrendingUp className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-8 w-9 h-9 rounded-full bg-zinc-900 border border-white/10 grid place-items-center"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <BarChart3 className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {t('analyze.emptyTitle')}
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base text-zinc-500 leading-relaxed max-w-md mx-auto mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {t('analyze.emptySub')}
          </motion.p>

          <motion.button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:shadow-[0_0_40px_rgba(212,163,115,0.45)] hover:-translate-y-px transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('analyze.returnDashboard')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ============================================================
  // STATE B — INTELLIGENCE LOGS HUB
  // ============================================================
  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ---------------- MAIN COLUMN (~65%) ---------------- */}
          <div className="lg:col-span-2 min-w-0 order-2 lg:order-1">

            {/* Page header */}
            <motion.div
              className="relative pl-6 border-l-2 border-amber-400/60 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="font-mono text-xs font-bold text-amber-400 tracking-widest">01</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t('analyze.hubTitle')}</h1>
              <p className="text-sm text-zinc-500 mt-1 max-w-lg">{t('analyze.hubSub')}</p>
            </motion.div>

            {/* Search + filter bar */}
            <motion.div
              className="flex items-stretch gap-0 rounded-2xl border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl overflow-visible mb-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pl-5 pr-4 py-3.5">
                <Search className="h-4 w-4 text-zinc-600 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('analyze.searchPlaceholder')}
                  className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
              <div className="w-px bg-white/[7%] self-stretch my-3" aria-hidden="true" />
              <button
                onClick={(e) => { e.stopPropagation(); setFilterOpen(o => !o) }}
                className={`flex items-center gap-2 px-5 shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${filterOpen || verdictFilter !== 'ALL' ? 'text-amber-400' : 'text-zinc-500 hover:text-white'}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('analyze.filter')}
                {verdictFilter !== 'ALL' && <span className={`w-1.5 h-1.5 rounded-full ${VERDICT_DOT[verdictFilter]}`} />}
              </button>

              {/* Filter dropdown */}
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 z-30 w-44 rounded-2xl border border-white/[7%] bg-zinc-900 shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {['ALL', 'SAFE', 'WARNING', 'HIGH_RISK'].map(v => (
                      <button
                        key={v}
                        onClick={() => { setVerdictFilter(v); setFilterOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider transition-colors ${verdictFilter === v ? 'bg-amber-400/10 text-amber-300' : 'text-zinc-400 hover:bg-white/[4%] hover:text-white'}`}
                      >
                        {v !== 'ALL' && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${VERDICT_DOT[v]}`} />}
                        {v === 'ALL' ? t('analyze.filterAll') : verdictLabelKey(v)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Session list */}
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[8%] py-14 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">—</p>
                <p className="text-sm text-zinc-500 mt-2">{t('analyze.noResults')}</p>
              </div>
            ) : (
              <motion.div
                className="flex flex-col gap-3"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
              >
                {visible.map(s => {
                  const verdict = getVerdict(s)
                  const name = s?.scenario?.item_name || '—'
                  const price = Number(s?.financials?.base_price)
                  const currency = s?.currency || 'IDR'
                  return (
                    <motion.div key={s.id} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                      <Link
                        to={`/analyze/${s.id}`}
                        className="block rounded-2xl border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-4 sm:p-5 hover:border-amber-400/35 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(212,163,115,0.08)] transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Category icon */}
                          <div className="w-11 h-11 rounded-xl bg-zinc-950/70 border border-white/[7%] grid place-items-center shrink-0">
                            <CategoryIcon category={s?.scenario?.category} className="h-5 w-5 text-amber-400" />
                          </div>

                          {/* Name + meta */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-amber-100">{name}</h3>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mt-1 truncate">
                              {isoDate(s?.created_at)} · {String(s?.scenario?.category ?? '—').toUpperCase()}
                            </p>
                          </div>

                          {/* Assessed value */}
                          <div className="hidden sm:block text-right shrink-0">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{t('analyze.assessedValue')}</p>
                            <p className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                              {Number.isFinite(price) ? formatCurrency(price, lang, currency) : '—'}
                            </p>
                          </div>

                          {/* Verdict badge */}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 ${VERDICT_BADGE[verdict]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${VERDICT_DOT[verdict]}`} />
                            <span className="hidden md:inline">{verdictLabelKey(verdict)}</span>
                            <span className="md:hidden">{verdict === 'HIGH_RISK' ? '!' : verdict === 'SAFE' ? '✓' : '~'}</span>
                          </span>
                        </div>

                        {/* Mobile assessed value */}
                        <div className="sm:hidden mt-3 pt-3 border-t border-white/[5%] flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{t('analyze.assessedValue')}</span>
                          <span className="font-mono text-sm font-bold text-white tabular-nums">
                            {Number.isFinite(price) ? formatCurrency(price, lang, currency) : '—'}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* Load more */}
            {filtered.length > visible.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-zinc-300 font-mono text-[11px] font-bold uppercase tracking-widest hover:border-amber-400/50 hover:text-amber-300 hover:bg-amber-400/5 transition-all"
                >
                  {t('analyze.loadMore')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ---------------- FEATURED PANEL (~35%) ---------------- */}
          {featured && (
            <motion.aside
              className="lg:sticky lg:top-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              {/* Eyebrow */}
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 mb-3 lg:justify-end">
                <RefreshCw className="h-3 w-3 text-amber-400" />
                {t('analyze.resumeLatest')}
              </p>

              <div className="rounded-2xl border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl overflow-hidden">
                {/* Image with mandatory icon fallback — never a broken image */}
                <div className="relative aspect-video">
                  {!featuredImageFailed && fImageQuery ? (
                    <img
                      src={`https://loremflickr.com/640/360/${fImageQuery}?lock=${encodeURIComponent(featured.id || '')}`}
                      alt={featured?.scenario?.item_name || ''}
                      loading="lazy"
                      onError={() => setFeaturedImageFailed(true)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  {/* Fallback layer sits under the img so it shows instantly if img fails/absent */}
                  {(featuredImageFailed || !fImageQuery) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 grid place-items-center">
                      <CategoryIcon
                        category={featured?.scenario?.category}
                        className="h-12 w-12 text-amber-400/80"
                      />
                    </div>
                  )}
                  {/* Bottom dark gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none" />

                  {/* In Progress pill ONLY when unfinished (no verdict yet) */}
                  {!fComplete && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur border border-golden/40 text-golden font-mono text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-golden animate-pulse" />
                      {t('analyze.inProgress')}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {featured?.scenario?.item_name || '—'}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/70 border border-white/[7%] font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                      <CategoryIcon category={featured?.scenario?.category} className="h-3 w-3 text-amber-400" />
                      {String(featured?.scenario?.category ?? '—').toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">{fRelTime}</span>
                  </div>

                  {/* Progress row */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        {fComplete ? t('analyze.complete') : t('analyze.dataCollection')}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-white tabular-nums">{fProgress}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[7%] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${fProgress}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        style={{ boxShadow: '0 0 8px rgba(212,163,115,0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Resume CTA */}
                  <button
                    onClick={() => navigate(`/analyze/${featured.id}`)}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-zinc-950 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:shadow-[0_0_40px_rgba(212,163,115,0.45)] hover:-translate-y-px transition-all"
                  >
                    {t('analyze.resumeButton')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </div>
      </div>
    </div>
  )
}

/** Relative time helper. Returns localized "x min/hr/day ago" or the ISO date as fallback. */
function relativeTime(isoString, lang, t) {
  if (!isoString) return '—'
  const then = new Date(isoString).getTime()
  if (isNaN(then)) return '—'
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t('analyze.justNow')
  if (mins < 60) return t('analyze.minutesAgo').replace('{n}', mins)
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('analyze.hoursAgo').replace('{n}', hours)
  const days = Math.floor(hours / 24)
  if (days < 30) return t('analyze.daysAgo').replace('{n}', days)
  return isoDate(isoString)
}
