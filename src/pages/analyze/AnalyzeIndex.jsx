import { Link } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import ScenarioCard from '../../components/cards/ScenarioCard'
import { Plus } from 'lucide-react'

/**
 * /analyze — session picker.
 * Lists all history sessions. If empty, shows a friendly onboarding
 * empty state (NOT an inaccessible redirect).
 */
export default function AnalyzeIndex() {
  const history = useAxiomStore(s => s.history)
  const { t, lang } = useLanguage()

  return (
    <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">{t('analyze.indexTitle')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('analyze.indexSub')}</p>
        </div>
        <Link
          to="/analyze/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:shadow-[0_0_36px_rgba(34,211,238,0.45)] hover:-translate-y-px transition-all"
        >
          <Plus className="h-4 w-4" />
          {t('analyze.newAnalysis')}
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border border-white/[6%] bg-white/[0.02]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 border border-cyan-400/20 grid place-items-center">
            <Plus className="h-7 w-7 text-cyan-400" />
          </div>
          <h2 className="font-display text-xl font-semibold text-white mb-2">{t('analyze.noHistory')}</h2>
          <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">{t('analyze.noHistorySub')}</p>
          <Link
            to="/analyze/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-zinc-950 text-sm font-bold shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:-translate-y-px transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('analyze.emptyStateCta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((s, i) => (
            <div key={s.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <ScenarioCard
                scenario={s}
                to={`/analyze/${s.id}`}
                lang={lang}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
