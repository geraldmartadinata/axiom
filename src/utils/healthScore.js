/**
 * Financial Health Score — shared util (Dashboard gauge + reusable by Analyze).
 *
 * Derived ONLY from baseline parameters (no API, no fabricated data):
 *   • DTI component      (40%): expenses/income — 0% → 100 pts, ≥50% → 0 pts, linear
 *   • Savings component  (40%): savings rate    — ≥30% → 100 pts, 0% → 0 pts, linear
 *   • Cash flow component(20%): income − expenses > 0 → 100 pts, ≤ 0 → 0 pts
 *
 * Returns null score when there is no meaningful data (income ≤ 0) so callers
 * can render their empty states instead of a misleading 0.
 */

export function computeHealthScore({ income = 0, expenses = 0, savingsRate = 0 } = {}) {
  const inc = Math.max(0, Number(income) || 0)
  const exp = Math.max(0, Number(expenses) || 0)
  const rate = Math.min(100, Math.max(0, Number(savingsRate) || 0))

  if (inc <= 0) {
    return {
      score: null,
      status: 'NO_DATA',
      dtiPercent: null,
      liquidityMonths: null,
      effectiveSavings: 0,
      freeCashFlow: 0,
      overBudget: false,
    }
  }

  // --- DTI (40%) ---
  const dtiRatio = exp / inc // 0 .. 1+
  const dtiPoints = Math.max(0, Math.min(1, 1 - dtiRatio / 0.5)) * 100

  // --- Savings (40%) ---
  const savingsPoints = Math.min(rate / 30, 1) * 100

  // --- Cash flow after savings (20%) ---
  const rawSavings = (rate / 100) * inc
  const effectiveSavings = Math.min(rawSavings, Math.max(0, inc - exp))
  const freeCashFlow = inc - exp - effectiveSavings
  const cashFlowPoints = freeCashFlow > 0 ? 100 : 0

  const score = Math.round(dtiPoints * 0.4 + savingsPoints * 0.4 + cashFlowPoints * 0.2)

  const status = score >= 70 ? 'HEALTHY' : score >= 40 ? 'TIGHT' : 'RISKY'
  const overBudget = exp + rawSavings > inc + 1e-6

  return {
    score,
    status,
    dtiPercent: Math.round(dtiRatio * 100),
    liquidityMonths: null, // filled by computeLiquidity when profile available
    effectiveSavings: Math.round(effectiveSavings),
    freeCashFlow: Math.round(freeCashFlow),
    overBudget,
  }
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
