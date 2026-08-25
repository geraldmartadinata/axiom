import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

export default function OpportunityCostCard({ opportunity, purchasePrice, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  if (!opportunity) return null
  const multiple = Number(opportunity.multiple || 0).toLocaleString(uiLang === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 3 })

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('analyze.opportunityCost')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('analyze.opportunityCost') === 'What If You Invested Instead?' ? 'The opportunity cost of this purchase' : 'Biaya peluang dari pembelian ini'}</p>

      <div className="mb-6">
        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">{t('projections.stats.investmentValue').replace(' (10yr)', '').replace(' (Tahun 10)', '')}</p>
        <p className="text-4xl font-extrabold text-sand tracking-tighter">{formatCurrency(opportunity.total, uiLang, currency)}</p>
        <p className="text-sm text-zinc-400 mt-2">
          That's <span className="text-white font-bold">{multiple}x</span> what you'd spend on the purchase
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[6%]">
        <div>
          <p className="text-xs text-zinc-600 mb-1">Down Payment Grown</p>
          <p className="text-sm text-white font-medium">{formatCurrency(opportunity.futureValueDP, uiLang, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-600 mb-1">Monthly Invested</p>
          <p className="text-sm text-white font-medium">{formatCurrency(opportunity.futureValueMonthly, uiLang, currency)}</p>
        </div>
      </div>

      <p className="text-xs text-zinc-600 mt-4">
        Assumes 8% annual return (S&P 500 historical average). Past performance does not guarantee future results.
      </p>
    </Card>
  )
}