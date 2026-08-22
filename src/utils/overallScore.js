/**
 * Overall Health Score — NEW feature (not part of frozen business-logic.md).
 *
 * Computes the user's CURRENT financial health from:
 *   - confirmed purchases (sessions marked status: 'CONFIRMED')
 *   - financial profile (income, emergency fund, savings, existing debt)
 *
 * This is the "what happened AFTER you bought it" score shown in the navbar
 * and dashboard. It is separate from the per-scenario Sanggup Score.
 */

import {
  calculateMonthlyInstallment,
  calculateDTI,
} from './calculations'

const ANNUAL_INTEREST = 0.065 // 6.5% average ID consumer loan

/**
 * Build a "current obligations" view from confirmed purchases.
 * Each confirmed purchase contributes its monthly installment.
 */
export function buildDebtProfile(history = [], profile = null) {
  const confirmed = (history || []).filter(s => s.status === 'CONFIRMED')
  const debts = confirmed.map(s => {
    const f = s.financials || {}
    const installment = f.calculated_monthly_installment ||
      calculateMonthlyInstallment(
        f.base_price || 0,
        f.down_payment || 0,
        f.tenor_months || 12,
        ANNUAL_INTEREST * 100
      )
    return {
      id: s.id,
      item_name: s.scenario?.item_name || 'Purchase',
      installment,
      remaining: f.tenor_months || 12,
    }
  })
  const totalMonthlyDebt = debts.reduce((sum, d) => sum + d.installment, 0)
  return { debts, totalMonthlyDebt, count: debts.length }
}

/**
 * Compute the overall health score 0-100.
 *
 * Factors (weighted):
 *   - Debt Load / DTI from confirmed purchases        (40%)
 *   - Emergency fund adequacy                          (30%)
 *   - Savings rate                                     (20%)
 *   - Down payment discipline (avg DP ratio)           (10%)
 */
export function computeOverallScore(history = [], profile = null) {
  const { debts, totalMonthlyDebt, count } = buildDebtProfile(history, profile)

  const income = profile?.monthly_income || 0
  // No data at all → don't show a misleading score
  const hasData = count > 0 || (profile && income > 0)
  if (!hasData) {
    return {
      score: null,
      status: 'NO_DATA',
      factors: { debt: { score: 0, raw: 0 }, emergency: { score: 0, raw: 0 }, savings: { score: 0, raw: 0 }, dp: { score: 0 } },
      confirmedCount: 0,
      totalMonthlyDebt: 0,
    }
  }
  let debtScore = 100
  if (income > 0) {
    const { dti, status } = calculateDTI(totalMonthlyDebt, income, profile?.existing_monthly_debt || 0)
    if (status === 'SAFE') debtScore = 100 - dti * 0.8
    else if (status === 'WARNING') debtScore = 68 - (dti - 30) * 1.2
    else debtScore = Math.max(0, 50 - (dti - 45) * 1.4)
  } else if (count > 0) {
    debtScore = 30 // purchases with no income on record — be harsh
  }

  // --- Factor 2: Emergency Fund (30%) ---
  let emergencyScore = 0
  const emergencyFund = profile?.emergency_fund || 0
  const monthlyExpenses = income > 0 ? income * 0.6 : 0
  const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0
  if (emergencyMonths >= 6) emergencyScore = 100
  else if (emergencyMonths >= 3) emergencyScore = 70
  else if (emergencyMonths >= 1) emergencyScore = 40
  else emergencyScore = 0

  // --- Factor 3: Savings Rate (20%) ---
  let savingsScore = 0
  const monthlySavings = profile?.monthly_savings || 0
  const savingsRate = income > 0 ? (monthlySavings / income) * 100 : 0
  if (savingsRate >= 20) savingsScore = 100
  else if (savingsRate >= 10) savingsScore = 75
  else if (savingsRate >= 5) savingsScore = 50
  else savingsScore = 0

  // --- Factor 4: DP Discipline (10%) ---
  let dpScore = 50 // neutral default
  if (count > 0) {
    const ratios = debts.map(d => {
      const s = history.find(h => h.id === d.id)
      const f = s?.financials || {}
      const dp = f.down_payment || 0
      const base = f.base_price || 1
      return dp / base
    })
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
    if (avgRatio >= 0.2) dpScore = 100
    else if (avgRatio >= 0.1) dpScore = 60
    else dpScore = 30
  }

  const score = Math.round(
    (debtScore * 0.40) +
    (emergencyScore * 0.30) +
    (savingsScore * 0.20) +
    (dpScore * 0.10)
  )

  const status = score >= 80 ? 'SAFE' : score >= 50 ? 'WARNING' : 'DANGER'

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    factors: {
      debt: { score: Math.round(debtScore), raw: totalMonthlyDebt },
      emergency: { score: emergencyScore, raw: emergencyMonths },
      savings: { score: savingsScore, raw: savingsRate },
      dp: { score: dpScore },
    },
    confirmedCount: count,
    totalMonthlyDebt,
  }
}
