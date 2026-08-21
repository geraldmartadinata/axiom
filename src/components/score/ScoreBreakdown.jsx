import { useLanguage } from '../../store/LanguageContext.jsx'

const componentConfigs = [
  { key: 'dti', labelKey: 'cards.scoreBreakdown.factors.dti', weight: '35%', suffix: '%' },
  { key: 'emergency', labelKey: 'cards.scoreBreakdown.factors.emergency', weight: '25%', suffix: ' mo' },
  { key: 'downPayment', labelKey: 'cards.scoreBreakdown.factors.downPayment', weight: '20%', suffix: '%' },
  { key: 'savings', labelKey: 'cards.scoreBreakdown.factors.savings', weight: '20%', suffix: '%' },
]

function getColor(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function ScoreBreakdown({ components: data, isPreliminary }) {
  const { t } = useLanguage()
  if (!data) return null

  return (
    <div className="space-y-4">
      {componentConfigs.map(comp => {
        const d = data[comp.key]
        if (!d) return null
        return (
          <div key={comp.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t(comp.labelKey)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">{comp.weight}</span>
                <span className="text-sm text-white font-medium">{d.score}</span>
                <span className="text-xs text-zinc-500">({d.raw}{comp.suffix})</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${getColor(d.score)} transition-all duration-1000 ease-out`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        )
      })}
      {isPreliminary && (
        <p className="text-xs text-amber-400/70 pt-1">
          Complete your profile for a more accurate score.
        </p>
      )}
    </div>
  )
}