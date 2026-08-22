import { Link, useLocation } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { computeOverallScore } from '../../utils/overallScore'
import { cn } from '../../utils/cn'
import { Sparkles, Activity, User } from 'lucide-react'
import Flag, { FlagID, FlagUS } from '../ui/Flag'

/**
 * Liquid-glass floating navbar.
 * - 3 main pages: Dashboard / Analyze / Profile
 * - Overall health score badge (from confirmed purchases + profile)
 * - Language toggle is SEPARATE, fixed top-right, with country flags
 */
export default function DynamicIsland() {
  const { pathname } = useLocation()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { lang, t, toggleLang } = useLanguage()

  const overall = computeOverallScore(history, profile)
  const scoreColor =
    overall.status === 'SAFE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
    overall.status === 'WARNING' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
    'bg-red-500/15 text-red-400 border-red-500/25'

  const links = [
    { to: '/', label: t('nav.home'), icon: Sparkles, end: true },
    { to: '/analyze', label: t('nav.analyze'), icon: Activity },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ]

  return (
    <>
      {/* Floating liquid-glass pill */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
        <div className="glass rounded-2xl px-3 py-2 shadow-2xl shadow-black/40 flex items-center justify-between">
          {/* Brand + overall score */}
          <Link to="/" className="flex items-center gap-2.5 pl-2">
            <span className="text-white font-bold text-lg tracking-tight">Axiom</span>
            <span
              className={cn(
                'ml-1 px-2 py-0.5 rounded-full border text-[11px] font-bold tabular-nums',
                scoreColor
              )}
              title={overall.confirmedCount > 0
                ? `${overall.confirmedCount} confirmed purchase(s)`
                : 'No confirmed purchases yet'}
            >
              {overall.confirmedCount > 0 ? overall.score : '0'}
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            {links.map(link => {
              const Icon = link.icon
              const active = link.end ? pathname === link.to : pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    active
                      ? 'bg-cyan-400/10 text-cyan-300'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Separate language toggle — fixed top-right with flags */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleLang}
          className="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all shadow-lg shadow-black/30"
          aria-label={lang === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
        >
          {lang === 'en' ? <FlagUS /> : <FlagID />}
          <span className="uppercase tabular-nums">{lang}</span>
        </button>
      </div>
    </>
  )
}
