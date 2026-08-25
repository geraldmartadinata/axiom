import { Github, Mail, Instagram, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../store/LanguageContext.jsx'
import PageTransition, { PageItem } from '../components/ui/PageTransition'
import { Link } from 'react-router-dom'

const LINKS = [
  { key: 'github', href: 'https://github.com/geraldmartadinata', Icon: Github },
  { key: 'email', href: 'mailto:geraldbinus@gmail.com', Icon: Mail },
  { key: 'instagram', href: 'https://instagram.com/gerald404_', Icon: Instagram },
]

export default function Contact() {
  const { t } = useLanguage()

  return (
    <PageTransition className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <PageItem>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('contact.title')}</h1>
          <p className="text-sm text-zinc-500 mt-2 mb-10">{t('contact.sub')}</p>
        </PageItem>

        <div className="space-y-3">
          {LINKS.map(({ key, href, Icon }) => (
            <PageItem key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-white/[6%] bg-zinc-900/60 px-5 py-4 hover:border-amber-400/25 hover:bg-white/[3%] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 grid place-items-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-amber-400" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{t(`contact.${key}.label`)}</p>
                  <p className="text-xs text-zinc-500 truncate">{t(`contact.${key}.value`)}</p>
                </div>
              </a>
            </PageItem>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
