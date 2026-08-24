import { Link } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import ScenarioCard from '../../components/cards/ScenarioCard'
import { Plus, BarChart3, FileText, CheckCircle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * /analyze — Session history list (Mode A).
 * Shows all sessions with a stats strip, numbered header, and empty state.
 */
export default function AnalyzeIndex() {
  const history = useAxiomStore(s => s.history)
  const { t, lang } = useLanguage()

  const totalSessions = history.length
  const confirmed = history.filter(s => s.status === 'CONFIRMED').length
  const avgScore = totalSessions > 0
    ? Math.round(history.reduce((acc, s) => acc + (s.enrichment?.sanggup_score?.score || 0), 0) / totalSessions)
    : 0

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
      className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with count and New Analysis button */}
        <motion.div
          className="flex items-end justify-between mb-8 flex-wrap gap-4"
          variants={itemVariants}
        >
          <div className="relative pl-6 border-l-2 border-amber-400/60">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">01</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t('analyze.indexTitle')}</h1>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{t('analyze.indexSub')}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:shadow-[0_0_36px_rgba(212,163,115,0.45)] hover:-translate-y-px transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('analyze.newAnalysis')}
          </Link>
        </motion.div>

        {/* Stats Strip */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          variants={itemVariants}
        >
          {[
            { label: t('analyze.totalSessions'), value: totalSessions, icon: FileText, color: 'text-amber-400' },
            { label: t('analyze.confirmedSessions'), value: confirmed, icon: CheckCircle, color: 'text-emerald-400' },
            { label: t('analyze.averageScore'), value: totalSessions > 0 ? `${avgScore}%` : '—', icon: TrendingUp, color: 'text-amber-400' },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-white">{stat.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Session list or empty state */}
        {totalSessions === 0 ? (
          <motion.div
            className="text-center py-24 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl"
            variants={itemVariants}
          >
            <motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-amber-400/10 border border-amber-400/20 grid place-items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            >
              <BarChart3 className="h-12 w-12 text-amber-400" strokeWidth={1.5} />
            </motion.div>
            <motion.h2
              className="text-xl font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >{t('analyze.noHistory')}</motion.h2>
            <motion.p
              className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >{t('analyze.noHistorySub')}</motion.p>
            <motion.div
              variants={itemVariants}
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:-translate-y-px transition-all"
              >
                <Plus className="h-4 w-4" />
                {t('analyze.emptyStateCta')}
              </Link>
            </motion.div>
            <motion.div
              className="mt-12 pt-8 border-t border-white/[6%]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">{t('common.try')}</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {['dashboard.example1', 'dashboard.example2', 'dashboard.example3'].map((exKey, idx) => (
                  <motion.div
                    key={exKey}
                    variants={itemVariants}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + idx * 0.05 }}
                  >
                    <Link
                      to="/"
                      className="px-3 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all duration-200 whitespace-nowrap"
                    >
                      {t(exKey)}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            {history.map((s, i) => (
              <motion.div key={s.id} variants={itemVariants}>
                <ScenarioCard
                  scenario={s}
                  to={`/analyze/${s.id}`}
                  lang={lang}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}