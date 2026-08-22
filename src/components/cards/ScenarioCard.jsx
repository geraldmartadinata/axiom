import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate } from '../../utils/format'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const categoryColors = {
  vehicle: 'info',
  tech: 'purple',
  property: 'safe',
}

/**
 * ScenarioCard — a clickable session card.
 * - `to`: link target (per-session route)
 * - `onDelete`: optional delete handler
 * - shows status badge when the purchase was CONFIRMED
 */
export default function ScenarioCard({ scenario, to, onClick, onDelete, compact = false, listMode = false, lang = 'en' }) {
  const { t } = useLanguage()
  const score = scenario?.enrichment?.sanggup_score
  const scoreStatus = score ? (score.score >= 80 ? 'safe' : score.score >= 50 ? 'warning' : 'danger') : 'neutral'
  const catBadge = categoryColors[scenario?.scenario?.category] || 'neutral'
  const currency = scenario?.currency || 'IDR'
  const confirmed = scenario?.status === 'CONFIRMED'

  let inner = null

  if (listMode) {
    inner = (
      <div className="flex items-center justify-between w-full group py-1">
        <div className="flex items-center gap-4 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200 truncate">{scenario?.scenario?.item_name}</h3>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-zinc-500 font-mono tracking-tight hidden sm:inline-block">
            {formatCurrency(scenario?.financials?.base_price, lang, currency)} • {scenario?.scenario?.term_months || 0} mo
          </span>
          {score ? (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold',
              scoreStatus === 'safe' ? 'bg-emerald-500/10 text-emerald-400' :
              scoreStatus === 'warning' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-400'
            )}>
              {score.score}
            </span>
          ) : <span className="w-8"></span>}
        </div>
      </div>
    )
  } else {
    inner = (
      <>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge status={catBadge}>{scenario?.scenario?.category}</Badge>
          {score && <Badge status={scoreStatus}>{score.score}</Badge>}
          {confirmed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {t('analyze.confirmed')}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-white mb-1 truncate">{scenario?.scenario?.item_name}</h3>
        <p className="text-xs text-zinc-500 mb-4">{formatDate(scenario?.created_at, lang)}</p>

        {!compact && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-600">{t('common.price')}</p>
              <p className="text-sm text-white font-medium tabular-nums">{formatCurrency(scenario?.financials?.base_price, lang, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">{t('common.monthly')}</p>
              <p className="text-sm text-white font-medium tabular-nums">{formatCurrency(scenario?.financials?.calculated_monthly_installment, lang, currency)}</p>
            </div>
          </div>
        )}
      </>
    )
  }

  const cardClass = cn('group relative', to ? 'cursor-pointer' : '')

  if (to) {
    return (
      <Link to={to} className="block h-full">
        <Card className={cardClass}>{inner}</Card>
      </Link>
    )
  }
  return <Card onClick={onClick} className={cardClass}>{inner}</Card>
}
