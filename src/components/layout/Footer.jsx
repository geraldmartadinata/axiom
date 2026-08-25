import { Link } from 'react-router-dom'
import { useLanguage } from '../../store/LanguageContext.jsx'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-24 border-t border-white/[6%] bg-zinc-950 pt-16 pb-8 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-light text-white tracking-tight mb-2">Axiom</h2>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">{t('footer.tagline')}</p>
        <div className="flex justify-center gap-6 text-sm text-zinc-400 mb-8">
          <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
          <Link to="/contact" className="hover:text-white transition-colors">{t('footer.support')}</Link>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Axiom. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
