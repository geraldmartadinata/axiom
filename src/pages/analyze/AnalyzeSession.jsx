import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import ScoreGauge from '../../components/score/ScoreGauge'
import ScoreBreakdown from '../../components/score/ScoreBreakdown'
import DTICard from '../../components/cards/DTICard'
import TCOCard from '../../components/cards/TCOCard'
import HiddenCostsCard from '../../components/cards/HiddenCostsCard'
import OpportunityCostCard from '../../components/cards/OpportunityCostCard'
import RecommendationCard from '../../components/cards/RecommendationCard'
import ProjectionChart from '../../components/charts/ProjectionChart'
import Parameters from '../../components/parameters/Parameters'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ArrowLeft, CheckCircle2, Trash2, RotateCcw, RefreshCw } from 'lucide-react'
import { formatCurrency } from '../../utils/format'
import {
  creditCalc,
  normalizeInterestRate,
  calculateDTI,
  calculateSanggupScore,
  calculateOpportunityCost,
  generateDepreciationCurve,
  generateInvestmentCurve,
} from '../../utils/calculations'
import { computeHealthScore } from '../../utils/healthScore'
import { motion } from 'framer-motion'

/**
 * /analyze/:sessionId — Full session detail (Mode B).
 * STATIC layer (session): prompt, item, category, base price, timestamp.
 * DERIVED layer: recomputed LIVE from the CURRENT profile + slider values —
 * opening an old session always reflects the latest profile.
 */
