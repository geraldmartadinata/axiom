import { Link } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { computeOverallScore } from '../utils/overallScore'
import CommandCapsule from '../components/capsule/CommandCapsule'
import ScenarioCard from '../components/cards/ScenarioCard'
import ScoreGauge from '../components/score/ScoreGauge'
import { ArrowRight, Activity, ChevronDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Dashboard — Stitch-inspired overview with hero card and personalized score.
 */
export default function Dashboard() {
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { t, lang } = useLanguage()

  const overall = computeOverallScore(history, profile)
  const recent = history.slice(0, 4)

  // Build label map for ScoreGauge using i18n keys
  const gaugeLabels = {
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
  }

  // Determine score label based on overall score
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

  // Factor bar colors using new palette
  const factorColors = {
    high: '#d4a373',
    mid: '#e9c46a',
    low: '#e76f51',
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <motion.div 
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ============ HERO CARD (Stitch-inspired) ============ */}
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

        {/* Overall health + recent analyses */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          {/* Overall health card */}
          <motion.div 
            className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
            variants={itemVariants}
          >
            <motion.h2 
              className="font-display text-lg font-semibold text-white mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >{t('dashboard.overallTitle')}</motion.h2>
            <motion.p 
              className="text-xs text-zinc-500 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >{t('dashboard.overallSub')}</motion.p>

            <ScoreGauge
              score={overall.score}
              scoreLabel={overallLabel}
              labels={gaugeLabels}
              size={180}
              showArcLabels
            />

            <motion.div 
              className="mt-5 flex items-center gap-2 text-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-zinc-500">
                {overall.confirmedCount > 0
                  ? t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)
                  : t('cards.overall.noConfirmed')}
              </span>
            </motion.div>

            {/* factor mini-bars using natural palette */}
            <motion.div 
              className="w-full mt-6 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { label: t('cards.overall.debtFactor'), score: overall.factors.debt.score },
                { label: t('cards.overall.emergencyFactor'), score: overall.factors.emergency.score },
                { label: t('cards.overall.savingsFactor'), score: overall.factors.savings.score },
                { label: t('cards.overall.dpFactor'), score: overall.factors.dp.score },
              ].map(factor => {
                let bg = factorColors.low
                if (factor.score >= 80) bg = factorColors.high
                else if (factor.score >= 50) bg = factorColors.mid
                return (
                  <div key={factor.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 w-24 text-left truncate">{factor.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.score}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{ background: bg }}
                      />
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Recent analyses */}
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
              <div>
                <motion.h2 
                  className="font-display text-lg font-semibold text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >{t('dashboard.recentTitle')}</motion.h2>
                <motion.p 
                  className="text-xs text-zinc-500 mt-0.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >{t('dashboard.recentEmpty')}</motion.p>
              </div>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand hover:text-sand-light transition-colors"
                whileHover={{ x: 4 }}
              >
                {t('dashboard.recentViewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            {recent.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-16 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-sand/10 border border-sand/20 grid place-items-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Activity className="h-6 w-6 text-sand" />
                </motion.div>
                <motion.p 
                  className="text-sm text-zinc-400 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >{t('dashboard.recentEmpty')}</motion.p>
                <motion.Link
                  to="/analyze/new"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-sand to-sand-light text-zinc-950 text-sm font-bold shadow-[0_0_20px_rgba(212,163,115,0.25)] hover:-translate-y-px transition-all"
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
                className="flex flex-col gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, staggerChildren: 0.08 }}
              >
                {recent.map((s, i) => (
                  <motion.div key={s.id} variants={itemVariants}>
                    <ScenarioCard scenario={s} to={`/analyze/${s.id}`} compact lang={lang} listMode />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Insight strip */}
        {profile && (
          <motion.div 
            className="rounded-3xl border border-sand/15 bg-gradient-to-br from-sand/[0.07] to-sand/[0.04] p-6 sm:p-8"
            variants={itemVariants}
            whileHover={{ scale: 1.005 }}
          >
            <motion.p 
              className="text-[11px] font-bold uppercase tracking-widest text-sand mb-2"
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
                ? `${t('dashboard.insightLabel')}: Rp${Math.round(overall.totalMonthlyDebt).toLocaleString('id-ID')}/mo {t('common.perMonth')} — {t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)}`
                : t('dashboard.overallEmpty')}
            </motion.p>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  )
}
