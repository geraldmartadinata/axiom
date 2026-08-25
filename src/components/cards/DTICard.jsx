import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

export default function DTICard({ dti, status, newInstallment, existingDebt, income, lang, currency }) {
  const { t } = useLanguage()
  const uiLang = lang || 'en'
  const statusBadge = status === 'SAFE' ? 'safe' : status === 'WARNING' ? 'warning' : 'danger'
  const markerPos = Math.min(dti, 100)

  const statusLabels = {
    SAFE: t('cards.dti.safe'),
    WARNING: t('cards.dti.warning'),
    DANGER: t('cards.dti.danger'),
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{t('cards.dti.title')}</h3>
        <Badge status={statusBadge}>{statusLabels[status] || status}</Badge>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-extrabold text-white tracking-tighter">{Number(dti || 0).toLocaleString(uiLang === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 3 })}%</span>
      </div>

      {/* DTI Bar with new palette */}
      <div className="relative h-3 rounded-full overflow-hidden bg-white/5 mb-2">
        <div className="absolute inset-y-0 left-0 w-[30%] bg-sand/30" />
        <div className="absolute inset-y-0 left-[30%] w-[15%] bg-golden/30" />
        <div className="absolute inset-y-0 left-[45%] right-0 bg-terracotta/30" />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full shadow-lg transition-all duration-500"
          style={{ left: `calc(${markerPos}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-600 mb-6">
        <span>0%</span><span>30%</span><span>45%</span><span>100%</span>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[6%]">
        <div>
          <p className="text-xs text-zinc-600 mb-1">{t('analyze.debtToIncome').includes('Debt-to-Income') ? 'New Payment' : 'Cicilan Baru'}</p>
          <p className="text-sm text-white font-medium">{formatCurrency(newInstallment, uiLang, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-600 mb-1">{t('analyze.debtToIncome').includes('Debt-to-Income') ? 'Existing Debt' : 'Hutang Lain'}</p>
          <p className="text-sm text-white font-medium">{formatCurrency(existingDebt, uiLang, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-600 mb-1">{t('analyze.debtToIncome').includes('Debt-to-Income') ? 'Income' : 'Penghasilan'}</p>
          <p className="text-sm text-white font-medium">{formatCurrency(income, uiLang, currency)}</p>
        </div>
      </div>
    </Card>
  )
}