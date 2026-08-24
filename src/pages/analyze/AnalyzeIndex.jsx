import { Link } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import ScenarioCard from '../../components/cards/ScenarioCard'
import { Plus, BarChart3, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * /analyze — session picker.
 * Lists all history sessions. If empty, shows a beautiful onboarding
 * empty state (NOT an inaccessible redirect).
 */
export default function AnalyzeIndex() {
  const history = useAxiomStore(s => s.history)
  const { t, lang } = useLanguage()

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
      className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="flex items-end justify-between mb-8"
        variants={itemVariants}
      >
        <div>
          <motion.h1 
            className="font-display text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >{t('analyze.indexTitle')}</motion.h1>
          <motion.p 
            className="text-sm text-zinc-500 mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >{t('analyze.indexSub')}</motion.p>
        </div>
        <motion.div
                  variants={itemVariants}
                >
                  <Link
                    to="/analyze/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-sand to-sand-light text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:shadow-[0_0_36px_rgba(212,163,115,0.45)] hover:-translate-y-px transition-all"
                  >
                    <Plus className="h-4 w-4 hover:scale-125 active:scale-90 transition-transform duration-200" />
                    {t('analyze.newAnalysis')}
                  </Link>
                </motion.div>
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          className="text-center py-24 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sand/20 to-sand/5 border border-sand/20 grid place-items-center shadow-inner"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <BarChart3 className="h-12 w-12 text-sand" strokeWidth={1.5} />
          </motion.div>
          <motion.h2
            className="font-display text-xl font-semibold text-white mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >{t('analyze.noHistory')}</motion.h2>
          <motion.p
            className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >{t('analyze.noHistorySub')}</motion.p>
          <motion.div
                  variants={itemVariants}
                >
                  <Link
                    to="/analyze/new"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-sand to-sand-light text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(212,163,115,0.3)] hover:-translate-y-px transition-all"
                  >
                    <Plus className="h-4 w-4 hover:scale-125 active:scale-90 transition-transform duration-200" />
                    {t('analyze.emptyStateCta')}
                  </Link>
                </motion.div>
          
          {/* Secondary examples hint */}
          <motion.div
            className="mt-12 pt-8 border-t border-white/[6%]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">{t('common.try') || 'Try:'}</p>
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
                    to="/analyze/new"
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
            <div key={s.id} variants={itemVariants}>
              <ScenarioCard
                scenario={s}
                to={`/analyze/${s.id}`}
                lang={lang}
              />
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
