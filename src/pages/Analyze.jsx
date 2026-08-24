import { Navigate } from 'react-router-dom'
import { useAxiomStore } from '../store/useAxiomStore'
import { useLanguage } from '../store/LanguageContext.jsx'
import ScoreGauge from '../components/score/ScoreGauge'
import ScoreBreakdown from '../components/score/ScoreBreakdown'
import DTICard from '../components/cards/DTICard'
import TCOCard from '../components/cards/TCOCard'
import HiddenCostsCard from '../components/cards/HiddenCostsCard'
import OpportunityCostCard from '../components/cards/OpportunityCostCard'
import Parameters from '../components/parameters/Parameters'
import { calculateDTI } from '../utils/calculations'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

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

  // Labels for ScoreGauge (personalized, like Dashboard)
  const gaugeLabels = {
    perfect: t('gauge.perfect'),
    veryHealthy: t('gauge.veryHealthy'),
    healthy: t('gauge.healthy'),
    prettyGood: t('gauge.prettyGood'),
    intermediate: t('gauge.intermediate'),
    fair: t('gauge.fair'),
    poor: t('gauge.poor'),
    bad: t('gauge.bad'),
    veryBad: t('gauge.veryBad'),
    good: t('gauge.good'),
    noPurchase: t('gauge.noPurchase'),
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with back button */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </motion.button>
        <motion.div 
          className="text-center flex-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <p className="text-sm text-zinc-500 mb-1">{t('analyze.scoreBreakdown').replace('Rincian ', '').replace('Breakdown', '')}</p>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">{sc.item_name}</h1>
        </motion.div>
        <div className="w-20" />
      </motion.div>

      {/* Main layout: Left (score + breakdown + DTI) | Right (cards + parameters) */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {/* LEFT COLUMN — Vertical Score Stack */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          variants={itemVariants}
        >
          {/* Score Gauge - Large, Vertical */}
          <motion.div 
            className="p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl text-center"
            variants={itemVariants}
          >
            <ScoreGauge
              score={sanggup.score}
              isPreliminary={sanggup.isPreliminary}
              scoreLabel={t('analyze.scoreLabels')[sanggup.grade] || sanggup.grade}
              labels={gaugeLabels}
              size={220}
              showArcLabels={true}
            />
            {sanggup.isPreliminary && (
              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm text-amber-400 mb-1">{t('analyze.preliminary')}</p>
                <p className="text-xs text-zinc-500">{t('analyze.preliminaryDesc')}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Score Breakdown */}
          <motion.div 
            className="p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl"
            variants={itemVariants}
          >
            <motion.h3 
              className="font-display text-lg font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >{t('analyze.scoreBreakdown')}</motion.h3>
            <ScoreBreakdown components={sanggup.components} isPreliminary={sanggup.isPreliminary} />
          </motion.div>

          {/* DTI Card */}
          <motion.div variants={itemVariants}>
            <DTICard
              dti={dtiResult.dti}
              status={dtiResult.status}
              newInstallment={financials.calculated_monthly_installment}
              existingDebt={useAxiomStore.getState().profile?.existing_monthly_debt || 0}
              income={sanggup.isPreliminary ? financials.monthly_income : useAxiomStore.getState().profile?.monthly_income || financials.monthly_income}
              lang={useLanguage.getState().lang}
            />
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN — 2/3 width: OppCost, TCO, HiddenCosts, Parameters */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <OpportunityCostCard
              opportunity={opp}
              purchasePrice={financials.down_payment + (financials.calculated_monthly_installment * financials.tenor_months)}
              lang={useLanguage.getState().lang}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <TCOCard breakdown={tco.breakdown} total={tco.total} lang={useLanguage.getState().lang} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <HiddenCostsCard hiddenCosts={hidden_costs} tenorMonths={financials.tenor_months} lang={useLanguage.getState().lang} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Parameters scenario={scenario} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}