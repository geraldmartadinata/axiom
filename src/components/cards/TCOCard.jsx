import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

/**
 * Total Cost of Ownership — credit math via creditCalc breakdown.
 * Rows: DP + principal + interest + tax/fees + insurance + service + other.
 * The base price is NEVER listed on top of installments (no double count).
 */
export default function TCOCard({ breakdown, total, basePrice, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  const sticker = Number(basePrice) || 0
  const multiple = sticker > 0 ? (total / sticker).toLocaleString(uiLang === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 2 }) : null

  const rows = [
    { label: t('cards.tco.dp'), value: breakdown.downPayment },
    { label: t('cards.tco.principal'), value: breakdown.principal },
    { label: t('cards.tco.interest'), value: breakdown.interest },
    { label: t('cards.tco.taxFee'), value: breakdown.taxes },
    { label: t('cards.tco.insurance'), value: breakdown.insurance },
    { label: t('cards.tco.maintenance'), value: breakdown.maintenance },
    ...(breakdown.other ? [{ label: t('cards.tco.other'), value: breakdown.other }] : []),
  ].filter(r => r.value > 0 || r.label === t('cards.tco.dp') || r.label === t('cards.tco.principal') || r.label === t('cards.tco.interest'))

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('analyze.totalCost')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('cards.tco.desc')}</p>

      <div className="space-y-2.5 mb-6">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{row.label}</span>
            <span className="text-sm text-zinc-200 font-medium">{formatCurrency(row.value, uiLang, currency)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/[6%]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-zinc-300 font-medium">{t('cards.tco.total')}</span>
          <span className="text-3xl font-extrabold text-white tracking-tighter">{formatCurrency(total, uiLang, currency)}</span>
        </div>
        {multiple && (
          <p className="text-xs text-zinc-500 text-right">
            {uiLang === 'id' ? `Itu ${multiple}x harga stiker` : `That's ${multiple}x the sticker price`}
          </p>
        )}
      </div>
    </Card>
  )
}
