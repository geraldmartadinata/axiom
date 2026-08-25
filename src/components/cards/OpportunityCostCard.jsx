import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { AlertTriangle } from 'lucide-react'

/**
 * "What If You Invested Instead?" — presentation only; the math comes from
 * calculateOpportunityCost (10-yr horizon, untouched). Explains WHERE each
 * number comes from and carries an honest hypothetical-scenario warning.
 */
export default function OpportunityCostCard({ opportunity, downPayment, installment, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'id'
  if (!opportunity) return null

  const multiple = Number(opportunity.multiple || 0).toLocaleString(uiLang === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 3 })
  const dp = Number(downPayment) || 0
  const monthly = Number(installment) || 0
  const years = 10

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('analyze.opportunityCost')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('analyze.opp.sub')}</p>

      <div className="mb-5">
        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">
          {t('analyze.opp.valueAfter').replace('{years}', years)}
        </p>
        <p className="text-4xl font-extrabold text-sand tracking-tighter">{formatCurrency(opportunity.total, uiLang, currency)}</p>
        <p className="text-sm text-zinc-400 mt-2">
          ({multiple}x {t('analyze.opp.ofTotalCost')})
        </p>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[6%] px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-zinc-300 mb-2">{t('analyze.opp.breakdownTitle')}</p>
        <ul className="space-y-1.5">
          <li className="text-xs text-zinc-400 leading-relaxed">
            {t('analyze.opp.dpLine')
              .replace('{dp}', formatCurrency(dp, uiLang, currency))
              .replace('{fv}', formatCurrency(opportunity.futureValueDP, uiLang, currency))}
          </li>
          <li className="text-xs text-zinc-400 leading-relaxed">
            {t('analyze.opp.monthlyLine')
              .replace('{monthly}', formatCurrency(monthly, uiLang, currency))
              .replace('{fv}', formatCurrency(opportunity.futureValueMonthly, uiLang, currency))}
          </li>
          <li className="text-xs text-zinc-400 leading-relaxed">{t('analyze.opp.assumption')}</li>
        </ul>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[6%] px-3.5 py-3">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">{t('analyze.opp.disclaimer')}</p>
      </div>
    </Card>
  )
}
