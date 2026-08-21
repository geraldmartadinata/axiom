import { Link, useLocation } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { cn } from '../../utils/cn'
import { Activity, BarChart3, History, User, Sparkles, Globe } from 'lucide-react'

export default function DynamicIsland() {
  const { pathname } = useLocation()
  const isAnalyzing = useAxiomStore(s => s.isAnalyzing)
  const scenario = useAxiomStore(s => s.currentScenario)
  const { lang, t, toggleLang } = useLanguage()

  const links = [
    { to: '/', label: t('nav.home'), icon: Sparkles },
    { to: '/analyze', label: t('nav.analyze'), icon: Activity },
    { to: '/projections', label: t('nav.projections'), icon: BarChart3 },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ]

  const score = scenario?.enrichment?.sanggup_score
  const scoreColor = score ? (score.score >= 80 ? 'text-emerald-400' : score.score >= 50 ? 'text-amber-400' : 'text-red-400') : ''

  return (
    <nav className="sticky top-4 z-50 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-2xl border border-white/[6%] rounded-full px-3 py-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 pl-2">
            <span className="text-white font-bold text-lg tracking-tight">Axiom</span>
            {isAnalyzing && <span className="text-zinc-500 text-sm animate-fade-in">{t('dashboard.analyzingButton')}</span>}
            {!isAnalyzing && score && (
              <span className={cn('text-sm font-bold', scoreColor)}>{score.score}</span>
            )}
          </Link>

          {/* Links + Language Switcher */}
          <div className="flex items-center gap-1">
            {links.map(link => {
              const Icon = link.icon
              const active = pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
              aria-label={lang === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
