import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate } from '../../utils/format'
import { Trash2 } from 'lucide-react'

const categoryColors = {
  vehicle: 'info',
  tech: 'purple',
  property: 'safe',
}

export default function ScenarioCard({ scenario, onClick, onDelete, compact = false, lang = 'en' }) {
  const score = scenario?.enrichment?.sanggup_score
  const scoreStatus = score ? (score.score >= 80 ? 'safe' : score.score >= 50 ? 'warning' : 'danger') : 'neutral'
  const catBadge = categoryColors[scenario?.scenario?.category] || 'neutral'

  return (
    <Card onClick={onClick} className="group relative">
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Badge status={catBadge}>{scenario?.scenario?.category}</Badge>
        {score && <Badge status={scoreStatus}>{score.score}</Badge>}
      </div>

      <h3 className="text-base font-semibold text-white mb-1 truncate">{scenario?.scenario?.item_name}</h3>
      <p className="text-xs text-zinc-500 mb-4">{formatDate(scenario?.created_at, lang)}</p>

      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-zinc-600">Price</p>
            <p className="text-sm text-white font-medium">{formatCurrency(scenario?.financials?.base_price, lang)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Monthly</p>
            <p className="text-sm text-white font-medium">{formatCurrency(scenario?.financials?.calculated_monthly_installment, lang)}</p>
          </div>
        </div>
      )}
    </Card>
  )
}