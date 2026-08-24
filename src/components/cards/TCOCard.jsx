import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

export default function TCOCard({ breakdown, total, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  const stickerPrice = breakdown.basePrice || 1
  const multiple = (total / stickerPrice).toFixed(1)

  const isID = t('app.tagline') === 'Bisa beli nggak?'

  const rows = [
    { label: isID ? 'Harga Dasar' : 'Base Price', value: breakdown.basePrice },
    { label: isID ? 'DP' : 'Down Payment', value: breakdown.downPayment },
    { label: isID ? 'Total Cicilan' : 'Total Installments', value: breakdown.totalInstallments },
    { label: isID ? 'Pajak' : 'Taxes', value: breakdown.totalTaxes },
    { label: isID ? 'Perawatan' : 'Maintenance', value: breakdown.totalMaintenance },
    ...(breakdown.totalOther ? [{ label: isID ? 'Lainnya' : 'Other', value: breakdown.totalOther }] : []),
  ]

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-1">{t('analyze.totalCost')}</h3>
      <p className="text-xs text-zinc-500 mb-6">{t('analyze.totalCost') === 'Total Cost of Ownership' ? 'The real cost — not just the sticker price' : 'Biaya asli — bukan cuma harga stiker'}</p>

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
          <span className="text-sm text-zinc-300 font-medium">{isID ? 'Total Keseluruhan' : 'Grand Total'}</span>
          <span className="text-3xl font-extrabold text-white tracking-tighter">{formatCurrency(total, uiLang, currency)}</span>
        </div>
        <p className="text-xs text-zinc-500 text-right">{isID ? `Itu ${multiple}x harga stiker` : `That's ${multiple}x the sticker price`}</p>
      </div>
    </Card>
  )
}