import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ShieldCheck, Home, ShoppingCart } from 'lucide-react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCompact, formatCurrency } from '../../utils/format'
import { calculateOpportunityCost } from '../../utils/calculations'
import { useAxiomStore } from '../../store/useAxiomStore'

function CustomTooltip({ active, payload, lang, currency }) {
  if (!active || !payload || !payload.length) return null
  const year = payload[0]?.payload?.year
  const isID = lang === 'id'
  return (
    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-zinc-500 mb-2">{isID ? 'Tahun' : 'Year'} {year}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, lang, currency)}
        </p>
      ))}
    </div>
  )
}

/**
 * ProjectionChart v2 — "What If" scenario with MEANINGFUL framing.
 *
 * Beyond the crossover chart, it computes life-relevant numbers:
 *   - Savings Recovery Time (months to rebuild buffer)
 *   - Retirement Impact (delay to first Rp100M invested)
 *   - Time-to-Ceiling (months until this purchase fits comfortably)
 *   - Alternative Milestones (what the money could buy instead)
 */
export default function ProjectionChart({ scenario }) {
  const { t, lang } = useLanguage()
  const currency = scenario?.currency || useAxiomStore(s => s.currency) || 'IDR'

  const enrichment = scenario?.enrichment || {}
  const depreciation = enrichment.depreciation_curve || []
  const investment = enrichment.investment_curve || []
  const crossoverYear = enrichment.crossover_year ?? null
  const f = scenario?.financials || {}

  const opportunity = enrichment.opportunity_cost || calculateOpportunityCost(
    f.down_payment || 0,
    f.calculated_monthly_installment || 0,
    f.tenor_months || 12
  )

  const isID = lang === 'id'
  const chartData = depreciation.map((dep, i) => ({
    year: dep.year,
    asset: dep.value,
    investment: investment[i]?.value || 0,
  }))

  // --- meaningful framing calculations ---
  const installment = f.calculated_monthly_installment || 0
  const monthlyIncome = f.monthly_income || 0
  const savingsRate = monthlyIncome > 0 ? Math.max(0.05, (0.15 * monthlyIncome)) : installment * 1.2

  // recovery time: months to rebuild ~6x monthly-expense buffer at savings rate
  const monthlyExpenses = monthlyIncome > 0 ? monthlyIncome * 0.6 : 0
  const bufferTarget = monthlyExpenses * 6
  const recoveryMonths = savingsRate > 0 ? Math.ceil(bufferTarget / savingsRate) : 72

  // retirement impact: how many extra months to first milestone given the purchase
  const milestone = 100e6 // first Rp100M
  const investMonthly = Math.max(0, savingsRate - installment)
  const withoutPurchase = savingsRate > 0 ? Math.ceil(milestone / savingsRate) : 0
  const withPurchase = investMonthly > 0 ? Math.ceil(milestone / investMonthly) : Infinity
  const delayMonths = withPurchase === Infinity ? 999 : Math.max(0, withPurchase - withoutPurchase)

  // time-to-ceiling: months until this purchase is < 25% DTI
  const ceilingMonths = (() => {
    if (monthlyIncome <= 0 || installment <= 0) return 0
    const targetDti = 0.25
    const neededIncome = installment / targetDti
    const growthRate = 0.05 // 5% annual income growth
    let months = 0
    let projected = monthlyIncome
    while (projected < neededIncome && months < 240) {
      months += 12
      projected = monthlyIncome * Math.pow(1 + growthRate, months / 12)
    }
    return months
  })()

  const wealthValue = opportunity?.total || 0
  const milestoneAlternatives = [
    { icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />, text: t('projections.alt1') },
    { icon: <Home className="h-3.5 w-3.5 text-cyan-400" />, text: t('projections.alt2') },
    { icon: <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />, text: t('projections.alt3') },
  ]

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="year"
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              label={{ value: isID ? 'Tahun' : 'Years', position: 'insideBottom', offset: -10, style: { fill: '#52525b', fontSize: 12 } }}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v, lang, currency)}
            />
            <Tooltip content={<CustomTooltip lang={lang} currency={currency} />} />

            {crossoverYear != null && (
              <ReferenceLine
                x={crossoverYear}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="5 5"
                label={{
                  value: isID ? `Crossover: Tahun ${crossoverYear}` : `Crossover: Year ${crossoverYear}`,
                  fill: '#a1a1aa',
                  fontSize: 11,
                  position: 'top',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="investment"
              name={isID ? 'Investasi' : 'Investment'}
              stroke="#34d399"
              strokeWidth={3}
              fill="url(#investGradient)"
            />
            <Area
              type="monotone"
              dataKey="asset"
              name={isID ? 'Nilai Aset' : 'Asset Value'}
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#assetGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Wealth badge */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-400/70 font-semibold">{t('projections.wealthLabel')}</p>
          <p className="font-display text-2xl font-bold text-emerald-400 tabular-nums">+ {formatCurrency(wealthValue, lang, currency)}</p>
        </div>
        <p className="text-xs text-zinc-500 max-w-[200px] text-right leading-relaxed">{t('projections.subtitle')}</p>
      </div>

      {/* Meaningful framing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FramingCard
          label={t('projections.recovery')}
          sub={t('projections.recoverySub')}
          value={t('projections.recoveryValue').replace('{months}', recoveryMonths)}
          accent="text-amber-400"
        />
        <FramingCard
          label={t('projections.retirement')}
          sub={t('projections.retirementSub')}
          value={t('projections.retirementValue').replace('{months}', delayMonths)}
          accent="text-cyan-400"
        />
        <FramingCard
          label={t('projections.ceiling')}
          sub={t('projections.ceilingSub')}
          value={t('projections.ceilingValue').replace('{months}', ceilingMonths)}
          accent="text-emerald-400"
        />
      </div>

      {/* Alternative milestones */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">{t('projections.alternatives')}</p>
        <div className="flex flex-wrap gap-2">
          {milestoneAlternatives.map((alt, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
              {alt.icon}
              {alt.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function FramingCard({ label, sub, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/[6%] bg-white/[0.03] px-4 py-3.5">
      <p className="text-[11px] font-semibold text-zinc-300">{label}</p>
      <p className={`font-display text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{sub}</p>
    </div>
  )
}
