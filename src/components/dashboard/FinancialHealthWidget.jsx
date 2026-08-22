import React, { useState, useMemo } from 'react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import Card from '../ui/Card'
import ScoreGauge from '../score/ScoreGauge'
import { formatCurrency } from '../../utils/format'
import DailyInsightWidget from './DailyInsightWidget'

import { useEffect } from 'react'

export default function FinancialHealthWidget() {
  const { t, lang } = useLanguage()

  const isID = lang === 'id'
  const currencySymbol = isID ? 'Rp' : '$'

  const [income, setIncome] = useState(isID ? 15000000 : 8000)
  const [expenses, setExpenses] = useState(isID ? 10000000 : 5000)
  const [savings, setSavings] = useState(isID ? 3000000 : 1500)

  // Adjust state if language changes to prevent broken sliders
  useEffect(() => {
    if (isID) {
      if (income < 1000000) {
        setIncome(15000000)
        setExpenses(10000000)
        setSavings(3000000)
      }
    } else {
      if (income > 100000) {
        setIncome(8000)
        setExpenses(5000)
        setSavings(1500)
      }
    }
  }, [isID])

  const score = useMemo(() => {
    // Basic calculation for general health
    if (income <= 0) return 0
    const savingsRate = savings / income
    const expenseRate = expenses / income

    // Ideal: savings >= 20%, expenses <= 50%, debt (implied) <= 30%
    let s = 100
    if (savingsRate < 0.20) s -= (0.20 - savingsRate) * 100 * 2 // steep penalty
    if (expenseRate > 0.60) s -= (expenseRate - 0.60) * 100 * 1.5

    return Math.max(0, Math.min(100, Math.round(s)))
  }, [income, expenses, savings])

  const maxIncome = isID ? 100000000 : 10000

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">General Financial Health</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">Monthly Income</label>
              <span className="text-sm font-bold text-white">{formatCurrency(income, isID ? 'IDR' : 'USD')}</span>
            </div>
            <input
              type="range"
              min="0" max={maxIncome} step={isID ? 500000 : 100}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">Monthly Expenses</label>
              <span className="text-sm font-bold text-white">{formatCurrency(expenses, isID ? 'IDR' : 'USD')}</span>
            </div>
            <input
              type="range"
              min="0" max={income} step={isID ? 100000 : 50}
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">Monthly Savings</label>
              <span className="text-sm font-bold text-white">{formatCurrency(savings, isID ? 'IDR' : 'USD')}</span>
            </div>
            <input
              type="range"
              min="0" max={income - expenses > 0 ? income - expenses : 0} step={isID ? 100000 : 50}
              value={savings}
              onChange={(e) => setSavings(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-center items-center">
          <ScoreGauge score={score} size={220} scoreLabel={score >= 80 ? 'EXCELLENT' : score >= 50 ? 'FAIR' : 'NEEDS WORK'} />
        </div>
      </div>

      <DailyInsightWidget income={income} expenses={expenses} savings={savings} />
    </Card>
  )
}
