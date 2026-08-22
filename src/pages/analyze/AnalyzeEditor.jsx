import { useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import CommandCapsule from '../../components/capsule/CommandCapsule'
import { ArrowLeft } from 'lucide-react'

/**
 * /analyze/new — blank analyzer workspace.
 * After a successful analysis, navigates to the session's own page.
 */
export default function AnalyzeEditor() {
  const navigate = useNavigate()
  const currentScenario = useAxiomStore(s => s.currentScenario)
  const { t } = useLanguage()

  // If a fresh analysis already exists, jump straight to its session page
  useEffect(() => {
    if (currentScenario?.id) {
      navigate(`/analyze/${currentScenario.id}`, { replace: true })
    }
  }, [currentScenario, navigate])

  return (
    <div className="pt-28 pb-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <Link
        to="/analyze"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('analyze.backToAnalyses')}
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
        {t('dashboard.title')} <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{t('dashboard.titleAccent')}</span>
      </h1>
      <p className="text-zinc-500 text-sm sm:text-base mb-10 max-w-lg mx-auto leading-relaxed">
        {t('dashboard.subtitle')}
      </p>

      <CommandCapsule autoFocus />
    </div>
  )
}
