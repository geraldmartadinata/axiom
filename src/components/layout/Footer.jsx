import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, Mail, Instagram } from 'lucide-react'
import { useLanguage } from '../../store/LanguageContext.jsx'

const SOCIALS = [
  { key: 'github', href: 'https://github.com/geraldmartadinata', Icon: Github, external: true },
  { key: 'email', href: 'mailto:geraldbinus@gmail.com', Icon: Mail, external: false },
  { key: 'instagram', href: 'https://instagram.com/gerald404_', Icon: Instagram, external: true },
]

const PRODUCT_LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/analyze', labelKey: 'nav.analyze' },
  { to: '/profile', labelKey: 'nav.profile' },
]

const LEGAL_LINKS = [
  { to: '/privacy', labelKey: 'footer.privacy' },
  { to: '/terms', labelKey: 'footer.terms' },
  { to: '/contact', labelKey: 'footer.support' },
]

/**
 * Footer — dark, premium, three vertical areas: brand + link grid, thin
 * divider, bottom bar with dynamic copyright and social icon buttons.
 */
export default function Footer() {
  const { t } = useLanguage()

  return (
    <motion.footer
      className="relative mt-24 border-t border-white/10 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle dark radial glow for depth — stays dark */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 85% 0%, rgba(232,196,122,0.05), transparent 65%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        {/* ── Top: brand + link grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-10 sm:gap-8 mb-12">
          <div>
            <Link to="/" className="inline-block">
              <span className="font-display text-2xl font-bold text-white tracking-tight">Axiom</span>
            </Link>
            <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-xs">{t('footer.tagline')}</p>
            <p className="mt-4 text-sm text-zinc-500/80 leading-relaxed max-w-xs">{t('footer.about')}</p>
          </div>

          <nav aria-label={t('footer.product')}>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">{t('footer.product')}</h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    {t(l.labelKey)}
                    <span className="text-amber-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('footer.legalHelp')}>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">{t('footer.legalHelp')}</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    {t(l.labelKey)}
                    <span className="text-amber-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/[8%]" />

        {/* ── Bottom bar ── */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Axiom. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ key, href, Icon, external }) => (
              <a
                key={key}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={t(`contact.${key}.label`)}
                className="w-9 h-9 rounded-xl border border-white/[8%] bg-white/[3%] grid place-items-center text-zinc-500 hover:text-amber-300 hover:border-amber-400/30 hover:scale-105 transition-all duration-200"
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
