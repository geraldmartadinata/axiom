import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { computeOverallScore } from '../utils/overallScore'
import CommandCapsule from '../components/capsule/CommandCapsule'
import ScenarioCard from '../components/cards/ScenarioCard'
import ScoreGauge from '../components/score/ScoreGauge'
import { ArrowRight, Activity, ChevronDown, TrendingUp, BarChart3, Wallet, TrendingDown, Zap, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Dashboard — Redesigned with near-black background, champagne-gold accent,
 * numbered sections (hero, health, baseline, growth) and proper empty states.
 */
export default function Dashboard() {
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { t, lang } = useLanguage()

  const overall = useMemo(() => computeOverallScore(history, profile), [history, profile])
  const recent = useMemo(() => history.slice(0, 4), [history])

  const gaugeLabels = useMemo(() => ({
    perfect: t('gauge.perfect'),
    veryHealthy: t('gauge.veryHealthy'),
    healthy: t('gauge.healthy'),
    prettyGood: t('gauge.prettyGood'),
    intermediate: t('gauge.intermediate'),
    fair: t('gauge.fair'),
    poor: t('gauge.poor'),
    bad: t('gauge.bad'),
    veryBad: t('gauge.veryBad'),
    noPurchase: t('gauge.noPurchase'),
  }), [t])

  const getScoreLabel = (s) => {
    if (s === 0) return gaugeLabels.noPurchase
    if (s <= 10) return gaugeLabels.veryBad
    if (s <= 20) return gaugeLabels.bad
    if (s <= 33) return gaugeLabels.poor
    if (s <= 49) return gaugeLabels.fair
    if (s <= 66) return gaugeLabels.intermediate
    if (s <= 79) return gaugeLabels.good
    if (s <= 89) return gaugeLabels.prettyGood
    if (s <= 96) return gaugeLabels.healthy
    return gaugeLabels.perfect
  }

  const overallLabel = getScoreLabel(overall.score)

  // Baseline sliders — use profile defaults when available
  const defaultIncome = profile?.monthly_income || 15000000
  const defaultExpenses = profile?.monthly_expenses || 9000000
  const defaultSavings = profile?.savings_rate || 20

  const [sliders, setSliders] = useState({
    monthlyIncome: defaultIncome,
    monthlyExpenses: defaultExpenses,
    savingsRate: defaultSavings,
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  // Growth projection mock (will be dynamic later)
  const growthData = [0, 15, 32, 55, 78, 100, 124]

  // Format IDR with dots
  const formatIDR = (val) => {
    return `Rp ${Number(val).toLocaleString('id-ID')}`
  }

  const hasData = history.length > 0 && overall.score > 0

  return (
    <motion.div 
      className="min-h-screen bg-zinc-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ============ HERO SECTION ============ */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 text-center pt-24 pb-16">
        <motion.div 
          className="w-full max-w-3xl rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-12 shadow-2xl"
          variants={itemVariants}
        >
          <motion.h1 
            className="font-display text-4xl sm:text-5xl font-light text-white tracking-tight mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {t('dashboard.title')}
          </motion.h1>
          <motion.p 
            className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {t('dashboard.subtitle')}
          </motion.p>
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CommandCapsule />
          </motion.div>
          <motion.div 
            className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {t('dashboard.scrollHint')}
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============ BELOW FOLD ============ */}
      <motion.section 
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-6"
        variants={containerVariants}
      >
        {/* Row: Health Gauge + Recent Analyses */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          {/* Health Gauge Card */}
          <motion.div 
            className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
            variants={itemVariants}
          >
            <motion.div
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 grid place-items-center">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <motion.h2 
                className="font-display text-lg font-semibold text-white"
              >{t('dashboard.healthTitle')}</motion.h2>
            </motion.div>

            <motion.div
              className="flex flex-col items-center space-y-4 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {hasData ? (
                <>
                  <ScoreGauge
                    score={overall.score}
                    scoreLabel={overallLabel}
                    labels={gaugeLabels}
                    size={180}
                    showArcLabels
                  />
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="font-display text-2xl font-bold text-white">{overall.factors.liquidity?.grade || 'A-'}</p>
                      <p className="text-xs text-zinc-500">{t('dashboard.liquidity')}</p>
                    </div>
                    <div className="w-px h-8 bg-white/[10%]" />
                    <div>
                      <p className="font-display text-2xl font-bold text-white">{overall.factors.debt?.score || 28}%</p>
                      <p className="text-xs text-zinc-500">{t('dashboard.debtToIncome')}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <span className="text-4xl text-zinc-600 font-mono">—</span>
                  </div>
                  <p className="mt-4 text-sm text-zinc-500">{t('dashboard.overallEmpty')}</p>
                </div>
              )}

              {/* Factor mini-bars */}
              <motion.div 
                className="w-full mt-4 space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { key: 'debt', label: t('cards.overall.debtFactor'), score: hasData ? overall.factors.debt?.score || 72 : 0 },
                  { key: 'emergency', label: t('cards.overall.emergencyFactor'), score: hasData ? overall.factors.emergency?.score || 65 : 0 },
                  { key: 'savings', label: t('cards.overall.savingsFactor'), score: hasData ? overall.factors.savings?.score || 78 : 0 },
                  { key: 'dp', label: t('cards.overall.dpFactor'), score: hasData ? overall.factors.dp?.score || 85 : 0 },
                ].map(factor => {
                  const color = factor.score >= 80 ? '#d4a373' : factor.score >= 50 ? '#e9c46a' : '#e76f51'
                  return (
                    <motion.div key={factor.key} className="flex items-center gap-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 w-28 text-left truncate">{factor.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: hasData ? `${factor.score}%` : '0%' }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          style={{ background: color }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white w-10 text-right">{hasData ? `${factor.score}%` : '—'}</span>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Recent Analyses */}
          <motion.div 
            className="lg:col-span-2 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8"
            variants={itemVariants}
          >
            <motion.div 
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 grid place-items-center">
                  <BarChart3 className="h-5 w-5 text-amber-400" />
                </div>
                <motion.h2 
                  className="font-display text-lg font-semibold text-white"
                >{t('dashboard.recentTitle')}</motion.h2>
              </div>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                whileHover={{ x: 4 }}
              >
                {t('dashboard.recentViewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <AnimatePresence mode="wait">
              {recent.length === 0 ? (
                <motion.div
                  key="empty"
                  className="flex flex-col items-center justify-center py-16 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 grid place-items-center mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <BarChart3 className="h-6 w-6 text-amber-400" />
                  </motion.div>
                  <motion.p
                    className="text-sm text-zinc-400 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >{t('dashboard.recentEmpty')}</motion.p>
                  <motion.Link
                    to="/"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 text-sm font-bold shadow-[0_0_20px_rgba(212,163,115,0.25)] hover:-translate-y-px transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t('analyze.newAnalysis')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.Link>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  className="flex flex-col gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, staggerChildren: 0.08 }}
                >
                  {recent.map((s, i) => (
                    <motion.div key={s.id} variants={itemVariants}>
                      <ScenarioCard scenario={s} to={`/analyze/${s.id}`} compact lang={lang} listMode />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Row: Baseline Parameters + Growth Projection */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {/* Baseline Parameters */}
          <motion.div
            className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8"
            variants={itemVariants}
          >
            <motion.div
              className="flex items-center gap-2 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 grid place-items-center">
                <Wallet className="h-5 w-5 text-amber-400" />
              </div>
              <motion.h2 
                className="font-display text-lg font-semibold text-white"
              >{t('dashboard.baselineTitle')}</motion.h2>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {[
                { 
                  key: 'income', 
                  label: t('dashboard.monthlyIncome'), 
                  value: sliders.monthlyIncome, 
                  max: 50000000, 
                  step: 100000,
                  color: '#d4a373',
                  icon: Wallet,
                  format: (v) => formatIDR(v)
                },
                { 
                  key: 'expenses', 
                  label: t('dashboard.monthlyExpenses'), 
                  value: sliders.monthlyExpenses, 
                  max: 30000000, 
                  step: 100000,
                  color: '#e76f51',
                  icon: TrendingDown,
                  format: (v) => formatIDR(v)
                },
                { 
                  key: 'savings', 
                  label: t('dashboard.savingsRate'), 
                  value: sliders.savingsRate, 
                  max: 100, 
                  step: 1,
                  color: '#d4a373',
                  icon: Zap,
                  format: (v) => `${v}%`
                },
              ].map(({ key, label, value, max, step, color, icon: Icon, format }) => (
                <motion.div key={key} className="space-y-2" variants={itemVariants}>
                  <div className="flex items-center justify-between">
                    <motion.span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <Icon className="h-3 w-3" style={{ color }} />
                      {label}
                    </motion.span>
                    <motion.span className="font-mono text-sm font-bold text-white tabular-nums">{format(value)}</motion.span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => setSliders(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="w-full h-2 appearance-none bg-white/[0.06] rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${color} ${(value / max) * 100}%, transparent ${(value / max) * 100}%)`
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Growth Projection */}
          <motion.div
            className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden"
            variants={itemVariants}
          >
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 grid place-items-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <motion.h2 
                  className="font-display text-lg font-semibold text-white"
                >{t('dashboard.growthTitle')}</motion.h2>
              </div>
              <motion.button 
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[4%] transition-colors" 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-4 w-4" />
              </motion.button>
            </motion.div>

            <motion.div
              className="relative h-64"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 256" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#d4a373" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d4a373" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                <g stroke="white" strokeOpacity="0.04" strokeWidth="0.5">
                  {[0, 64, 128, 192, 256].map(y => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} />
                  ))}
                  {[0, 80, 160, 240, 320, 400].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="256" />
                  ))}
                </g>

                {/* Area fill */}
                <path
                  d={`M0,256 ${growthData.map((v, i) => `${(i / (growthData.length - 1)) * 400},${256 - (v / 124) * 200}`).join(' ')} 400,256 Z`}
                  fill="url(#growthGradient)"
                />

                {/* Solid line */}
                <path
                  d={`M${growthData.map((v, i) => `${(i / (growthData.length - 1)) * 400},${256 - (v / 124) * 200}`).join(' ')}`}
                  stroke="#d4a373"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dotted projection line */}
                <path
                  d="M285.7,56 400,132"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="6,6"
                  fill="none"
                  strokeOpacity="0.4"
                />
              </svg>

              {/* Estimated value overlay */}
              <motion.div
                className="absolute bottom-6 right-6 text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('dashboard.estValue')}</p>
                <p className="font-mono text-3xl font-bold text-amber-400">Rp 124.000.000</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Insight strip */}
        {profile && history.length > 0 && (
          <motion.div 
            className="rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.07] to-amber-400/[0.04] p-6 sm:p-8"
            variants={itemVariants}
            whileHover={{ scale: 1.005 }}
          >
            <motion.p 
              className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >{t('cards.insight.label')}</motion.p>
            <motion.p 
              className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {overall.totalMonthlyDebt > 0
                ? `${t('dashboard.insightLabel')}: ${formatIDR(Math.round(overall.totalMonthlyDebt))}/mo — ${t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)}`
                : t('dashboard.overallEmpty')}
            </motion.p>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  )
}