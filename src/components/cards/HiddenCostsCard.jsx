import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

const typeBadgeConfig = {
  mandatory: { status: 'warning', labelKey: 'cards.hiddenCosts.mandatory' },
  upfront: { status: 'info', labelKey: 'cards.hiddenCosts.upfront' },
  optional: { status: 'neutral', labelKey: 'cards.hiddenCosts.optional' },
  tax: { status: 'danger', labelKey: 'cards.hiddenCosts.tax' },
  maintenance: { status: 'purple', labelKey: 'cards.hiddenCosts.maintenance' },
}

export default function HiddenCostsCard({ hiddenCosts, tenorMonths }) {
  const { t, lang } = useLanguage()
  const years = (tenorMonths || 0) / 12

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('cards.hiddenCosts.title')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('cards.hiddenCosts.title') === 'Hidden Costs' ? 'Costs most people forget to factor in' : 'Biaya yang sering dilupakan orang'}</p>

      {!hiddenCosts || hiddenCosts.length === 0 ? (
        <p className="text-sm text-zinc-500">{t('cards.hiddenCosts.title')} detected.</p>
      ) : (
        <div className="space-y-3">
          {hiddenCosts.map((cost, i) => {
            const badge = typeBadgeConfig[cost.type] || typeBadgeConfig.optional
            const total = cost.amount_per_year ? cost.amount_per_year * years : cost.amount_upfront || 0
            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{cost.name}</p>
                  <Badge status={badge.status} className="mt-1">{t(badge.labelKey)}</Badge>
                </div>
                <div className="text-right">
                  {cost.amount_per_year ? (
                    <p className="text-sm text-zinc-200 font-medium">
                      {formatCurrency(cost.amount_per_year)}{t('cards.hiddenCosts.perYear')}
                      <span className="text-zinc-500 text-xs"> &rarr; {formatCurrency(total)} total</span>
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-200 font-medium">{formatCurrency(cost.amount_upfront)} {t('cards.hiddenCosts.upfrontLabel')}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}