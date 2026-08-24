import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../store/LanguageContext.jsx'
import { useAxiomStore } from '../store/useAxiomStore'
import { formatCurrency, formatNumber } from '../utils/format'
import { Shield, Lock, TrendingUp, AlertTriangle, CheckCircle, Users, DollarSign, Wallet, PiggyBank, BarChart3, Download, RotateCcw, Settings, ChevronRight, Plus, Minus } from 'lucide-react'

/**
 * Profile Page — Two-column layout with numbered sections, risk profile cards,
 * live synthesis sidebar, and quick actions.
 */
export default function Profile() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { profile, saveProfile } = useAxiomStore()

  // Load existing profile or defaults
  const initialProfile = profile || {}
  
  const [form, setForm] = useState({
    monthly_income: initialProfile.monthly_income ?? '',
    monthly_savings: initialProfile.monthly_savings ?? '',
    existing_monthly_debt: initialProfile.existing_monthly_debt ?? '',
    dependents: initialProfile.dependents ?? 0,
    emergency_fund: initialProfile.emergency_fund ?? '',
    investment_return: initialProfile.investment_return ?? 7,
    riskProfile: initialProfile.riskProfile ?? 'moderate',
    currency: initialProfile.currency ?? 'IDR',
  })

  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleChange = (field) => (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, [field]: val }))
    setSaved(false)
    setSaveError(null)
  }

  const handleNumberChange = (field) => (e) => {
    const val = e.target.value.replace(/,/g, '')
    if (val === '' || /^\d+$/.test(val)) {
      setForm(prev => ({ ...prev, [field]: val }))
      setSaved(false)
    }
  }

  const handleDependentsStepper = (delta) => {
    const current = Number(form.dependents) || 0
    const next = Math.max(0, current + delta)
    setForm(prev => ({ ...prev, dependents: next }))
    setSaved(false)
  }

  const handleRiskSelect = (profile) => {
    const returns = { conservative: 4, moderate: 7, aggressive: 10 }
    setForm(prev => ({
      ...prev,
      riskProfile: profile,
      investment_return: returns[profile] || 7,
    }))
    setSaved(false)
  }

  const handleCurrencyChange = (e) => {
    setForm(prev => ({ ...prev, currency: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      monthly_income: Number(form.monthly_income) || 0,
      monthly_savings: Number(form.monthly_savings) || 0,
      existing_monthly_debt: Number(form.existing_monthly_debt) || 0,
      dependents: Number(form.dependents) || 0,
      emergency_fund: Number(form.emergency_fund) || 0,
      investment_return: Number(form.investment_return) || 7,
      riskProfile: form.riskProfile || 'moderate',
      currency: form.currency || 'IDR',
    }
    try {
      saveProfile(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  // ── Sidebar derived values ──
  const income = Number(form.monthly_income) || 0
  const savings = Number(form.monthly_savings) || 0
  const debt = Number(form.existing_monthly_debt) || 0
  const emergency = Number(form.emergency_fund) || 0
  const dependents = Number(form.dependents) || 0
  const returnRate = Number(form.investment_return) || 7

  const freeCashFlow = income > 0 ? income - debt - savings : null
  const monthlyExpenses = income > 0 ? income * 0.6 : 0 // assumption for runway
  const runwayMonths = (income > 0 && savings > 0 && income - savings > 0)
    ? emergency / (income - savings)
    : null

  const dti = income > 0 ? (debt / income) * 100 : null

  // Completeness
  const fields = ['monthly_income', 'monthly_savings', 'existing_monthly_debt', 'emergency_fund', 'dependents']
  const filled = fields.filter(f => {
    const val = form[f]
    return val !== '' && val !== null && val !== undefined && Number(val) >= 0
  }).length
  const completeness = Math.round((filled / fields.length) * 100)
  const isComplete = completeness === 100

  const nextMissing = fields.find(f => {
    const val = form[f]
    return val === '' || val === null || val === undefined || Number(val) < 0
  })
  const missingLabel = nextMissing ? t(`profile.fields.${nextMissing}.label`) : null

  const riskLabels = {
    conservative: 'Konservatif',
    moderate: 'Moderat',
    aggressive: 'Agresif'
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[62%_38%] gap-8">
          {/* ── LEFT COLUMN: FORM ── */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t('profile.title')}</h1>
              <p className="text-zinc-400 mt-1">{t('profile.subtitle')}</p>
            </div>

            {/* Why we need this — callout */}
            <div className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">{t('profile.why')}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{t('profile.whyDesc')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* ── Section 01: INCOME ── */}
              <div className="relative pl-6 border-l-2 border-amber-400/60">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">01</span>
                  <h2 className="text-lg font-semibold text-white">INCOME</h2>
                </div>
                <p className="text-xs text-zinc-500 mb-4">Your take-home pay and how much you set aside each month.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('profile.fields.monthlyIncome.label')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.monthly_income}
                      onChange={handleNumberChange('monthly_income')}
                      placeholder="e.g. 15000000"
                      className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('profile.fields.monthlySavings.label')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.monthly_savings}
                      onChange={handleNumberChange('monthly_savings')}
                      placeholder="e.g. 2000000"
                      className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 02: OBLIGATIONS ── */}
              <div className="relative pl-6 border-l-2 border-amber-400/60">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">02</span>
                  <h2 className="text-lg font-semibold text-white">OBLIGATIONS</h2>
                </div>
                <p className="text-xs text-zinc-500 mb-4">Fixed commitments that reduce your free cash flow.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('profile.fields.existingDebt.label')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.existing_monthly_debt}
                      onChange={handleNumberChange('existing_monthly_debt')}
                      placeholder="e.g. 500000"
                      className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('profile.fields.dependents.label')}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDependentsStepper(-1)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-zinc-900/60 flex items-center justify-center text-white hover:border-white/20 hover:bg-zinc-800/80 transition-colors"
                        aria-label="Decrease dependents"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-mono text-xl min-w-[2ch] text-center">{form.dependents}</span>
                      <button
                        type="button"
                        onClick={() => handleDependentsStepper(1)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-zinc-900/60 flex items-center justify-center text-white hover:border-white/20 hover:bg-zinc-800/80 transition-colors"
                        aria-label="Increase dependents"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 03: RESERVES ── */}
              <div className="relative pl-6 border-l-2 border-amber-400/60">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">03</span>
                  <h2 className="text-lg font-semibold text-white">RESERVES</h2>
                </div>
                <p className="text-xs text-zinc-500 mb-4">Liquid safety net available before the purchase.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {t('profile.fields.emergencyFund.label')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.emergency_fund}
                      onChange={handleNumberChange('emergency_fund')}
                      placeholder="e.g. 30000000"
                      className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                        CURRENCY
                      </label>
                      <select
                        value={form.currency}
                        onChange={handleCurrencyChange}
                        className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                      >
                        <option value="IDR">IDR (Rupiah)</option>
                        <option value="USD">USD (Dollar)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 04: RISK PROFILE ── */}
              <div className="relative pl-6 border-l-2 border-amber-400/60">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">04</span>
                  <h2 className="text-lg font-semibold text-white">RISK PROFILE</h2>
                </div>
                <p className="text-xs text-zinc-500 mb-4">Choose your investment horizon and return expectations.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['conservative', 'moderate', 'aggressive'].map((key) => {
                    const labels = {
                      conservative: 'Konservatif',
                      moderate: 'Moderat',
                      aggressive: 'Agresif'
                    }
                    const descs = {
                      conservative: 'Capital preservation, low-return assumptions (~4%/yr)',
                      moderate: 'Balanced growth assumptions (~7%/yr)',
                      aggressive: 'High growth, high volatility assumptions (~10%/yr)'
                    }
                    const isActive = form.riskProfile === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRiskSelect(key)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-amber-400/60 bg-amber-400/10 shadow-[0_0_20px_rgba(212,168,83,0.15)]'
                            : 'border-white/[6%] bg-zinc-900/40 hover:border-white/[12%] hover:bg-zinc-900/60'
                        }`}
                        aria-pressed={isActive}
                      >
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">{labels[key]}</div>
                        <div className="text-xs text-zinc-400 leading-relaxed">{descs[key]}</div>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-4">
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    {t('profile.fields.investmentReturn.label')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={form.investment_return}
                    onChange={handleChange('investment_return')}
                    placeholder="e.g. 7"
                    className="w-full bg-zinc-950/80 border border-white/[8%] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-amber-400 text-zinc-950 font-semibold rounded-full hover:bg-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/60 flex items-center gap-2"
                >
                  {saved ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('profile.saved')}
                    </>
                  ) : (
                    <>
                      {t('profile.saveButton')}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                {saveError && <p className="text-sm text-red-400">{saveError}</p>}
              </div>
            </form>

            {/* Quick Actions — 2x2 grid */}
            <div className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">{t('profile.quickActions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'viewAnalyses', icon: BarChart3, color: 'emerald', label: t('profile.actions.viewAnalyses'), desc: t('profile.actions.viewAnalysesDesc'), onClick: () => navigate('/analyze') },
                  { id: 'exportData', icon: Download, color: 'amber', label: t('profile.actions.exportData'), desc: t('profile.actions.exportDataDesc'), onClick: () => alert('Export functionality coming soon') },
                  { id: 'resetProfile', icon: RotateCcw, color: 'red', label: t('profile.actions.resetProfile'), desc: t('profile.actions.resetProfileDesc'), onClick: () => { if (confirm('Reset all profile data?')) { saveProfile({}); setForm({ monthly_income: '', monthly_savings: '', existing_monthly_debt: '', dependents: 0, emergency_fund: '', investment_return: 7, riskProfile: 'moderate', currency: 'IDR' }); } } },
                  { id: 'settings', icon: Settings, color: 'zinc', label: t('profile.actions.settings'), desc: t('profile.actions.settingsDesc'), onClick: () => alert('Settings coming soon') },
                ].map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="rounded-xl border border-white/[6%] bg-zinc-900/40 p-4 text-left hover:border-white/[12%] hover:bg-zinc-800/60 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-8 h-8 rounded-lg bg-${action.color}-400/10 border border-${action.color}-400/20 flex items-center justify-center`}>
                        <action.icon className={`h-4 w-4 text-${action.color}-400`} />
                      </div>
                      <span className="font-medium text-white text-sm">{action.label}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: SIDEBAR ── */}
          <div className="space-y-6 sticky top-24 self-start">
            {/* Profile Status */}
            <div className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">PROFILE STATUS</span>
                <span className="font-mono text-sm text-zinc-400">{completeness}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-700 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-3">
                {isComplete
                  ? 'Baseline complete. All analyses will use your profile.'
                  : missingLabel
                    ? `Add ${missingLabel} to unlock full capacity modeling.`
                    : 'Set your baseline to activate full scoring.'}
              </p>
            </div>

            {/* Live Synthesis */}
            <div className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-6 space-y-4">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">LIVE SYNTHESIS</div>
              <div className="space-y-3 divide-y divide-white/[4%]">
                <div className="pt-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">EST. FREE CASH FLOW</div>
                  <div className={`text-xl font-mono font-bold ${freeCashFlow !== null && freeCashFlow < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {freeCashFlow !== null ? formatCurrency(freeCashFlow, lang, form.currency) : '—'}
                  </div>
                </div>
                <div className="pt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">EMERGENCY RUNWAY</div>
                  <div className={`text-xl font-mono font-bold ${
                    runwayMonths === null ? 'text-zinc-500' :
                    runwayMonths < 3 ? 'text-red-400' :
                    runwayMonths <= 6 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {runwayMonths !== null ? `${runwayMonths.toFixed(1)} MONTHS` : '—'}
                  </div>
                </div>
                <div className="pt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">DTI RATIO</div>
                  <div className={`text-xl font-mono font-bold ${
                    dti === null ? 'text-zinc-500' :
                    dti > 36 ? 'text-red-400' :
                    dti > 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {dti !== null ? `${dti.toFixed(1)}%` : '—'}
                  </div>
                </div>
                <div className="pt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">CURRENT STANCE</div>
                  <div className="inline-block mt-1 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-semibold">
                    {riskLabels[form.riskProfile] || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="rounded-2xl border border-white/[6%] bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-400">SECURE LOG</div>
                <p className="text-sm text-zinc-400 mt-0.5">Data never leaves your browser.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}