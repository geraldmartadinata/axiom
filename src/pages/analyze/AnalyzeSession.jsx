import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import ScoreGauge from '../../components/score/ScoreGauge'
import ScoreBreakdown from '../../components/score/ScoreBreakdown'
import DTICard from '../../components/cards/DTICard'
import TCOCard from '../../components/cards/TCOCard'
import HiddenCostsCard from '../../components/cards/HiddenCostsCard'
import OpportunityCostCard from '../../components/cards/OpportunityCostCard'
import ProjectionChart from '../../components/charts/ProjectionChart'
import Parameters from '../../components/parameters/Parameters'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ArrowLeft, CheckCircle2, Trash2, RotateCcw, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { formatCurrency } from '../../utils/format'
import { motion } from 'framer-motion'

/**
 * /analyze/:sessionId — Full session detail (Mode B).
 * Shows verdict, TCO, opportunity cost, projections, and confirm action.
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

  if (!session) {
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

  const enrichment = session.enrichment || {}
  const score = enrichment.sanggup_score || {}
  const financials = session.financials || {}
  const currency = session.currency || 'IDR'
  const confirmed = session.status === 'CONFIRMED'
  const isPreliminary = score.isPreliminary && !profile

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

  return (
    <motion.div
      className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-8 flex-wrap gap-4" variants={itemVariants}>
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
                onClick={() => { setFinalPrice(String(financials.base_price || '')); setFinalDp(String(financials.down_payment || '')); setFinalTerm(String(financials.tenor_months || '')); setConfirmOpen(true) }}
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

        {/* Verdict Card + Score Breakdown row */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6" variants={itemVariants}>
          <div className="lg:col-span-2 rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center">
            <ScoreGauge
              score={score.score}
              isPreliminary={isPreliminary}
              scoreLabel={t(`gauge.${score.score >= 80 ? 'safe' : score.score >= 50 ? 'caution' : 'danger'}`)}
            />
            {isPreliminary && (
              <p className="text-xs text-zinc-500 mt-3">{t('analyze.preliminaryDesc')}</p>
            )}
          </div>
          <div className="lg:col-span-3">
            <ScoreBreakdown components={score.components} isPreliminary={isPreliminary} />
          </div>
        </motion.div>

        {/* Parameters + DTI */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" variants={itemVariants}>
          <Parameters scenario={session} />
          <DTICard
            dti={enrichment.dti?.dti ?? (financials.calculated_monthly_installment && financials.monthly_income
              ? ((financials.calculated_monthly_installment + (profile?.existing_monthly_debt || 0)) / financials.monthly_income) * 100
              : 0)}
            status={enrichment.dti?.status || 'SAFE'}
            newInstallment={financials.calculated_monthly_installment}
            existingDebt={profile?.existing_monthly_debt || 0}
            income={financials.monthly_income || profile?.monthly_income || 0}
            currency={currency}
            lang={lang}
          />
        </motion.div>

        {/* Cost Cards */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" variants={itemVariants}>
          <TCOCard breakdown={enrichment.tco?.breakdown} total={enrichment.tco?.total} currency={currency} lang={lang} />
          <HiddenCostsCard hiddenCosts={session.hidden_costs} tenorMonths={financials.tenor_months} currency={currency} lang={lang} />
          <OpportunityCostCard
            opportunity={enrichment.opportunity_cost}
            purchasePrice={(financials.down_payment || 0) + (financials.calculated_monthly_installment || 0) * (financials.tenor_months || 1)}
            currency={currency}
            lang={lang}
          />
        </motion.div>

        {/* Projections */}
        <motion.div className="rounded-3xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-1">{t('projections.title')}</h2>
          <p className="text-xs text-zinc-500 mb-6">{t('projections.subtitle')}</p>
          <ProjectionChart scenario={session} />
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
                placeholder={String(financials.base_price || '')}
              />
              <Input
                label={t('analyze.finalDownPayment')}
                type="number"
                value={finalDp}
                onChange={(e) => setFinalDp(e.target.value)}
                placeholder={String(financials.down_payment || '')}
              />
              <Input
                label={t('analyze.finalTerm')}
                type="number"
                value={finalTerm}
                onChange={(e) => setFinalTerm(e.target.value)}
                placeholder={String(financials.tenor_months || '')}
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