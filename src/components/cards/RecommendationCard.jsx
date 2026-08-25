import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { CalendarClock, ArrowDownRight, ShieldAlert, Users } from 'lucide-react'

/**
 * Recommendations — shown ONLY when the live simulation says the purchase
 * doesn't make sense (no income, risky score, or installment > 30% of income).
 * Disappears automatically when slider changes make the scenario safe.
 */
export default function RecommendationCard({ sim, profile, basePrice, currency, lang }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  if (!sim) return null

  const installment = sim.credit?.installment || 0
  const hasIncome = sim.hasIncome
  const income = Number(profile?.monthly_income) || 0
  const score = sim.sanggup?.score ?? 0
  const risky = !hasIncome || score < 50 || (hasIncome && installment > income * 0.3 && income > 0)
  if (!risky) return null

  // 1) Postpone: actionable only when achievable within ~1.5 years.
  const liquidSavings = (Number(profile?.emergency_fund) || 0) + (Number(profile?.stocks_value) || 0) + (Number(profile?.crypto_value) || 0)
  const targetDP = Math.round(basePrice * 0.3)
  const fcf = Math.max(0, Number(sim.health?.freeCashFlow) || 0)
  const monthlySavingsCapacity = Math.max(fcf, Number(profile?.monthly_savings) || 0)
  const gap = Math.max(0, targetDP - liquidSavings)
  const monthsToSave = gap > 0 && monthlySavingsCapacity > 0 ? Math.ceil(gap / monthlySavingsCapacity) : null
  const achievable = monthsToSave != null && monthsToSave <= 18
  const riskKey = String(profile?.riskProfile || 'moderate')

  // Secondary insight: income needed for the installment to fit 30% rule.
  const requiredIncome = installment > 0 ? Math.ceil(installment / 0.3) : 0
  const showIncomeInsight = hasIncome && requiredIncome > income

  // 2) Alternatives from Gemini (defensive) or a generic 30% rule.
  const alternatives = Array.isArray(sim.alternatives)
    ? sim.alternatives.filter(a => a && a.item)
    : []
  const maxInstallment = income > 0 ? Math.round(income * 0.3) : 0

  // 3) Contextual notes.
  const expenses = Number(profile?.monthly_expenses) || (income > 0 ? income * 0.6 : 0)
  const emergencyThin = expenses > 0 && (Number(profile?.emergency_fund) || 0) < expenses * 6
  const dependents = Number(profile?.dependents) || 0

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="h-4 w-4 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">{t('analyze.reco.title')}</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-5">{t('analyze.reco.sub')}</p>

      <ul className="space-y-4">
        {!hasIncome && (
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-sm text-zinc-300">{t('analyze.reco.noIncome')}</p>
          </li>
        )}
        {hasIncome && monthsToSave != null && achievable && (
          <li className="flex items-start gap-3">
            <CalendarClock className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">
                {t('analyze.reco.postpone').replace('{months}', monthsToSave)}
                {' · '}
                {t('analyze.reco.postponeSaving').replace('{amount}', formatCurrency(monthlySavingsCapacity, uiLang, currency))}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t('analyze.reco.postponeTarget').replace('{amount}', formatCurrency(targetDP, uiLang, currency))}
              </p>
            </div>
          </li>
        )}
        {hasIncome && (monthsToSave == null || !achievable) && (
          <li className="flex items-start gap-3">
            <CalendarClock className="h-4 w-4 mt-0.5 text-terracotta shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">{t('analyze.reco.notRealistic')}</p>
              <ul className="mt-1.5 space-y-1 text-xs text-zinc-400 leading-relaxed">
                <li>• {t('analyze.reco.genericAlt').replace('{amount}', formatCurrency(Math.round(income * 0.3), uiLang, currency))}</li>
                <li>• {t('analyze.reco.investRoutine').replace('{instruments}', t(`analyze.reco.instruments.${riskKey}`))}</li>
              </ul>
            </div>
          </li>
        )}
        {hasIncome && showIncomeInsight && (
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-sm text-zinc-300">
              {t('analyze.reco.incomeInsight')
                .replace('{income}', formatCurrency(requiredIncome, uiLang, currency))
                .replace('{cut}', formatCurrency(Math.max(0, installment + monthlySavingsCapacity - income), uiLang, currency))}
            </p>
          </li>
        )}

        {alternatives.length > 0 ? (
          <li className="flex items-start gap-3">
            <ArrowDownRight className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">{t('analyze.reco.alternative')}</p>
              <ul className="mt-1.5 space-y-1.5">
                {alternatives.slice(0, 3).map((a, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    <span className="text-zinc-200 font-medium">{a.item}</span>
                    {Number(a.estimated_price) > 0 && ` — ${formatCurrency(Number(a.estimated_price), uiLang, currency)}`}
                    {a.reason ? ` — ${a.reason}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ) : hasIncome && (
          <li className="flex items-start gap-3">
            <ArrowDownRight className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
            <p className="text-sm text-zinc-300">
              {t('analyze.reco.alternative')} — {t('analyze.reco.genericAlt').replace('{amount}', formatCurrency(maxInstallment, uiLang, currency))}
            </p>
          </li>
        )}

        {emergencyThin && (
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-sm text-zinc-300">{t('analyze.reco.emergency')}</p>
          </li>
        )}
        {dependents > 0 && hasIncome && (
          <li className="flex items-start gap-3">
            <Users className="h-4 w-4 mt-0.5 text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-300">{t('analyze.reco.dependents').replace('{count}', dependents)}</p>
          </li>
        )}
      </ul>
    </Card>
  )
}
