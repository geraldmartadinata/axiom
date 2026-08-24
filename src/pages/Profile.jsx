import { useLanguage } from '../store/LanguageContext.jsx'

export default function Profile() {
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <h1 className="font-display text-3xl font-light text-white tracking-tight mb-2">{t('profile.title')}</h1>
        <p className="text-zinc-500 text-base">{t('profile.subtitle')}</p>
      </div>

      {/* Why Axiom needs your profile - Stitch style card */}
      <div className="animate-slide-up stagger-1 rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sand/10 border border-sand/20 grid place-items-center shrink-0">
            <span className="text-sand font-bold text-lg">?</span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">{t('profile.why')}</h3>
            <p className="text-zinc-400 leading-relaxed">{t('profile.whyDesc')}</p>
          </div>
        </div>
      </div>

      {/* Profile Form - Stitch style card */}
      <div className="animate-slide-up stagger-2 rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8">
        <ProfileForm lang={lang} />
      </div>

      {/* Quick actions / insights */}
      <div className="animate-slide-up stagger-3 rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6">
        <h3 className="font-display text-lg font-semibold text-white mb-4">{t('profile.quickActions')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-left hover:border-white/20 hover:bg-zinc-900/80 transition-all">
            <p className="font-medium text-white">{t('profile.actions.viewAnalyses')}</p>
            <p className="text-xs text-zinc-500 mt-1">{t('profile.actions.viewAnalysesDesc')}</p>
          </button>
          <button className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-left hover:border-white/20 hover:bg-zinc-900/80 transition-all">
            <p className="font-medium text-white">{t('profile.actions.exportData')}</p>
            <p className="text-xs text-zinc-500 mt-1">{t('profile.actions.exportDataDesc')}</p>
          </button>
          <button className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-left hover:border-white/20 hover:bg-zinc-900/80 transition-all">
            <p className="font-medium text-white">{t('profile.actions.resetProfile')}</p>
            <p className="text-xs text-zinc-500 mt-1">{t('profile.actions.resetProfileDesc')}</p>
          </button>
          <button className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-left hover:border-white/20 hover:bg-zinc-900/80 transition-all">
            <p className="font-medium text-white">{t('profile.actions.settings')}</p>
            <p className="text-xs text-zinc-500 mt-1">{t('profile.actions.settingsDesc')}</p>
          </button>
        </div>
      </div>
    </div>
  )
}