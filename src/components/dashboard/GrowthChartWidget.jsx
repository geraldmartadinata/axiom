import React from 'react'
import Card from '../ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/format'
import { useLanguage } from '../../store/LanguageContext.jsx'

export default function GrowthChartWidget() {
  const { lang } = useLanguage()
  const isID = lang === 'id'

  const data = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() + i
    // Dummy compound growth
    const baseAmount = isID ? 100000000 : 10000
    const returnRate = 0.08
    const val = baseAmount * Math.pow(1 + returnRate, i)
    return { year: year.toString(), value: val }
  })

  return (
    <Card className="p-6 h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-6">Projected Asset Growth (8% Return)</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="year" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => isID ? `Rp${(val / 1000000)}M` : `$${(val / 1000)}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#4ade80' }}
              formatter={(value) => formatCurrency(value, isID ? 'IDR' : 'USD')}
            />
            <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={3} dot={{ fill: '#18181b', stroke: '#4ade80', strokeWidth: 2 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
