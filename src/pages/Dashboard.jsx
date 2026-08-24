import { Link } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import { computeOverallScore } from '../utils/overallScore'
import CommandCapsule from '../components/capsule/CommandCapsule'
import ScenarioCard from '../components/cards/ScenarioCard'
import ScoreGauge from '../components/score/ScoreGauge'
import { ArrowRight, Activity, ChevronDown } from 'lucide-react'

/**
 * Dashboard — Stitch-inspired overview with hero card and personalized score.
 */
export default function Dashboard() {
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const { t, lang } = useLanguage()

  const overall = computeOverallScore(history, profile)
  const recent = history.slice(0, 4)

  // Build label map for ScoreGauge using i18n keys
  const gaugeLabels = {
    perfect: t('gauge.perfect'),
    veryHealthy: t('gauge.veryHealthy'),
    healthy: t('gauge.healthy'),
    prettyGood: t('gauge.prettyGood'),
    intermediate: t('gauge.intermediate'),
    fair: t('gauge.fair'),
    poor: t('gauge.poor'),
    bad: t('gauge.bad'),
    veryBad: t('gauge.veryBad'),
  }

  // Determine score label based on overall score
  const getScoreLabel = (s) => {
    if (s >= 97) return gaugeLabels.perfect
    if (s >= 90) return gaugeLabels.veryHealthy
    if (s >= 80) return gaugeLabels.healthy
    if (s >= 67) return gaugeLabels.prettyGood
    if (s >= 50) return gaugeLabels.intermediate
    if (s >= 34) return gaugeLabels.fair
    if (s >= 21) return gaugeLabels.poor
    if (s >= 11) return gaugeLabels.bad
    return gaugeLabels.veryBad
  }

  const overallLabel = getScoreLabel(overall.score)

  // Factor bar colors using new palette
  const factorColors = {
    high: '#d4a373',
    mid: '#e9c46a',
    low: '#e76f51',
  }

  return (
    <div>
      {/* ============ HERO CARD (Stitch-inspired) ============ */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 text-center pt-24 pb-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-12 shadow-2xl animate-slide-up">
          <h1 className="font-display text-4xl sm:text-5xl font-light text-white tracking-tight mb-3">
            {t('dashboard.title')}
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            {t('dashboard.subtitle')}
          </p>
          <div className="w-full">
            <CommandCapsule />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600 animate-floaty">
            {t('dashboard.scrollHint')}
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
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
              labels={gaugeLabels}
              size={180}
            />

            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="text-zinc-500">
                {overall.confirmedCount > 0
                  ? t('cards.overall.confirmed').replace('{count}', overall.confirmedCount)
                  : t('cards.overall.noConfirmed')}
              </span>
            </div>

            {/* factor mini-bars using natural palette */}
            <div className="w-full mt-6 space-y-2">
              {[
                { label: t('cards.overall.debtFactor'), score: overall.factors.debt.score },
                { label: t('cards.overall.emergencyFactor'), score: overall.factors.emergency.score },
                { label: t('cards.overall.savingsFactor'), score: overall.factors.savings.score },
              ].map(factor => {
                let bg = factorColors.low
                if (factor.score >= 80) bg = factorColors.high
                else if (factor.score >= 50) bg = factorColors.mid
                return (
                  <div key={factor.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 w-24 text-left truncate">{factor.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${factor.score}%`, background: bg }}
                      />
                    </div>
                  </div>
                )
              })}
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand hover:text-sand-light transition-colors"
              >
                {t('dashboard.recentViewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-sand/10 border border-sand/20 grid place-items-center mb-4">
                  <Activity className="h-6 w-6 text-sand" />
                </div>
                <p className="text-sm text-zinc-400 mb-2">{t('dashboard.recentEmpty')}</p>
                <Link
                  to="/analyze/new"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-sand to-sand-light text-zinc-950 text-sm font-bold shadow-[0_0_20px_rgba(212,163,115,0.25)] hover:-translate-y-px transition-all"
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
          <div className="rounded-3xl border border-sand/15 bg-gradient-to-br from-sand/[0.07] to-sand/[0.04] p-6 sm:p-8 animate-slide-up stagger-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sand mb-2">{t('cards.insight.label')}</p>
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
