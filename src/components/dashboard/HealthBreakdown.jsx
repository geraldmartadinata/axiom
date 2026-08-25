import { useState } from 'react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { ChevronDown, TrendingUp, ShieldAlert, Wallet, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * HealthBreakdown — transparency + actionable steps for the shared health score.
 * Weights/scores come straight from computeHealthScore (never invented here).
 * Impact estimates = REAL weight × (targetScore − currentScore).
 */
export default function HealthBreakdown({ health }) {
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  if (!health || health.score == null || !health.components) return null

  const c = health.components
  const d = health.detail || {}
  const id = lang === 'id'

  const rows = [
    {
      label: t('dashboard.health.savingsLabel'), ...c.savings,
      line: t('dashboard.health.savingsLine').replace('{{pct}}', d.savingsRatePct ?? 0),
    },
    {
      label: t('dashboard.health.emergencyLabel'), ...c.emergency,
      line: t('dashboard.health.emergencyLine')
        .replace('{{fund}}', formatCurrency(d.emergencyFund ?? 0, lang, 'IDR'))
        .replace('{{months}}', d.emergencyMonthsRaw != null ? d.emergencyMonthsRaw.toFixed(1) : '0')
        .replace('{{min}}', formatCurrency((d.expenses ?? 0) * 3, lang, 'IDR'))
        .replace('{{max}}', formatCurrency((d.expenses ?? 0) * 6, lang, 'IDR')),
    },
    {
      label: t('dashboard.health.dtiLabel'), ...c.dti,
      line: t('dashboard.health.dtiLine').replace('{{pct}}', health.dtiPercent ?? 0),
    },
    {
      label: t('dashboard.health.fcfLabel'), ...c.fcf,
      line: t('dashboard.health.fcfLine').replace('{{amount}}', formatCurrency(health.freeCashFlow ?? 0, lang, 'IDR')),
    },
  ]

  // --- Steps: lowest-impact components first, impact from the REAL formula ---
  const steps = []
  if ((d.savingsRatePct ?? 0) < 20) {
    steps.push({
      Icon: TrendingUp, tone: 'text-amber-400',
      text: t('dashboard.health.stepSavings').replace('{{pct}}', d.savingsRatePct ?? 0),
      impact: Math.round(c.savings.weight * (Math.min(20 / 30, 1) * 100 - c.savings.score)),
    })
  }
  if ((d.emergencyMonthsRaw ?? 0) < 3) {
    steps.push({
      Icon: ShieldAlert, tone: 'text-terracotta',
      text: t('dashboard.health.stepEmergency')
        .replace('{{fund}}', formatCurrency(d.emergencyFund ?? 0, lang, 'IDR'))
        .replace('{{months}}', d.emergencyMonthsRaw != null ? d.emergencyMonthsRaw.toFixed(1) : '0')
        .replace('{{target}}', formatCurrency((d.expenses ?? 0) * 3, lang, 'IDR')),
      impact: Math.round(c.emergency.weight * (70 - c.emergency.score)),
    })
  }
  if ((health.dtiRatio ?? 0) > 0.3) {
    steps.push({
      Icon: Wallet, tone: 'text-terracotta',
      text: t('dashboard.health.stepDti').replace('{{pct}}', health.dtiPercent ?? 0),
      impact: Math.round(c.dti.weight * (40 - c.dti.score)),
    })
  }
  if ((health.freeCashFlow ?? 0) <= 0 || health.overBudget) {
    steps.push({
      Icon: Sparkles, tone: 'text-golden',
      text: t('dashboard.health.stepIncome'),
      impact: Math.round(c.fcf.weight * (100 - c.fcf.score)),
    })
  }
  steps.sort((a, b) => b.impact - a.impact)
  const top = steps.filter(s => s.impact > 0).slice(0, 3)
  const allGood = Object.values(c).every(x => x.score >= 80)

  return (
    <section className="rounded-[20px] border border-white/[7%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-7">
      {/* Collapsible breakdown */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-white">{t('dashboard.health.breakdownTitle')}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
          {open ? t('dashboard.health.hideDetails') : t('dashboard.health.showDetails')}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <p className="font-display text-2xl font-bold text-white tabular-nums">
            {health.score} <span className="text-sm font-medium text-zinc-500">/ 100</span>
          </p>
          {rows.map(r => (
            <div key={r.label}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-xs font-medium text-zinc-300">
                  {r.label} <span className="text-zinc-600">· {Math.round(r.weight * 100)}% {t('dashboard.health.weight')}</span>
                </p>
                <p className="font-mono text-xs font-bold text-white tabular-nums">{r.score}/100</p>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
                <div className="h-full rounded-full bg-amber-400/80 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }} />
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">{r.line}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actionable steps */}
      <div className={cn('pt-5', open && 'mt-5 border-t border-white/[6%]')}>
        <p className="text-sm font-semibold text-white mb-3">{t('dashboard.health.stepsTitle')}</p>
        {allGood ? (
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t('dashboard.health.allGood')}
          </p>
        ) : top.length === 0 ? (
          <p className="text-xs text-zinc-500">{t('dashboard.health.allGood')}</p>
        ) : (
          <ul className="space-y-2.5">
            {top.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <s.Icon className={cn('h-4 w-4 mt-0.5 shrink-0', s.tone)} />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {s.text}
                  {s.impact > 0 && (
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 font-mono text-[10px] font-bold">
                      ≈ +{s.impact} {t('dashboard.health.points')}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
