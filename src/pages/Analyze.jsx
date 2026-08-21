import { Navigate } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import ScoreGauge from '../components/score/ScoreGauge'
import ScoreBreakdown from '../components/score/ScoreBreakdown'
import DTICard from '../components/cards/DTICard'
import TCOCard from '../components/cards/TCOCard'
import HiddenCostsCard from '../components/cards/HiddenCostsCard'
import OpportunityCostCard from '../components/cards/OpportunityCostCard'
import { calculateDTI } from '../utils/calculations'
import { formatCurrency } from '../utils/format'

export default function Analyze() {
  const scenario = useAxiomStore(s => s.currentScenario)
  const { t } = useLanguage()

  if (!scenario) return <Navigate to="/" replace />

  const { enrichment, financials, hidden_costs, scenario: sc } = scenario
  const sanggup = enrichment.sanggup_score
  const tco = enrichment.tco
  const opp = enrichment.opportunity_cost

  const dtiResult = calculateDTI(
    financials.calculated_monthly_installment,
    sanggup.isPreliminary ? financials.monthly_income : useAxiomStore.getState().profile?.monthly_income || financials.monthly_income,
    useAxiomStore.getState().profile?.existing_monthly_debt || 0
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <p className="text-sm text-zinc-500 mb-1">{t('analyze.scoreBreakdown').replace('Rincian ', '').replace('Breakdown', '')}</p>
        <h1 className="text-2xl font-bold text-white">{sc.item_name}</h1>
      </div>

      {/* Score + Breakdown (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center animate-slide-up stagger-1 p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl">
            <ScoreGauge
              score={sanggup.score}
              isPreliminary={sanggup.isPreliminary}
              scoreLabel={t('analyze.scoreLabels')[sanggup.grade] || sanggup.grade}
            />
            {sanggup.isPreliminary && (
              <div className="mt-4 text-center animate-fade-in">
                <p className="text-sm text-amber-400 mb-1">{t('analyze.preliminary')}</p>
                <p className="text-xs text-zinc-500">{t('analyze.preliminaryDesc')}</p>
              </div>
            )}
          </div>

          <div className="animate-slide-up stagger-2 p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">{t('analyze.scoreBreakdown')}</h3>
            <ScoreBreakdown components={sanggup.components} isPreliminary={sanggup.isPreliminary} />
          </div>

          <div className="animate-slide-up stagger-3">
            <DTICard
              dti={dtiResult.dti}
              status={dtiResult.status}
              newInstallment={financials.calculated_monthly_installment}
              existingDebt={useAxiomStore.getState().profile?.existing_monthly_debt || 0}
              income={sanggup.isPreliminary ? financials.monthly_income : useAxiomStore.getState().profile?.monthly_income || financials.monthly_income}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="animate-slide-up stagger-2">
            <OpportunityCostCard
              opportunity={opp}
              purchasePrice={financials.down_payment + (financials.calculated_monthly_installment * financials.tenor_months)}
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <TCOCard breakdown={tco.breakdown} total={tco.total} />
          </div>
          <div className="animate-slide-up stagger-5">
            <HiddenCostsCard hiddenCosts={hidden_costs} tenorMonths={financials.tenor_months} />
          </div>
        </div>
      </div>
    </div>
  )
}