export default function AnalyzeSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const confirmPurchase = useAxiomStore(s => s.confirmPurchase)
  const unconfirmPurchase = useAxiomStore(s => s.unconfirmPurchase)
  const deleteFromHistory = useAxiomStore(s => s.deleteFromHistory)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [finalPrice, setFinalPrice] = useState('')
  const [finalDp, setFinalDp] = useState('')
  const [finalTerm, setFinalTerm] = useState('')

  const session = history.find(s => s.id === sessionId)

  // ---- Slider defaults from the session's own (Gemini-parsed) values ----
  const f = session?.financials || {}
  const basePrice = Number(f.base_price) || 0
  const defaults = useMemo(() => ({
    dp: f.down_payment != null && Number(f.down_payment) >= 0
      ? Math.min(Number(f.down_payment), Math.round(basePrice * 0.7))
      : Math.round(basePrice * 0.2),
    tenor: Number(f.tenor_months) > 0 ? Math.min(72, Math.max(6, Number(f.tenor_months))) : 48,
    rate: normalizeInterestRate(f.interest_rate_assumed),
    income: Number(profile?.monthly_income) || Number(f.monthly_income) || 0,
  }), [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [dp, setDp] = useState(defaults.dp)
  const [tenor, setTenor] = useState(defaults.tenor)
  const [rate, setRate] = useState(defaults.rate)
  const [income, setIncome] = useState(defaults.income)

  useEffect(() => {
    setDp(defaults.dp)
    setTenor(defaults.tenor)
    setRate(defaults.rate)
    setIncome(defaults.income)
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- LIVE DERIVED LAYER — recomputes on every slider/profile change ----
  const sim = useMemo(() => {
    if (!session) return null
    const hiddenCosts = session.hidden_costs || []
    const credit = creditCalc({ basePrice, downPayment: dp, tenorMonths: tenor, annualFlatRate: rate, hiddenCosts })
    const preview = {
      ...session,
      financials: { ...f, down_payment: dp, tenor_months: tenor, interest_rate_assumed: rate, calculated_monthly_installment: credit.installment },
    }
    const sanggup = calculateSanggupScore(preview, { ...(profile || {}), monthly_income: income })
    const dti = calculateDTI(credit.installment, income, profile?.existing_monthly_debt || 0)
    const health = computeHealthScore(profile, history, { extraInstallment: credit.installment, incomeOverride: income })
    const depreciation = generateDepreciationCurve(basePrice, session.scenario?.category)
    const investment = generateInvestmentCurve(dp, credit.installment, tenor)
    const opportunity = calculateOpportunityCost(dp, credit.installment, tenor)
    const crossover = investment.find((inv, i) => inv.value > (depreciation[i]?.value ?? 0))?.year ?? null
    return { credit, sanggup, dti, health, depreciation, investment, opportunity, crossover, hasIncome: income > 0, alternatives: session.alternatives }
  }, [session, basePrice, dp, tenor, rate, income, profile, history])

  // Badge: profile changed after this session was created → values recomputed.
  const recalculated = useMemo(() => {
    if (!session?.created_at || !profile?.updated_at) return false
    return new Date(profile.updated_at) > new Date(session.created_at)
  }, [session, profile])

  const profileIncomplete = !profile || !Number(profile.monthly_income) > 0

  if (!session || !sim) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 pb-16 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{t('analyze.sessionNotFound')}</h1>
        <p className="text-sm text-zinc-500 mb-8">{t('analyze.sessionNotFoundSub')}</p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-zinc-900/60 text-sm font-semibold text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('analyze.backToAnalyses')}
        </Link>
      </div>
    )
  }

  const currency = session.currency || 'IDR'
  const confirmed = session.status === 'CONFIRMED'
  const score = sim.sanggup.score

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  const handleDelete = () => {
    if (window.confirm('Delete this analysis?')) {
      deleteFromHistory(sessionId)
      navigate('/analyze')
    }
  }

  const handleConfirm = () => {
    confirmPurchase(sessionId, {
      final_price: finalPrice ? Number(finalPrice) : undefined,
      final_down_payment: finalDp ? Number(finalDp) : undefined,
      final_term_months: finalTerm ? Number(finalTerm) : undefined,
    })
    setConfirmOpen(false)
  }

  const zoneLabel = t(`gauge.${score >= 80 ? 'safe' : score >= 50 ? 'caution' : 'danger'}`)

  return (
    <motion.div
      className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-4 flex-wrap gap-4" variants={itemVariants}>
          <div className="flex items-center gap-4">
            <Link
              to="/analyze"
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{session.scenario?.item_name}</h1>
              <p className="text-xs text-zinc-500 mt-1 max-w-lg truncate italic">"{session.scenario?.raw_prompt}"</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {confirmed ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                {t('analyze.confirmed')}
                <button
                  onClick={() => unconfirmPurchase(sessionId)}
                  className="ml-1 p-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  title={t('analyze.undoConfirm')}
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => { setFinalPrice(String(financialsBase(session))); setFinalDp(String(sim.credit.breakdown.downPayment || '')); setFinalTerm(String(tenor)); setConfirmOpen(true) }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-zinc-950 text-sm font-bold shadow-[0_0_20px_rgba(212,163,115,0.25)] hover:shadow-[0_0_32px_rgba(212,163,115,0.4)] hover:-translate-y-px transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('analyze.confirmPurchase')}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Estimated-price notice — never blocks the user */}
        {session.priceEstimated && (
          <motion.div className="mb-6 rounded-2xl border border-white/10 bg-white/[3%] px-4 py-3" variants={itemVariants}>
            <p className="text-[11px] text-zinc-400">{t('analyze.priceEstimated')}</p>
          </motion.div>
        )}

        {/* Recalculated-with-latest-profile badge */}
        {recalculated && (
          <motion.div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sand/25 bg-sand/[7%] px-3 py-1.5" variants={itemVariants}>
            <RefreshCw className="h-3 w-3 text-sand" />
            <p className="text-[11px] font-medium text-sand">{t('analyze.recalcBadge')}</p>
          </motion.div>
        )}

        {/* Incomplete profile banner */}
        {profileIncomplete && (
          <motion.div
            className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[7%] px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
            variants={itemVariants}
          >
            <p className="text-xs text-amber-300">{t('analyze.prelimBanner')}</p>
            <Link
              to="/profile"
              className="text-xs font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors"
            >
              {t('analyze.completeProfile')}
            </Link>
          </motion.div>
        )}

        {/* Fallback notice — Gemini unavailable, result is a demo/mock extraction */}
        {session.fallback && (
          <motion.div
            className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[7%] px-4 py-3"
            variants={itemVariants}
          >
            <p className="text-xs font-mono uppercase tracking-wide text-amber-300">
              {t('analyze.fallbackNoticeTitle')}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">{t('analyze.fallbackNoticeBody')}</p>
          </motion.div>
        )}

        {/* Verdict Card + Score Breakdown row */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6" variants={itemVariants}>
          <div className="lg:col-span-2 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center">
            <ScoreGauge
              score={score}
              isPreliminary={false}
              scoreLabel={sim.hasIncome ? zoneLabel : t('analyze.incompleteData')}
            />
          </div>
          <div className="lg:col-span-3">
            <ScoreBreakdown components={sim.sanggup.components} isPreliminary={false} />
          </div>
        </motion.div>

        {/* Parameters + DTI */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" variants={itemVariants}>
          <Parameters
            basePrice={basePrice}
            values={{ dp, tenor, rate, income }}
            defaults={defaults}
            onChange={(field, v) => (field === 'dp' ? setDp(v) : field === 'tenor' ? setTenor(v) : field === 'rate' ? setRate(v) : setIncome(v))}
            sim={sim}
          />
          <DTICard
            dti={sim.hasIncome ? sim.dti.dti : null}
            status={sim.hasIncome ? sim.dti.status : 'INCOMPLETE'}
            newInstallment={sim.credit.installment}
            existingDebt={profile?.existing_monthly_debt || 0}
            income={income}
            currency={currency}
            lang={lang}
          />
        </motion.div>

        {/* Cost Cards */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" variants={itemVariants}>
          <TCOCard breakdown={sim.credit.breakdown} total={sim.credit.total} basePrice={basePrice} currency={currency} lang={lang} />
          <HiddenCostsCard hiddenCosts={session.hidden_costs} tenorMonths={tenor} currency={currency} lang={lang} />
          <OpportunityCostCard
            opportunity={sim.opportunity}
            downPayment={dp}
            installment={sim.credit.installment}
            currency={currency}
            lang={lang}
          />
        </motion.div>

        {/* Projections */}
        <motion.div className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-1">{t('projections.title')}</h2>
          <p className="text-xs text-zinc-500 mb-6">{t('projections.subtitle')}</p>
          <ProjectionChart
            scenario={session}
            depreciationCurve={sim.depreciation}
            investmentCurve={sim.investment}
            opportunity={sim.opportunity}
            crossoverYear={sim.crossover}
          />
        </motion.div>

        {/* Recommendations — only when the scenario doesn't make sense (live) */}
        <motion.div variants={itemVariants}>
          <RecommendationCard sim={sim} profile={profile} basePrice={basePrice} currency={currency} lang={lang} />
        </motion.div>

        {/* Confirm Modal */}
        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-1">{t('analyze.confirmModalTitle')}</h3>
            <p className="text-xs text-zinc-500 mb-6">{t('analyze.confirmModalSub')}</p>
            <div className="space-y-4">
              <Input
                label={t('analyze.finalPrice')}
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder={String(basePrice || '')}
              />
              <Input
                label={t('analyze.finalDownPayment')}
                type="number"
                value={finalDp}
                onChange={(e) => setFinalDp(e.target.value)}
                placeholder={String(sim.credit.breakdown.downPayment || '')}
              />
              <Input
                label={t('analyze.finalTerm')}
                type="number"
                value={finalTerm}
                onChange={(e) => setFinalTerm(e.target.value)}
                placeholder={String(tenor)}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="primary" onClick={handleConfirm} className="flex-1">
                {t('common.confirm')}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </motion.div>
  )
}

function financialsBase(session) {
  return Number(session?.financials?.base_price) || ''
}
