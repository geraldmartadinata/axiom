import { useLanguage } from '../store/LanguageContext.jsx'
import ProfileForm from '../components/forms/ProfileForm'
import Card from '../components/ui/Card'

export default function Profile() {
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-1">{t('profile.title')}</h1>
        <p className="text-sm text-zinc-500">{t('profile.subtitle')}</p>
      </div>

      <Card className="animate-slide-up stagger-1">
        <div className="flex items-start gap-3">
          <div className="w-1 h-12 rounded-full bg-emerald-500" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">{t('profile.why')}</h3>
            <p className="text-sm text-zinc-400">{t('profile.whyDesc')}</p>
          </div>
        </div>
      </Card>

      <div className="animate-slide-up stagger-2 p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl">
        <ProfileForm lang={lang} />
      </div>
    </div>
  )
}