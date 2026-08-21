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
 * @param {Object} scenario - Master JSON scenario
 * @returns {{breakdown: Object, total: number}}
 */
export function calculateTCO(scenario) {
  const f = scenario.financials;
  const basePrice = f.base_price || 0;
  const installment = f.calculated_monthly_installment || 0;
  const tenor = f.tenor_months || 0;
  const hiddenCosts = scenario.hidden_costs || [];

  const totalInstallments = installment * tenor;
  const totalDownPayment = f.down_payment || 0;

  let totalTaxes = 0;
  let totalMaintenance = 0;
  let totalOther = 0;

  const years = tenor / 12;
  hiddenCosts.forEach(cost => {
    if (cost.amount_per_year) {
      const total = cost.amount_per_year * years;
      if (cost.type === 'tax') totalTaxes += total;
      else if (cost.type === 'maintenance') totalMaintenance += total;
      else totalOther += total;
    }
    if (cost.amount_upfront) {
      totalOther += cost.amount_upfront;
    }
  });

  const total = basePrice + totalInstallments + totalTaxes + totalMaintenance + totalOther;

  return {
    breakdown: {
      basePrice,
      downPayment: totalDownPayment,
      totalInstallments,
      totalTaxes,
      totalMaintenance,
      totalOther
    },
    total: Math.round(total * 100) / 100
  };
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
  const years = tenorMonths / 12;
  const r = annualReturnPercent / 100;

  // Future Value of Down Payment (lump sum)
  const futureValueDP = downPayment * Math.pow(1 + r, years);

  // Future Value of Monthly Installments (annuity)
  const monthlyR = r / 12;
  let futureValueMonthly = 0;
  if (monthlyR > 0) {
    futureValueMonthly = monthlyInstallment * ((Math.pow(1 + monthlyR, tenorMonths) - 1) / monthlyR);
  } else {
    futureValueMonthly = monthlyInstallment * tenorMonths;
  }

  const total = futureValueDP + futureValueMonthly;
  const purchasePrice = downPayment + (monthlyInstallment * tenorMonths);
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
  const rates = {
    tech: -0.20,
    vehicle: -0.15,
    property: 0.03
  };
  const rate = rates[category] ?? -0.15;
  const data = [];
  for (let year = 0; year <= 10; year++) {
    const value = basePrice * Math.pow(1 + rate, year);
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
export function generateInvestmentCurve(downPayment, monthlyInstallment, annualReturnPercent = 8) {
  const r = annualReturnPercent / 100;
  const monthlyR = r / 12;
  const data = [];
  for (let year = 0; year <= 10; year++) {
    const fvDP = downPayment * Math.pow(1 + r, year);
    const months = year * 12;
    let fvMonthly = 0;
    if (monthlyR > 0 && months > 0) {
      fvMonthly = monthlyInstallment * ((Math.pow(1 + monthlyR, months) - 1) / monthlyR);
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

  // Calculate installment if not provided by AI
  const installment = f.calculated_monthly_installment ||
    calculateMonthlyInstallment(f.base_price, f.down_payment, f.tenor_months, f.interest_rate_assumed || 6.5);

  const scenarioWithInstallment = {
    ...rawScenario,
    financials: { ...f, calculated_monthly_installment: installment }
  };

  const sanggup = calculateSanggupScore(scenarioWithInstallment, profile);
  const tco = calculateTCO(scenarioWithInstallment);
  const opportunity = calculateOpportunityCost(f.down_payment, installment, f.tenor_months);
  const depreciation = generateDepreciationCurve(f.base_price, rawScenario.scenario.category);
  const investment = generateInvestmentCurve(f.down_payment, installment);

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
