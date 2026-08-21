import { useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import ScenarioCard from '../components/cards/ScenarioCard'
import Button from '../components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function History() {
  const navigate = useNavigate()
  const { history, loadFromHistory, deleteFromHistory } = useAxiomStore()
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-1">{t('history.title')}</h1>
        <p className="text-sm text-zinc-500">{t('history.empty').replace('No scenarios yet. Analyze your first purchase to see it here.', history.length + ' scenario' + (history.length !== 1 ? 's' : '') + ' analyzed')}</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-zinc-400 mb-2">{t('history.empty')}</p>
          <p className="text-sm text-zinc-600 mb-8">{t('history.empty')}</p>
          <Link to="/">
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4" />
              {t('nav.home')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((s, i) => (
            <div key={s.id} className={'animate-slide-up stagger-' + Math.min(i + 1, 6)}>
              <ScenarioCard
                scenario={s}
                onClick={() => { loadFromHistory(s.id); navigate('/analyze') }}
                onDelete={() => deleteFromHistory(s.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}