import { useState } from 'react'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { DollarSign, Wallet, PiggyBank, TrendingUp, Users } from 'lucide-react'

export default function ProfileForm({ lang }) {
  const { t } = useLanguage()
  const { profile, saveProfile } = useAxiomStore()

  const [form, setForm] = useState({
    monthly_income: profile?.monthly_income || '',
    existing_monthly_debt: profile?.existing_monthly_debt || '',
    emergency_fund: profile?.emergency_fund || '',
    monthly_savings: profile?.monthly_savings || '',
    dependents: profile?.dependents || '',
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveProfile({
      monthly_income: Number(form.monthly_income) || 0,
      existing_monthly_debt: Number(form.existing_monthly_debt) || 0,
      emergency_fund: Number(form.emergency_fund) || 0,
      monthly_savings: Number(form.monthly_savings) || 0,
      dependents: Number(form.dependents) || 0,
    })
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label={t('profile.fields.monthlyIncome.label')}
        type="number"
        value={form.monthly_income}
        onChange={handleChange('monthly_income')}
        placeholder={t('profile.fields.monthlyIncome.placeholder')}
        icon={<DollarSign className="h-4 w-4" />}
        help={t('profile.fields.monthlyIncome.help')}
      />
      <Input
        label={t('profile.fields.existingDebt.label')}
        type="number"
        value={form.existing_monthly_debt}
        onChange={handleChange('existing_monthly_debt')}
        placeholder={t('profile.fields.existingDebt.placeholder')}
        icon={<Wallet className="h-4 w-4" />}
        help={t('profile.fields.existingDebt.help')}
      />
      <Input
        label={t('profile.fields.emergencyFund.label')}
        type="number"
        value={form.emergency_fund}
        onChange={handleChange('emergency_fund')}
        placeholder={t('profile.fields.emergencyFund.placeholder')}
        icon={<PiggyBank className="h-4 w-4" />}
        help={t('profile.fields.emergencyFund.help')}
      />
      <Input
        label={t('profile.fields.monthlySavings.label')}
        type="number"
        value={form.monthly_savings}
        onChange={handleChange('monthly_savings')}
        placeholder={t('profile.fields.monthlySavings.placeholder')}
        icon={<TrendingUp className="h-4 w-4" />}
        help={t('profile.fields.monthlySavings.help')}
      />
      <Input
        label={t('profile.fields.dependents.label')}
        type="number"
        value={form.dependents}
        onChange={handleChange('dependents')}
        placeholder={t('profile.fields.dependents.placeholder')}
        icon={<Users className="h-4 w-4" />}
      />

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" variant="primary">{t('profile.saveButton')}</Button>
        {saved && <span className="text-sm text-emerald-400">{t('profile.saved')}</span>}
      </div>
    </form>
  )
}