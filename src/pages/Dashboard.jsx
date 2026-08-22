import { useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { motion } from 'framer-motion'
import CommandCapsule from '../components/capsule/CommandCapsule'
import ScenarioCard from '../components/cards/ScenarioCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FinancialHealthWidget from '../components/dashboard/FinancialHealthWidget'
import GrowthChartWidget from '../components/dashboard/GrowthChartWidget'
import { Link } from 'react-router-dom'
import { UserCircle } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { history, profile, isAnalyzing, loadFromHistory } = useAxiomStore()
  const { t } = useLanguage()

  const recentScenarios = history.slice(0, 5)
  const hasProfile = profile && profile.monthly_income > 0

  return (
    <div className="relative">
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-white mb-4">{t('dashboard.analyzingButton')}</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse-glow" />
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse-glow" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center py-16"
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
          {t('dashboard.title')}
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-12">
          {t('dashboard.subtitle')}
        </p>
        <CommandCapsule />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FinancialHealthWidget />
          <GrowthChartWidget />
        </div>
      </motion.div>

      {/* Profile Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16"
      >
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-white">{t('profile.title')}</p>
              <p className="text-xs text-zinc-500">
                {hasProfile ? 'Complete — scores are accurate' : 'Incomplete — scores are preliminary'}
              </p>
            </div>
          </div>
          <Link to="/profile">
            <Button variant="secondary" size="sm">
              {hasProfile ? 'View' : t('analyze.completeProfile')}
            </Button>
          </Link>
        </Card>
      </motion.div>

      {/* Recent Scenarios or Empty State */}
      {recentScenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            {t('dashboard.recentScenarios')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentScenarios.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onClick={() => { loadFromHistory(s.id); navigate('/analyze') }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}