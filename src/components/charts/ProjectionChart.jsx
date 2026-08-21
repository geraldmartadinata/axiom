import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCompact, formatCurrency } from '../../utils/format'

function CustomTooltip({ active, payload, lang }) {
  if (!active || !payload || !payload.length) return null
  const year = payload[0]?.payload?.year
  const isID = lang === 'id'
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/[10%] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-zinc-500 mb-2">{isID ? 'Tahun' : 'Year'} {year}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, lang)}
        </p>
      ))}
    </div>
  )
}

export default function ProjectionChart({ depreciationCurve = [], investmentCurve = [], crossoverYear = null }) {
  const { t, lang } = useLanguage()
  const isID = lang === 'id'

  const chartData = depreciationCurve.map((dep, i) => ({
    year: dep.year,
    asset: dep.value,
    investment: investmentCurve[i]?.value || 0,
  }))

  return (
    <div className="w-full h-[400px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
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
            tickFormatter={(v) => formatCompact(v, lang)}
          />

          <Tooltip content={<CustomTooltip lang={lang} />} />

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
            dataKey="asset"
            name={isID ? 'Nilai Aset' : 'Asset Value'}
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#assetGradient)"
          />

          <Area
            type="monotone"
            dataKey="investment"
            name={isID ? 'Investasi' : 'Investment'}
            stroke="#4ade80"
            strokeWidth={2}
            fill="url(#investGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}