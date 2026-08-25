/**
 * Formatting utilities.
 *
 * Currency is DECOUPLED from UI language (Task 3): language (id/en) never
 * changes the currency. All money renders in IDR (id-ID digits) unless an
 * explicit currency override is passed — the navbar dropdown can switch the
 * ACTIVE display currency (USD converts at a static rate; inputs stay IDR).
 */

// Central currency registry — add new currencies here.
export const CURRENCIES = {
  IDR: { code: 'IDR', locale: 'id-ID', symbol: 'Rp' },
  USD: { code: 'USD', locale: 'en-US', symbol: '$' },
}

/** Static display-only conversion rate (inputs remain rupiah). */
export const USD_RATE = 16000

let ACTIVE_CURRENCY = 'IDR'

export function setActiveCurrency(code) {
  if (CURRENCIES[code]) ACTIVE_CURRENCY = code
}

export function getActiveCurrency() {
  return ACTIVE_CURRENCY
}

function resolve(lang, currency) {
  const cur = currency && CURRENCIES[currency] ? currency : ACTIVE_CURRENCY
  return { locale: CURRENCIES[cur].locale, currency: cur }
}

function convert(amount, cur) {
  return cur === 'USD' ? amount / USD_RATE : amount
}

export function useFormat() {
  const { lang } = useLanguage()

  function fmtCurrency(amount, options = {}) {
    const cur = getActiveCurrency()
    if (amount == null || isNaN(amount)) return cur === 'USD' ? '$0' : 'Rp0'
    return new Intl.NumberFormat(CURRENCIES[cur].locale, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(convert(amount, cur))
  }

  function fmtNumber(amount) {
    if (amount == null || isNaN(amount)) return '0'
    return new Intl.NumberFormat('id-ID').format(Math.round(amount))
  }

  function fmtDate(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function fmtCompact(amount) {
    const cur = getActiveCurrency()
    if (amount == null || isNaN(amount)) return cur === 'USD' ? '$0' : 'Rp0'
    const v = convert(amount, cur)
    const abs = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    const symbol = CURRENCIES[cur].symbol
    if (abs >= 1e9) return sign + symbol + (abs / 1e9).toFixed(1) + (lang === 'id' ? 'M' : 'B')
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(1) + 'M'
    if (abs >= 1e3) return sign + symbol + (abs / 1e3).toFixed(0) + 'K'
    return sign + symbol + Math.round(abs)
  }

  function fmtPercent(value, decimals = 1) {
    if (value == null || isNaN(value)) return '0%'
    return new Intl.NumberFormat('id-ID', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  }

  return { formatCurrency: fmtCurrency, formatNumber: fmtNumber, formatDate: fmtDate, formatCompact: fmtCompact, formatPercent: fmtPercent, locale: 'id-ID', currency: getActiveCurrency() }
}

export function formatCurrency(amount, lang = 'id', currency) {
  const { locale, currency: cur } = resolve(lang, currency)
  if (amount == null || isNaN(amount)) return cur === 'USD' ? '$0' : 'Rp0'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(convert(amount, cur))
}

export function formatNumber(amount, lang = 'id') {
  if (amount == null || isNaN(amount)) return '0'
  return new Intl.NumberFormat('id-ID').format(Math.round(amount))
}

export function formatDate(isoString, lang = 'id') {
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCompact(amount, lang = 'id', currency) {
  const { currency: cur } = resolve(lang, currency)
  if (amount == null || isNaN(amount)) return cur === 'USD' ? '$0' : 'Rp0'
  const v = convert(amount, cur)
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const symbol = CURRENCIES[cur].symbol
  if (abs >= 1e9) return sign + symbol + (abs / 1e9).toFixed(1) + (lang === 'id' ? 'M' : 'B')
  if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(1) + 'M'
  if (abs >= 1e3) return sign + symbol + (abs / 1e3).toFixed(0) + 'K'
  return sign + symbol + Math.round(abs)
}

export function formatPercent(value, lang = 'id', decimals = 1) {
  if (value == null || isNaN(value)) return '0%'
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}
