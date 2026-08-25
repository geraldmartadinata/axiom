import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'
import { RotateCcw } from 'lucide-react'

/**
 * Parameters — live "what if" sliders (sand accent, per design).
 * Controlled by AnalyzeSession: every value lives in the parent so the score,
 * DTI, TCO, chart and recommendations all recompute from ONE derived state.
 *
 * Validation: DP 0–70% of price · tenor 0(cash)/6–72 mo step 6 ·
 * flat interest 0–30%/yr step 0.5 (shown as PERCENT, never rupiah).
 */
export default function Parameters({ basePrice, values, defaults, onChange, sim }) {
  const { t, lang } = useLanguage()
  const { dp, tenor, rate, income } = values

  const dpMax = Math.max(1, Math.round(basePrice * 0.7))
  const incomeMax = Math.max(income, 50e6)

  const installment = sim?.credit?.installment || 0
  const totalInterest = sim?.credit?.totalInterest || 0
  const dti = sim?.dti?.dti ?? 0
  const score = sim?.sanggup?.score ?? 0

  const scoreColor =
    score >= 80 ? 'text-sand' :
    score >= 50 ? 'text-golden' : 'text-terracotta'

  const scoreStatus = !sim?.hasIncome
    ? t('analyze.incompleteData')
    : score >= 80 ? t('gauge.safe') :
      score >= 50 ? t('gauge.caution') : t('gauge.danger')

  const handleReset = () => {
    onChange('dp', defaults.dp)
    onChange('tenor', defaults.tenor)
    onChange('rate', defaults.rate)
    onChange('income', defaults.income)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-white">{t('cards.params.title')}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{t('cards.params.sub')}</p>
        </div>
        <div className="text-right">
          <div className={cn('font-display text-2xl font-bold tabular-nums', scoreColor)}>{sim?.hasIncome ? score : '—'}</div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{scoreStatus}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-amber-300 transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
        {t('cards.params.reset')}
      </button>

      <Slider
        label={t('cards.params.dp')}
        value={dp}
        min={0}
        max={dpMax}
        step={Math.max(1, Math.round(dpMax / 100))}
        onChange={(v) => onChange('dp', v)}
        display={formatCurrency(dp, lang)}
        hint={t('cards.params.dpHint')}
      />
      <Slider
        label={t('cards.params.term')}
        value={tenor}
        min={0}
        max={72}
        step={6}
        onChange={(v) => onChange('tenor', v)}
        display={tenor === 0 ? t('cards.params.cash') : `${tenor} mo`}
        hint={t('cards.params.termHint')}
      />
      <Slider
        label={t('cards.params.interest')}
        value={rate}
        min={0}
        max={30}
        step={0.5}
        onChange={(v) => onChange('rate', v)}
        display={`${Number(rate).toLocaleString('en-US', { maximumFractionDigits: 1 })}% /yr`}
        hint={tenor === 0 ? t('cards.params.cash') : t('cards.params.interestHint')}
      />
      <Slider
        label={t('cards.params.income')}
        value={income}
        min={0}
        max={incomeMax}
        step={Math.max(100000, Math.round(incomeMax / 200))}
        onChange={(v) => onChange('income', v)}
        display={formatCurrency(income, lang)}
        hint={t('cards.params.incomeHint')}
      />

      <div className="mt-5 pt-4 border-t border-white/[6%] grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.health.post')}</p>
          <p className={cn('font-display text-lg font-bold tabular-nums', dti > 30 ? 'text-terracotta' : dti > 20 ? 'text-golden' : 'text-sand')}>
            {sim?.hasIncome ? `${dti.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.health.installment')}</p>
          <p className="font-display text-lg font-bold text-white tabular-nums">{formatCurrency(installment, lang)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[6%] px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">{t('cards.params.totalInterest')}</p>
          <p className="font-display text-lg font-bold text-golden tabular-nums">{formatCurrency(totalInterest, lang)}</p>
        </div>
      </div>
    </div>
  )
}

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
