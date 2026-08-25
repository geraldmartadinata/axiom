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

export default function HiddenCostsCard({ hiddenCosts, tenorMonths, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  const years = (tenorMonths || 0) / 12

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('cards.hiddenCosts.title')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('cards.hiddenCosts.title') === 'Hidden Costs' ? 'Costs most people forget to factor in' : 'Biaya yang sering dilupakan orang'}</p>

      {!hiddenCosts || hiddenCosts.length === 0 ? (
        <p className="text-sm text-zinc-500">{t('cards.hiddenCosts.empty')}</p>
      ) : (
        <div>
          {/* Header row */}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] gap-3 pb-2 mb-1 border-b border-white/[8%]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{t('cards.hiddenCosts.colItem')}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 text-right">{t('cards.hiddenCosts.colCost')}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 text-right">{t('cards.hiddenCosts.colType')}</p>
          </div>
          <div className="divide-y divide-white/[4%]">
            {hiddenCosts.map((cost, i) => {
              const badge = typeBadgeConfig[cost.type] || typeBadgeConfig.optional
              const perYear = Number(cost.amount_per_year) || 0
              const upfront = Number(cost.amount_upfront) || 0
              return (
                <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] gap-3 py-2.5 items-start">
                  <p className="text-xs text-zinc-200 font-medium break-words min-w-0 leading-snug">{cost.name}</p>
                  <div className="text-right min-w-0">
                    <p className="text-xs text-zinc-200 font-medium break-words leading-snug">
                      {perYear > 0
                        ? `${formatCurrency(perYear, uiLang, currency)}${t('cards.hiddenCosts.perYear')}`
                        : `${formatCurrency(upfront, uiLang, currency)} ${t('cards.hiddenCosts.upfrontLabel')}`}
                    </p>
                    {perYear > 0 && (
                      <p className="text-[10px] text-zinc-500 break-words leading-snug mt-0.5">
                        {t('cards.hiddenCosts.totalLabel')} {formatCurrency(perYear * years, uiLang, currency)}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end"><Badge status={badge.status}>{t(badge.labelKey)}</Badge></div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}