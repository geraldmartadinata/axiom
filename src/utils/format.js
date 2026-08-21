import { useLanguage } from '../store/LanguageContext.jsx'

export function useFormat() {
  const { lang } = useLanguage()
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  const currency = lang === 'id' ? 'IDR' : 'USD'

  function fmtCurrency(amount, options = {}) {
    if (amount == null || isNaN(amount)) return currency === 'IDR' ? 'Rp0' : '$0'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount)
  }

  function fmtNumber(amount) {
    if (amount == null || isNaN(amount)) return '0'
    return new Intl.NumberFormat(locale).format(Math.round(amount))
  }

  function fmtDate(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function fmtCompact(amount) {
    if (amount == null || isNaN(amount)) return currency === 'IDR' ? 'Rp0' : '$0'
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    const symbol = currency === 'IDR' ? 'Rp' : '$'
    if (abs >= 1000000000) return sign + symbol + (abs / 1000000000).toFixed(1) + (lang === 'id' ? 'M' : 'B')
    if (abs >= 1000000) return sign + symbol + (abs / 1000000).toFixed(1) + 'M'
    if (abs >= 1000) return sign + symbol + (abs / 1000).toFixed(0) + 'K'
    return sign + symbol + Math.round(abs)
  }

  function fmtPercent(value, decimals = 1) {
    if (value == null || isNaN(value)) return '0%'
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  }

  return { formatCurrency: fmtCurrency, formatNumber: fmtNumber, formatDate: fmtDate, formatCompact: fmtCompact, formatPercent: fmtPercent, locale, currency }
}

export function formatCurrency(amount, lang = 'en') {
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  const currency = lang === 'id' ? 'IDR' : 'USD'
  if (amount == null || isNaN(amount)) return currency === 'IDR' ? 'Rp0' : '$0'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount, lang = 'en') {
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  if (amount == null || isNaN(amount)) return '0'
  return new Intl.NumberFormat(locale).format(Math.round(amount))
}

export function formatDate(isoString, lang = 'en') {
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCompact(amount, lang = 'en') {
  const currency = lang === 'id' ? 'IDR' : 'USD'
  if (amount == null || isNaN(amount)) return currency === 'IDR' ? 'Rp0' : '$0'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const symbol = currency === 'IDR' ? 'Rp' : '$'
  if (abs >= 1000000000) return sign + symbol + (abs / 1000000000).toFixed(1) + (lang === 'id' ? 'M' : 'B')
  if (abs >= 1000000) return sign + symbol + (abs / 1000000).toFixed(1) + 'M'
  if (abs >= 1000) return sign + symbol + (abs / 1000).toFixed(0) + 'K'
  return sign + symbol + Math.round(abs)
}

export function formatPercent(value, lang = 'en', decimals = 1) {
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  if (value == null || isNaN(value)) return '0%'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}