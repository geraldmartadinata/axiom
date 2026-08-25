import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { computeHealthScore } from '../../utils/healthScore'
import { cn } from '../../utils/cn'
import { Sparkles, Activity, User, Menu, X, Mail } from 'lucide-react'
import Flag, { FlagID, FlagUS } from '../ui/Flag'

/**
 * Liquid-glass floating navbar.
 * - 3 main pages: Dashboard / Analyze / Profile
 * - Overall health score badge (from confirmed purchases + profile)
 * - Language toggle is SEPARATE, fixed top-right, with country flags
 * - Accent uses warm sand palette
 */
export default function DynamicIsland() {
  const { pathname } = useLocation()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { lang, t, toggleLang } = useLanguage()

  // Single source of truth — same util as Dashboard gauge & Analyze page.
  const health = computeHealthScore(profile, history)
  const score = health.score

  let scoreColor = 'text-zinc-500'
  if (score != null) {
    if (score < 40) scoreColor = 'text-terracotta'
    else if (score < 70) scoreColor = 'text-golden'
    else scoreColor = 'text-sand'
  }

  const links = [
    { to: '/', label: t('nav.home'), icon: Sparkles, end: true },
    { to: '/analyze', label: t('nav.analyze'), icon: Activity },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ]

  return (
    <>
      {/* SVG Filter definition for Liquid Glass Effect */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" in="noise" result="coloredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displacement" />
            <feGaussianBlur in="displacement" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Floating liquid-glass pill */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
        <div
          className="relative rounded-2xl px-3 py-2 flex items-center justify-between border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden"
        >
          {/* Liquid Glass Background Layer */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              backdropFilter: 'blur(16px) url(#liquid-glass)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 20px rgba(255,255,255,0.05)',
              zIndex: -1
            }}
          />

          {/* Brand + overall score */}
          <Link to="/" className="flex items-center gap-1.5 pl-2">
            <span className="font-display text-white font-bold text-lg tracking-tight">Axiom</span>
            <span
              className={cn(
                'font-display font-bold text-lg tracking-tight tabular-nums',
                scoreColor
              )}
              title={score != null ? 'Financial health score' : 'Complete your profile to compute your score'}
            >
              {score != null ? score : '—'}
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
                      ? 'bg-sand/10 text-sand'
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

      {/* Separate language toggle + burger menu — fixed top-right with flags */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="relative rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all overflow-hidden border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
          aria-label={lang === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
        >
          <div
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              backdropFilter: 'blur(16px) url(#liquid-glass)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 10px rgba(255,255,255,0.05)',
              zIndex: -1
            }}
          />
          {lang === 'en' ? <FlagUS /> : <FlagID />}
          <span className="uppercase tabular-nums">{lang}</span>
        </button>

        <BurgerMenu />
      </div>
    </>
  )
}

/** Burger dropdown: currency setting + contact link. Click-outside & Escape close it. */
function BurgerMenu() {
  const { t } = useLanguage()
  const currency = useAxiomStore(s => s.currency)
  const setCurrency = useAxiomStore(s => s.setCurrency)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('menu.label')}
        className="relative w-9 h-9 rounded-full grid place-items-center text-zinc-300 hover:text-white transition-all border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            backdropFilter: 'blur(16px) url(#liquid-glass)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 10px rgba(255,255,255,0.05)',
            zIndex: -1
          }}
        />
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-3 space-y-3"
        >
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">{t('menu.currency')}</p>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t('menu.currency')}>
              {['IDR', 'USD'].map(code => (
                <button
                  key={code}
                  role="radio"
                  aria-checked={currency === code}
                  onClick={() => setCurrency(code)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold tracking-wider transition-all border',
                    currency === code
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                      : 'border-white/[8%] text-zinc-400 hover:text-white hover:border-white/20'
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-600 leading-snug">{t('menu.currencyHint')}</p>
          </div>

          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[5%] transition-all"
          >
            <Mail className="h-3.5 w-3.5 text-amber-400" />
            {t('menu.contact')}
          </Link>
        </div>
      )}
    </div>
  )
}
