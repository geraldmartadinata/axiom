import { Navigate } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import ProjectionChart from '../components/charts/ProjectionChart'
import Card from '../components/ui/Card'
import { formatCurrency } from '../utils/format'

export default function Projections() {
  const scenario = useAxiomStore(s => s.currentScenario)
  const { t } = useLanguage()
  if (!scenario) return <Navigate to="/" replace />

  const { enrichment, scenario: sc, financials } = scenario
  const depCurve = enrichment.depreciation_curve || []
  const invCurve = enrichment.investment_curve || []
  const crossover = enrichment.crossover_year

  const finalDep = depCurve[depCurve.length - 1]?.value || 0
  const finalInv = invCurve[invCurve.length - 1]?.value || 0
  const diff = finalInv - finalDep

  return (
    <div className="space-y-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-1">{t('projections.title')}</h1>
        <p className="text-sm text-zinc-500">{t('projections.subtitle')}</p>
      </div>

      <Card className="animate-slide-up stagger-1">
        <ProjectionChart
          depreciationCurve={depCurve}
          investmentCurve={invCurve}
          crossoverYear={crossover}
        />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="animate-slide-up stagger-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{t('projections.stats.assetValue')}</p>
          <p className="text-2xl font-extrabold text-red-400 tracking-tighter">{formatCurrency(finalDep)}</p>
        </Card>
        <Card className="animate-slide-up stagger-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{t('projections.stats.investmentValue')}</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tighter">{formatCurrency(finalInv)}</p>
        </Card>
        <Card className="animate-slide-up stagger-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{t('projections.stats.netWorthDiff')}</p>
          <p className={'text-2xl font-extrabold tracking-tighter ' + (diff >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
          </p>
        </Card>
      </div>

      {crossover != null && (
        <Card className="animate-slide-up stagger-5">
          <p className="text-sm text-zinc-300">
            {t('projections.crossoverYear').replace('{year}', crossover)}
            <br />
            <span className="text-zinc-500">{t('projections.crossoverDesc')}</span>
          </p>
        </Card>
      )}
      {crossover == null && (
        <Card className="animate-slide-up stagger-5">
          <p className="text-sm text-zinc-300">{t('projections.noCrossover')}</p>
        </Card>
      )}
    </div>
  )
}