/**
 * Depreciation model — shared by the Dashboard asset graph; Analyze may reuse.
 * Rates are annual declining-balance fractions per the product spec.
 */

export const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

/**
 * Annual growth rate by category — REPLACES depreciationRate as the canonical
 * util. Negative = depreciates, positive = appreciates.
 * @param {string} category - 'vehicle' | 'motorcycle' | 'tech' | 'property' | 'gold' | other
 * @param {number} ageYears - years since purchase (gawai front-loads its losses)
 * @returns {number} e.g. -0.15 means −15%/yr
 */
export function assetGrowthRate(category, ageYears = 0) {
  switch (category) {
    case 'vehicle':    return -0.15                        // car ~15%/yr
    case 'motorcycle': return -0.12                        // motorcycle ~12%/yr
    case 'tech':       return ageYears < 2 ? -0.25 : -0.15 // gawai 25% yr 1–2, then 15%
    case 'property':   return 0.02                         // slight appreciation
    case 'gold':       return 0.05                         // gold / jewelry / luxury watch +5%/yr
    default:           return -0.20                        // other
  }
}

/** Back-compat alias — new code should use assetGrowthRate. */
export function depreciationRate(category, ageYears = 0) {
  return assetGrowthRate(category, ageYears)
}

/** Session schema only knows these categories today; anything else decays as 'other'. */
export function normalizeCategory(rawCategory) {
  const c = String(rawCategory || '').toLowerCase()
  if (c === 'vehicle' || c === 'car') return 'vehicle'
  if (c === 'motorcycle' || c === 'motor' || c === 'bike') return 'motorcycle'
  if (c === 'tech' || c === 'electronics' || c === 'phone' || c === 'gadget') return 'tech'
  if (c === 'property' || c === 'home' || c === 'house') return 'property'
  if (c === 'gold' || c === 'jewelry' || c === 'jewellery' || c === 'watch') return 'gold'
  return 'other'
}

/**
 * Value of ONE asset at time `atMs`, declining balance integrated monthly from its
 * own purchase date. Returns null for invalid input (caller skips gracefully) and 0
 * for times before the purchase existed.
 */
export function assetValueAt({ price, category, purchaseMs }, atMs) {
  const p = Number(price)
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(purchaseMs) || !Number.isFinite(atMs)) return null
  if (atMs <= purchaseMs) return 0
  let value = p
  const cat = normalizeCategory(category)
  // Monthly steps keeps the two-phase tech curve accurate enough without calculus.
  for (let ms = purchaseMs + YEAR_MS / 12; ms <= atMs; ms += YEAR_MS / 12) {
    const age = (ms - purchaseMs) / YEAR_MS
    value *= 1 + depreciationRate(cat, age) / 12
    if (value < 0) { value = 0; break }
  }
  return value
}

/** Compact IDR for axis/endpoint labels: 340000000 → "Rp 340 jt", 2.4e9 → "Rp 2,4 M". */
export function formatCompactIDR(value) {
  const v = Number(value)
  if (!Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  const trim = (n) => {
    const s = n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, '')
    return s.replace('.', ',')
  }
  if (abs >= 1e12) return `Rp ${trim(v / 1e12)} T`
  if (abs >= 1e9) return `Rp ${trim(v / 1e9)} M`
  if (abs >= 1e6) return `Rp ${trim(v / 1e6)} jt`
  return `Rp ${Math.round(v).toLocaleString('id-ID')}`
}
