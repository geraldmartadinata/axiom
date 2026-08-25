/**
 * Financial Health Score — SINGLE SOURCE OF TRUTH.
 * Used by: navbar pill, Dashboard gauge (real + simulation mode), and the
 * Analyze page (post-purchase, via opts.extraInstallment).
 *
 * Composition:
 *   • Savings rate      (30%): monthly savings / income — ≥30% → 100 pts
 *   • Emergency fund    (25%): months of expenses covered — ≥6 → 100
 *   • Free cash flow    (15%): income − expenses − savings > 0 → 100
 *   • DTI               (30%): confirmed-purchase installments (+ scenario
 *     installment via opts.extraInstallment) / income — 0% → 100 pts, ≥50% → 0
 *
 * Returns score:null when income ≤ 0 (callers render "—"/incomplete states —
 * never a misleading 0 or a "Safe" verdict without data).
 */
export function computeHealthScore(profile, sessions = [], opts = {}) {
  const income = Math.max(0, Number(opts.incomeOverride ?? profile?.monthly_income) || 0)
  const expenses = Math.max(0, Number(opts.expensesOverride ?? profile?.monthly_expenses) || 0)
  const savings = Math.max(0, Number(profile?.monthly_savings) || 0)
  const emergencyFund = Math.max(0, Number(profile?.emergency_fund) || 0)
  const existingDebt = Math.max(0, Number(profile?.existing_monthly_debt) || 0)

  const savingsRate = opts.savingsRateOverride != null
    ? Math.min(100, Math.max(0, Number(opts.savingsRateOverride) || 0))
    : (income > 0 ? (savings / income) * 100 : 0)

  // Installments from CONFIRMED purchases only (+ optional scenario preview).
  const confirmedInstallments = (Array.isArray(sessions) ? sessions : [])
    .filter(s => s?.status === 'CONFIRMED')
    .reduce((acc, s) => {
      const c = s?.confirmation || {}
      const price = Number(c.final_price ?? s?.financials?.base_price) || 0
      const dp = Number(c.final_down_payment ?? s?.financials?.down_payment) || 0
      const tenor = Number(c.final_term_months ?? s?.financials?.tenor_months) || 0
      if (tenor <= 0 || price <= 0) return acc
      const principal = Math.max(0, price - dp)
      const rate = Math.min(100, Math.max(0, Number(s?.financials?.interest_rate_assumed) || 5)) / 100
      acc += (principal + principal * rate * (tenor / 12)) / tenor
      return acc
    }, 0)
  const extraInstallment = Math.max(0, Number(opts.extraInstallment) || 0)
  const totalDebt = confirmedInstallments + extraInstallment + existingDebt

  const freeCashFlow = income - expenses - Math.min(savings, Math.max(0, income - expenses))
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : null
  const dtiRatio = income > 0 ? totalDebt / income : null

  if (income <= 0) {
    return {
      score: null, status: 'NO_DATA', incomplete: true,
      dtiPercent: null, dtiRatio: null,
      liquidityMonths: emergencyMonths,
      effectiveSavings: 0, freeCashFlow: 0,
      monthlyDebt: totalDebt, confirmedInstallments,
      overBudget: false,
    }
  }

  const savingsPoints = Math.min(savingsRate / 30, 1) * 100
  const emergencyPoints = emergencyMonths == null ? 50 : emergencyMonths >= 6 ? 100 : emergencyMonths >= 3 ? 70 : emergencyMonths >= 1 ? 40 : 0
  const fcfPoints = freeCashFlow > 0 ? 100 : 0
  const dtiPoints = Math.max(0, Math.min(1, 1 - dtiRatio / 0.5)) * 100

  const score = Math.round(savingsPoints * 0.3 + emergencyPoints * 0.25 + fcfPoints * 0.15 + dtiPoints * 0.3)
  const status = score >= 70 ? 'HEALTHY' : score >= 40 ? 'TIGHT' : 'RISKY'
  const rawSavings = (savingsRate / 100) * income
  const overBudget = expenses + rawSavings > income + 1e-6

  return {
    score,
    status,
    incomplete: false,
    dtiPercent: Math.round(dtiRatio * 100),
    dtiRatio,
    liquidityMonths: emergencyMonths,
    effectiveSavings: Math.round(Math.min(rawSavings, Math.max(0, income - expenses))),
    freeCashFlow: Math.round(freeCashFlow),
    monthlyDebt: Math.round(totalDebt),
    confirmedInstallments: Math.round(confirmedInstallments),
    overBudget,
  }
}

/**
 * Score-band color for gauges/badges (design-system aligned).
 * <40 RISKY muted red · 40–69 TIGHT amber→champagne · ≥70 HEALTHY soft green-gold.
 */
export function scoreColor(score) {
  if (typeof score !== 'number' || isNaN(score)) return '#e8c47a'
  if (score < 40) return '#e06c5a' // muted red
  if (score < 55) return '#e0a84a' // amber (lower TIGHT)
  if (score < 70) return '#e8c47a' // champagne gold (upper TIGHT)
  return '#9fce9f'                 // soft green-gold (HEALTHY)
}

/** hex (#rgb/#rrggbb) → rgba() string, for glows derived from scoreColor. */
export function withAlpha(hex, alpha = 1) {
  const h = String(hex).replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * Liquidity grade from emergency fund ÷ monthly expenses.
 * ≥12mo A+ · ≥8mo A · ≥6mo A− · ≥4mo B+ · ≥3mo B · ≥2mo B− · ≥1mo C+ · else C−
 */
export function computeLiquidityGrade(emergencyFund = 0, monthlyExpenses = 0) {
  const fund = Math.max(0, Number(emergencyFund) || 0)
  const exp = Math.max(0, Number(monthlyExpenses) || 0)
  if (exp <= 0 || fund <= 0) return null
  const months = fund / exp
  if (months >= 12) return 'A+'
  if (months >= 8) return 'A'
  if (months >= 6) return 'A-'
  if (months >= 4) return 'B+'
  if (months >= 3) return 'B'
  if (months >= 2) return 'B-'
  if (months >= 1) return 'C+'
  return 'C-'
}
