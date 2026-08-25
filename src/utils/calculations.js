/**
 * Axiom — Deterministic Calculation Engine
 *
 * CRITICAL: These functions are copied VERBATIM from business-logic.md.
 * Do NOT modify, optimize, or refactor any formula.
 * Do NOT use AI/LLM for any calculation. All math is pure JavaScript.
 */

// ──────────────────────────────────────────────────────────
// 1. Monthly Installment (Amortization)
// ──────────────────────────────────────────────────────────

/**
 * Calculate monthly installment using standard amortization formula.
 * @param {number} basePrice - Total item price
 * @param {number} downPayment - Upfront payment
 * @param {number} tenorMonths - Loan duration in months
 * @param {number} annualInterestRate - Annual interest rate (e.g., 6.5 for 6.5%)
 * @returns {number} Monthly installment amount, rounded to 2 decimals
 */
export function calculateMonthlyInstallment(basePrice, downPayment, tenorMonths, annualInterestRate) {
  const principal = basePrice - downPayment;
  if (principal <= 0 || tenorMonths <= 0) return 0;
  const monthlyRate = (annualInterestRate / 100) / 12;
  if (monthlyRate === 0) return Math.round((principal / tenorMonths) * 100) / 100;
  const n = tenorMonths;
  const installment = (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
                      (Math.pow(1 + monthlyRate, n) - 1);
  return Math.round(installment * 100) / 100;
}

// ──────────────────────────────────────────────────────────
// 1b. Flat-Rate Installment (Indonesian consumer credit)
// ──────────────────────────────────────────────────────────

// Average long-run nominal growth used for portfolio modeling:
// stocks → IHSG historical average, crypto → top-100 market cap average.
export const PORTFOLIO_YIELDS = { stocks: 0.06, crypto: 0.20 };

/**
 * Phone credit / paylater in Indonesia charges FLAT monthly interest
 * (typ. 1.5–3%/mo): interest is computed on the FULL principal every month,
 * unlike an amortized loan. This is what stores actually bill.
 * @param {number} principal - Price minus down payment
 * @param {number} monthlyFlatPercent - Flat rate per month (e.g. 2 for 2%/mo)
 * @param {number} tenorMonths - Loan duration in months
 * @returns {{installment: number, totalInterest: number, totalPaid: number}}
 */
export function calculateFlatInstallment(principal, monthlyFlatPercent, tenorMonths) {
  if (principal <= 0 || tenorMonths <= 0) {
    return { installment: 0, totalInterest: 0, totalPaid: principal > 0 ? principal : 0 };
  }
  const rate = (monthlyFlatPercent || 0) / 100;
  const installment = principal / tenorMonths + principal * rate;
  const totalInterest = principal * rate * tenorMonths;
  const totalPaid = principal + totalInterest;
  return {
    installment: Math.round(installment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

/**
 * Normalize an interest rate from AI extraction into ANNUAL PERCENT.
 * null/missing → 5 (sane default) · fraction (0.055 → 5.5) · rupiah/garbage
 * (>100) → 5 · else clamped 0–30.
 */
export function normalizeInterestRate(v) {
  if (v == null || v === '') return 5;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 5;
  if (n > 100) return 5;
  if (n > 0 && n <= 1) return Math.round(n * 10000) / 100;
  return Math.min(30, Math.max(0, n));
}

// ──────────────────────────────────────────────────────────
// 1c. creditCalc — single source of truth for credit math
// ──────────────────────────────────────────────────────────

/**
 * Consumer-credit math (FLAT annual rate — how Indonesian store credit /
 * paylater actually bills) + ownership cost breakdown. The base price is
 * NEVER added on top of installments: installments already contain
 * principal + interest.
 */
export function creditCalc({ basePrice = 0, downPayment = 0, tenorMonths = 0, annualFlatRate = 0, hiddenCosts = [] } = {}) {
  const price = Math.max(0, Number(basePrice) || 0);
  const dp = Math.min(Math.max(0, Number(downPayment) || 0), price);
  const tenor = Math.max(0, Math.round(Number(tenorMonths) || 0));
  const rate = Math.min(100, Math.max(0, Number(annualFlatRate) || 0)) / 100;

  const principal = price - dp;
  const totalInterest = tenor > 0 ? principal * rate * (tenor / 12) : 0;
  const installment = tenor > 0 ? (principal + totalInterest) / tenor : 0;

  const years = tenor / 12;
  let taxes = 0, insurance = 0, maintenance = 0, other = 0;
  (Array.isArray(hiddenCosts) ? hiddenCosts : []).forEach(c => {
    const perYear = Number(c?.amount_per_year) || 0;
    const upfront = Number(c?.amount_upfront) || 0;
    const sum = perYear * years + upfront;
    const type = String(c?.type || '').toLowerCase();
    const name = String(c?.name || '').toLowerCase();
    if (type === 'tax') taxes += sum;
    else if (type === 'maintenance') maintenance += sum;
    else if (name.includes('asuransi') || name.includes('insurance') || name.includes('care')) insurance += sum;
    else if (type === 'optional' || type === 'mandatory') insurance += sum;
    else other += sum;
  });

  const total = dp + principal + totalInterest + taxes + insurance + maintenance + other;
  const r2 = (x) => Math.round(x * 100) / 100;

  return {
    principal: r2(principal),
    totalInterest: r2(totalInterest),
    installment: r2(installment),
    breakdown: {
      downPayment: r2(dp),
      principal: r2(principal),
      interest: r2(totalInterest),
      taxes: r2(taxes),
      insurance: r2(insurance),
      maintenance: r2(maintenance),
      other: r2(other),
    },
    total: r2(total),
  };
}

// ──────────────────────────────────────────────────────────
// 2. Debt-to-Income (DTI) Ratio
// ──────────────────────────────────────────────────────────

/**
 * Calculate DTI ratio.
 * @param {number} newMonthlyInstallment - The new item's monthly payment
 * @param {number} monthlyIncome - User's monthly income
 * @param {number} existingMonthlyDebt - Existing debt obligations (from profile, default 0)
 * @returns {{dti: number, status: string}}
 */
export function calculateDTI(newMonthlyInstallment, monthlyIncome, existingMonthlyDebt = 0) {
  if (monthlyIncome <= 0) return { dti: 0, status: 'NO_INCOME' };
  const totalDebt = newMonthlyInstallment + existingMonthlyDebt;
  const dti = (totalDebt / monthlyIncome) * 100;
  const status = dti < 30 ? 'SAFE' : dti <= 45 ? 'WARNING' : 'DANGER';
  return { dti: Math.round(dti * 100) / 100, status };
}

// ──────────────────────────────────────────────────────────
// 3. Multi-Factor Sanggup Score (0-100)
// ──────────────────────────────────────────────────────────

/**
 * Calculate the multi-factor Sanggup Score.
 * @param {Object} scenario - Master JSON scenario (from AI extraction)
 * @param {Object} profile - User's financial profile (from localStorage)
 * @returns {{score: number, status: string, isPreliminary: boolean, components: Object}}
 */
export function calculateSanggupScore(scenario, profile) {
  const hasProfile = profile && profile.monthly_income > 0;
  const isPreliminary = !hasProfile;

  const income = hasProfile ? profile.monthly_income : (scenario.financials.monthly_income || 0);
  const installment = scenario.financials.calculated_monthly_installment || 0;
  const existingDebt = hasProfile ? (profile.existing_monthly_debt || 0) : 0;

  // --- Component 1: DTI (35%) ---
  const totalDebt = installment + existingDebt;
  const dti = income > 0 ? (totalDebt / income) * 100 : 100;
  let dtiScore;
  if (dti < 30) dtiScore = 100 - (dti * 0.5);
  else if (dti <= 45) dtiScore = 79 - ((dti - 30) * 1.93);
  else dtiScore = Math.max(0, 49 - ((dti - 45) * 1.63));

  // --- Component 2: Emergency Fund (25%) ---
  const emergencyFund = hasProfile ? (profile.emergency_fund || 0) : 0;
  const monthlyExpenses = income > 0 ? income * 0.6 : 0;
  const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;
  let emergencyScore;
  if (emergencyMonths >= 6) emergencyScore = 100;
  else if (emergencyMonths >= 3) emergencyScore = 70;
  else if (emergencyMonths >= 1) emergencyScore = 40;
  else emergencyScore = 0;

  // --- Component 3: Down Payment Health (20%) ---
  const dp = scenario.financials.down_payment || 0;
  const basePrice = scenario.financials.base_price || 1;
  const dpRatio = dp / basePrice;
  let dpScore;
  if (dpRatio >= 0.20) dpScore = 100;
  else if (dpRatio >= 0.10) dpScore = 60;
  else if (dpRatio >= 0.05) dpScore = 30;
  else dpScore = 0;

  // --- Component 4: Savings Rate (20%) ---
  const monthlySavings = hasProfile ? (profile.monthly_savings || 0) : 0;
  const savingsRate = income > 0 ? (monthlySavings / income) * 100 : 0;
  let savingsScore;
  if (savingsRate >= 20) savingsScore = 100;
  else if (savingsRate >= 10) savingsScore = 75;
  else if (savingsRate >= 5) savingsScore = 50;
  else savingsScore = 0;

  // --- Weighted Total ---
  const score = Math.round(
    (dtiScore * 0.35) +
    (emergencyScore * 0.25) +
    (dpScore * 0.20) +
    (savingsScore * 0.20)
  );

  const status = score >= 80 ? 'SAFE' : score >= 50 ? 'WARNING' : 'DANGER';

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    isPreliminary,
    components: {
      dti: { score: Math.round(dtiScore), weight: 0.35, raw: Math.round(dti * 100) / 100 },
      emergency: { score: emergencyScore, weight: 0.25, raw: Math.round(emergencyMonths * 100) / 100 },
      downPayment: { score: dpScore, weight: 0.20, raw: Math.round(dpRatio * 100) / 100 },
      savings: { score: savingsScore, weight: 0.20, raw: Math.round(savingsRate * 100) / 100 }
    }
  };
}

// ──────────────────────────────────────────────────────────
// 4. Total Cost of Ownership (TCO)
// ──────────────────────────────────────────────────────────

/**
 * Calculate total cost of ownership over the loan tenor.
 * DELEGATES to creditCalc — installments already include principal + interest,
 * so the base price is never double-counted.
 * @param {Object} scenario - Master JSON scenario
 * @returns {{breakdown: Object, total: number}}
 */
export function calculateTCO(scenario) {
  const f = scenario.financials;
  const result = creditCalc({
    basePrice: f.base_price || 0,
    downPayment: f.down_payment || 0,
    tenorMonths: f.tenor_months || 0,
    annualFlatRate: normalizeInterestRate(f.interest_rate_assumed),
    hiddenCosts: scenario.hidden_costs || [],
  });
  return { breakdown: result.breakdown, total: result.total };
}

// ──────────────────────────────────────────────────────────
// 5. Opportunity Cost (The "What If" Scenario)
// ──────────────────────────────────────────────────────────

/**
 * Calculate opportunity cost — what if you invested instead?
 * @param {number} downPayment - The down payment amount
 * @param {number} monthlyInstallment - The monthly installment
 * @param {number} tenorMonths - Loan duration in months
 * @param {number} annualReturnPercent - Assumed annual return (default 8)
 * @returns {{futureValueDP: number, futureValueMonthly: number, total: number, multiple: number}}
 */
export function calculateOpportunityCost(downPayment, monthlyInstallment, tenorMonths, annualReturnPercent = 8) {
  const HORIZON_YEARS = 10;
  const r = annualReturnPercent / 100;
  const monthlyR = r / 12;
  const tenor = Math.max(0, Math.min(tenorMonths || 0, HORIZON_YEARS * 12));

  // Future Value of Down Payment (lump sum, grows over the full 10yr horizon)
  const futureValueDP = downPayment * Math.pow(1 + r, HORIZON_YEARS);

  // Future Value of Monthly Installments: contributed during the tenor,
  // then the accumulated amount keeps compounding until the horizon ends.
  let futureValueMonthly = 0;
  if (monthlyR > 0 && tenor > 0) {
    const annuityAtTenor = monthlyInstallment * ((Math.pow(1 + monthlyR, tenor) - 1) / monthlyR);
    futureValueMonthly = annuityAtTenor * Math.pow(1 + monthlyR, HORIZON_YEARS * 12 - tenor);
  } else {
    futureValueMonthly = monthlyInstallment * tenor;
  }

  const total = futureValueDP + futureValueMonthly;
  const purchasePrice = downPayment + (monthlyInstallment * tenor);
  const multiple = purchasePrice > 0 ? total / purchasePrice : 0;

  return {
    futureValueDP: Math.round(futureValueDP * 100) / 100,
    futureValueMonthly: Math.round(futureValueMonthly * 100) / 100,
    total: Math.round(total * 100) / 100,
    multiple: Math.round(multiple * 100) / 100
  };
}

// ──────────────────────────────────────────────────────────
// 6. Depreciation / Appreciation Curves
// ──────────────────────────────────────────────────────────

/**
 * Generate 10-year value projection data.
 * @param {number} basePrice - Initial item price
 * @param {string} category - Item category: 'tech', 'vehicle', 'property'
 * @returns {Array<{year: number, value: number}>} 11 data points (year 0-10)
 */
export function generateDepreciationCurve(basePrice, category) {
  // Front-loaded annual loss: steepest drop in year 1, gentler tail — matches
  // real resale behavior (a flagship phone keeps roughly ~60% after 3 years).
  const year1 = { tech: -0.25, vehicle: -0.15, property: 0.03 };
  const tail = { tech: -0.10, vehicle: -0.10, property: 0.03 };
  const first = year1[category] ?? -0.15;
  const rest = tail[category] ?? -0.10;
  const data = [];
  let value = basePrice;
  for (let year = 0; year <= 10; year++) {
    if (year > 0) {
      value *= 1 + (year === 1 ? first : rest);
    }
    data.push({ year, value: Math.round(value * 100) / 100 });
  }
  return data;
}

// ──────────────────────────────────────────────────────────
// 7. Investment Growth Curve
// ──────────────────────────────────────────────────────────

/**
 * Generate 10-year investment growth data.
 * @param {number} downPayment - Initial investment (lump sum)
 * @param {number} monthlyInstallment - Monthly contribution
 * @param {number} annualReturnPercent - Assumed annual return (default 8)
 * @returns {Array<{year: number, value: number}>} 11 data points (year 0-10)
 */
export function generateInvestmentCurve(downPayment, monthlyInstallment, tenorMonths = 0, annualReturnPercent = 8) {
  const HORIZON_YEARS = 10;
  const r = annualReturnPercent / 100;
  const monthlyR = r / 12;
  const tenor = Math.max(0, Math.min(tenorMonths || 0, HORIZON_YEARS * 12));
  const data = [];
  for (let year = 0; year <= HORIZON_YEARS; year++) {
    const months = year * 12;
    const fvDP = downPayment * Math.pow(1 + r, year);
    // Contributions only happen during the tenor; afterwards the balance
    // simply keeps compounding until the horizon ends.
    const contribMonths = Math.min(months, tenor);
    let fvMonthly = 0;
    if (monthlyR > 0 && contribMonths > 0) {
      const annuity = monthlyInstallment * ((Math.pow(1 + monthlyR, contribMonths) - 1) / monthlyR);
      fvMonthly = annuity * Math.pow(1 + monthlyR, months - contribMonths);
    }
    data.push({ year, value: Math.round((fvDP + fvMonthly) * 100) / 100 });
  }
  return data;
}

// ──────────────────────────────────────────────────────────
// 8. Crossover Year Finder
// ──────────────────────────────────────────────────────────

/**
 * Find the year where investment value surpasses asset value.
 * @param {Array} depreciation - Depreciation curve data
 * @param {Array} investment - Investment curve data
 * @returns {number|null}
 */
function findCrossoverYear(depreciation, investment) {
  for (let i = 0; i < depreciation.length; i++) {
    if (investment[i].value > depreciation[i].value) {
      return investment[i].year;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────
// 9. Enrichment Orchestrator
// ──────────────────────────────────────────────────────────

/**
 * Enrich a raw Master JSON scenario with all deterministic calculations.
 * @param {Object} rawScenario - Master JSON from AI extraction
 * @param {Object} profile - User's financial profile (may be null/empty)
 * @returns {Object} Enriched scenario with all metrics attached
 */
export function enrichScenario(rawScenario, profile) {
  const f = rawScenario.financials;

  // Missing/zero tenor (prompt didn't mention a duration) defaults to a
  // 12-month plan — 0 would silently zero out the installment, TCO and
  // opportunity cost.
  const tenor = f.tenor_months > 0 ? f.tenor_months : 12;
  const rate = normalizeInterestRate(f.interest_rate_assumed);

  // Flat-rate installment via creditCalc (single source of truth).
  const credit = creditCalc({
    basePrice: f.base_price || 0,
    downPayment: f.down_payment || 0,
    tenorMonths: tenor,
    annualFlatRate: rate,
    hiddenCosts: rawScenario.hidden_costs || [],
  });

  const scenarioWithInstallment = {
    ...rawScenario,
    financials: { ...f, tenor_months: tenor, interest_rate_assumed: rate, calculated_monthly_installment: credit.installment }
  };

  const sanggup = calculateSanggupScore(scenarioWithInstallment, profile);
  const tco = calculateTCO(scenarioWithInstallment);
  const opportunity = calculateOpportunityCost(f.down_payment, credit.installment, tenor);
  const depreciation = generateDepreciationCurve(f.base_price, rawScenario.scenario.category);
  const investment = generateInvestmentCurve(f.down_payment, credit.installment, tenor);

  return {
    ...scenarioWithInstallment,
    id: `scenario_${Date.now()}`,
    created_at: new Date().toISOString(),
    enrichment: {
      sanggup_score: sanggup,
      tco,
      opportunity_cost: opportunity,
      depreciation_curve: depreciation,
      investment_curve: investment,
      crossover_year: findCrossoverYear(depreciation, investment)
    }
  };
}
