import { Link } from 'react-router-dom'
import { useLanguage } from '../store/LanguageContext.jsx'
import PageTransition, { PageItem } from '../components/ui/PageTransition'
import { ArrowLeft } from 'lucide-react'

/**
 * LegalPage — reusable shell for /privacy & /terms.
 * Content comes from i18n: legal.<key>.{title, updated, sections:[{h, body:[...]}]}
 */
export default function LegalPage({ docKey }) {
  const { t } = useLanguage()
  const title = t(`legal.${docKey}.title`)
  const updated = t(`legal.${docKey}.updated`)
  const sections = t(`legal.${docKey}.sections`)
  const list = Array.isArray(sections) ? sections : []

  return (
    <PageTransition className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <PageItem>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-zinc-600 mt-2 mb-10">{updated}</p>
        </PageItem>

        <div className="space-y-8">
          {list.map((s, i) => (
            <PageItem key={i}>
              <h2 className="text-base font-semibold text-white mb-2">{s.h}</h2>
              <div className="space-y-2">
                {(Array.isArray(s.body) ? s.body : [s.body]).map((p, j) => (
                  <p key={j} className="text-sm text-zinc-400 leading-relaxed">{p}</p>
                ))}
              </div>
            </PageItem>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
