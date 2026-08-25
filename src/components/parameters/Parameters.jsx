import { useMemo, useState } from 'react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import {
  calculateMonthlyInstallment,
  calculateFlatInstallment,
  calculateDTI,
  calculateSanggupScore,
} from '../../utils/calculations'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'

/**
 * Parameters — live "what if" sliders (sand accent, per design).
 *
 * Adjusting a slider recomputes the Sanggup Score THROUGH the frozen engine
 * (never around it). The result is a derived preview; it does not mutate the
 * saved session.
 */
// Module-level so state updates never remount the <input type="range"> —
// an inline definition would recreate the component each render and break
// the pointer drag after every change.
function Slider({ label, value, min, max, step, onChange, display, hint }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[13px] text-zinc-400 font-medium">{label}</label>
        <output className="tabular-nums text-sm font-bold text-white">{display}</output>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${pct}%` }}
        className="w-full"
      />
      {hint && <p className="text-[11px] text-zinc-600 mt-1.5">{hint}</p>}
    </div>
  )
}

export default function Parameters({ scenario }) {
  const { t, lang } = useLanguage()
  const profile = useAxiomStore(s => s.profile)
  const currency = scenario?.currency || useAxiomStore(s => s.currency) || 'IDR'

  const f = scenario?.financials || {}
  const basePrice = f.base_price || 0
  const interestRate = f.interest_rate_assumed || 6.5

  // slider bounds (clamped around the session's own values)
  const [dp, setDp] = useState(f.down_payment || 0)
  const [term, setTerm] = useState(f.tenor_months || 12)
  const [income, setIncome] = useState(f.monthly_income || profile?.monthly_income || 0)
  // Flat monthly rate (HP credit / paylater style, typ. 1.5–3%/mo). Defaults
  // from the scenario's annual rate (÷12, capped at the 3% slider max).
  const [rateMo, setRateMo] = useState(() => {
    const annual = Number(f.interest_rate_assumed)
    const perMo = Number.isFinite(annual) && annual > 0 ? annual / 12 : 2
    return Math.min(3, Math.max(0, Math.round(perMo * 20) / 20))
  })

  const dpMax = Math.max(basePrice, 1)
  const termMin = 0, termMax = 96
  const incomeMax = Math.max(income, 50e6)

  const result = useMemo(() => {
    // Preview uses the FLAT-rate math Indonesian store credit actually bills
    // (interest on the full principal every month). Cash (term 0) → no interest.
    const principal = Math.max(0, basePrice - dp)
    const flat = calculateFlatInstallment(principal, term > 0 ? rateMo : 0, term)
    const installment = flat.installment
    const previewScenario = {
      ...scenario,
      financials: {
        ...f,
        down_payment: dp,
        tenor_months: term,
        monthly_income: income,
        calculated_monthly_installment: installment,
      },
    }
    const sanggup = calculateSanggupScore(previewScenario, profile)
    const dti = calculateDTI(installment, income, profile?.existing_monthly_debt || 0)
    return { installment, totalInterest: flat.totalInterest, totalPaid: flat.totalPaid, sanggup, dti: dti.dti }
  }, [basePrice, dp, term, income, rateMo, interestRate, f, profile, scenario])

  const { installment, totalInterest, sanggup, dti } = result
  const score = sanggup.score

  const scoreColor =
    score >= 80 ? 'text-sand' :
    score >= 50 ? 'text-golden' : 'text-terracotta'

  const scoreStatus =
    score >= 80 ? t('gauge.safe') :
    score >= 50 ? t('gauge.caution') : t('gauge.danger')

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-base font-semibold text-white">{t('cards.params.title')}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{t('cards.params.sub')}</p>
        </div>
        {/* live score chip */}
        <div className="text-right">
          <div className={cn('font-display text-2xl font-bold tabular-nums', scoreColor)}>{score}</div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{scoreStatus}</div>
        </div>
      </div>

      <Slider
        label={t('cards.params.dp')}
        value={dp}
        min={0}
        max={dpMax}
        step={Math.max(1, Math.round(dpMax / 200))}
        onChange={setDp}
        display={formatCurrency(dp, lang, currency)}
        hint={t('cards.params.dpHint')}
      />
      <Slider
        label={t('cards.params.term')}
        value={term}
        min={termMin}
        max={termMax}
        step={6}
        onChange={setTerm}
        display={term === 0 ? t('cards.params.cash') : `${term} mo`}
        hint={t('cards.params.termHint')}
      />
      <Slider
        label={t('cards.params.income')}
        value={income}
        min={0}
        max={incomeMax}
        step={Math.max(100000, Math.round(incomeMax / 200))}
        onChange={setIncome}
        display={formatCurrency(income, lang, currency)}
        hint={t('cards.params.incomeHint')}
      />
      <Slider
        label={t('cards.params.interest')}
        value={rateMo}
        min={0}
        max={3}
        step={0.05}
        onChange={setRateMo}
        display={`${Number(rateMo.toFixed(2))}% /mo`}
        hint={term === 0 ? t('cards.params.cash') : t('cards.params.interestHint')}
      />

      <div className="mt-5 pt-4 border-t border-white/[6%] grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.health.post')}</p>
          <p className={cn('font-display text-lg font-bold tabular-nums', dti > 30 ? 'text-terracotta' : dti > 20 ? 'text-golden' : 'text-sand')}>
            {dti.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.health.installment')}</p>
          <p className="font-display text-lg font-bold text-white tabular-nums">{formatCurrency(installment, lang, currency)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.params.totalInterest')}</p>
          <p className="font-display text-lg font-bold text-golden tabular-nums">{formatCurrency(totalInterest, lang, currency)}</p>
        </div>
      </div>
    </div>
  )
}
