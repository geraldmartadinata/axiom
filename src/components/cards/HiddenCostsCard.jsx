import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'

const typeBadgeConfig = {
  mandatory: { labelKey: 'cards.hiddenCosts.mandatory', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  upfront: { labelKey: 'cards.hiddenCosts.upfront', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  optional: { labelKey: 'cards.hiddenCosts.optional', cls: 'text-zinc-400 bg-white/[6%] border-white/10' },
  tax: { labelKey: 'cards.hiddenCosts.tax', cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
  maintenance: { labelKey: 'cards.hiddenCosts.maintenance', cls: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
}

/**
 * Hidden Costs — vertical stack per item (badge label / item name / cost line).
 * Nothing is truncated: names and amounts always wrap (375px-safe).
 */
export default function HiddenCostsCard({ hiddenCosts, tenorMonths, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'id'
  const years = (tenorMonths || 0) / 12

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('cards.hiddenCosts.title')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('cards.hiddenCosts.title') === 'Hidden Costs' ? 'Costs most people forget to factor in' : 'Biaya yang sering dilupakan orang'}</p>

      {!hiddenCosts || hiddenCosts.length === 0 ? (
        <p className="text-sm text-zinc-500">{t('cards.hiddenCosts.empty')}</p>
      ) : (
        <div className="space-y-3">
          {hiddenCosts.map((cost, i) => {
            const badge = typeBadgeConfig[cost.type] || typeBadgeConfig.optional
            const perYear = Number(cost.amount_per_year) || 0
            const upfront = Number(cost.amount_upfront) || 0
            return (
              <div key={i} className={cn('flex flex-col gap-1 pb-3', i < hiddenCosts.length - 1 && 'border-b border-white/[5%]')}>
                <span className={cn('self-start px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-widest', badge.cls)}>
                  {t(badge.labelKey)}
                </span>
                <p className="text-sm font-medium text-white break-words leading-snug min-w-0">{cost.name}</p>
                <p className="text-xs text-zinc-400 break-words leading-snug min-w-0">
                  {perYear > 0
                    ? `${formatCurrency(perYear, uiLang, currency)}${t('cards.hiddenCosts.perYear')} · ${t('cards.hiddenCosts.totalLabel')} ${formatCurrency(perYear * years, uiLang, currency)}`
                    : `${formatCurrency(upfront, uiLang, currency)} ${t('cards.hiddenCosts.upfrontLabel')}`}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
