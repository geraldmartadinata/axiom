import { Link } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { computeOverallScore } from '../utils/overallScore'
import CommandCapsule from '../components/capsule/CommandCapsule'
import ScenarioCard from '../components/cards/ScenarioCard'
import ScoreGauge from '../components/score/ScoreGauge'
import { ArrowRight, Activity, ChevronDown } from 'lucide-react'

/**
 * Dashboard — the overview page.
 * Above fold: hero title + subtitle + neon analyzer input.
 * Below fold: overall health score (from confirmed purchases + profile),
 * recent analyses, and an insight strip.
 */
export default function Dashboard() {
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { t, lang } = useLanguage()

  const overall = computeOverallScore(history, profile)
  const recent = history.slice(0, 4)

  const scoreColor =
    overall.status === 'SAFE' ? 'text-emerald-400' :
    overall.status === 'WARNING' ? 'text-amber-400' : 'text-red-400'

  const overallLabel = t(`gauge.${overall.status === 'SAFE' ? 'safe' : overall.status === 'WARNING' ? 'caution' : 'danger'}`)

  return (
    <div>
      {/* ============ HERO (above fold) ============ */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 text-center pt-24 pb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4 animate-slide-up">
          {t('dashboard.title')} {t('dashboard.titleAccent')}
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10 animate-slide-up stagger-2">
          {t('dashboard.subtitle')}
        </p>

        <div className="w-full animate-slide-up stagger-3">
          <CommandCapsule />
        </div>

        <div className="mt-10 flex items-center gap-2 text-xs text-zinc-600 animate-floaty">
          {t('dashboard.scrollHint')}
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </section>

      {/* ============ BELOW FOLD ============ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-6">

        {/* Overall health + recent analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall health card */}
          <div className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center animate-slide-up">
            <h2 className="font-display text-lg font-semibold text-white mb-1">{t('dashboard.overallTitle')}</h2>
            <p className="text-xs text-zinc-500 mb-6">{t('dashboard.overallSub')}</p>

            <ScoreGauge
              score={overall.score}
              scoreLabel={overallLabel}
              size={180}
            />

            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="text-zinc-500">
                {overall.confirmedCount > 0
                  ? t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)
                  : t('cards.overall.noConfirmed')}
              </span>
            </div>

            {/* factor mini-bars */}
            <div className="w-full mt-6 space-y-2">
              {[
                { label: t('cards.overall.debtFactor'), score: overall.factors.debt.score },
                { label: t('cards.overall.emergencyFactor'), score: overall.factors.emergency.score },
                { label: t('cards.overall.savingsFactor'), score: overall.factors.savings.score },
              ].map(factor => (
                <div key={factor.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 w-24 text-left truncate">{factor.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${factor.score}%`,
                        background: factor.score >= 80 ? '#34d399' : factor.score >= 50 ? '#fbbf24' : '#f87171',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent analyses */}
          <div className="lg:col-span-2 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8 animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{t('dashboard.recentTitle')}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{t('dashboard.recentEmpty')}</p>
              </div>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {t('dashboard.recentViewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 grid place-items-center mb-4">
                  <Activity className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm text-zinc-400 mb-2">{t('dashboard.recentEmpty')}</p>
                <Link
                  to="/analyze/new"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:-translate-y-px transition-all"
                >
                  {t('analyze.newAnalysis')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map((s, i) => (
                  <div key={s.id} className={`animate-slide-up stagger-${Math.min(i + 1, 4)}`}>
                    <ScenarioCard scenario={s} to={`/analyze/${s.id}`} compact lang={lang} listMode />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Insight strip */}
        {profile && (
          <div className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.07] to-emerald-400/[0.04] p-6 sm:p-8 animate-slide-up stagger-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-2">{t('cards.insight.label')}</p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
              {overall.totalMonthlyDebt > 0
                ? `${t('dashboard.insightLabel')}: Rp${Math.round(overall.totalMonthlyDebt).toLocaleString('id-ID')}/mo ${t('common.perMonth')} — ${t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)}`
                : t('dashboard.overallEmpty')}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
