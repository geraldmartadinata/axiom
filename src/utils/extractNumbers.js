/**
 * Extract all numbers from a string, handling Indonesian/English formats.
 * Supports: plain numbers, 'k' (thousands), 'jt' (juta = millions), 'M' (millions), 'B' (billions)
 * Returns array of { value: number, raw: string, type: 'plain'|'k'|'jt'|'M'|'B' }
 */

const MULTIPLIERS = {
  k: 1_000,
  kt: 1_000,
  rb: 1_000,        // Indonesian 'ribu'
  jt: 1_000_000,    // Indonesian 'juta'
  m: 1_000_000,
  jtg: 1_000_000,   // 'juta' variant
  b: 1_000_000_000,
  tr: 1_000_000_000_000,
}

const SUFFIX_REGEX = Object.keys(MULTIPLIERS).join('|')

export function extractNumbers(text) {
  if (!text || typeof text !== 'string') return []

  const results = []
  // Match: number (with optional comma/decimal) + optional suffix (k, jt, M, B, etc.)
  const regex = new RegExp(
    `(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?)\\s*(${SUFFIX_REGEX})?`,
    'gi'
  )

  let match
  while ((match = regex.exec(text)) !== null) {
    const [raw, numStr, suffix] = match
    const cleanNum = numStr.replace(/,/g, '').replace(/\./g, '.')
    const value = parseFloat(cleanNum)
    if (isNaN(value)) continue

    const suffixKey = (suffix || '').toLowerCase()
    const multiplier = MULTIPLIERS[suffixKey] || 1
    const finalValue = Math.round(value * multiplier)

    results.push({
      value: finalValue,
      raw: raw.trim(),
      type: suffixKey || 'plain',
    })
  }

  return results
}

/**
 * Get the largest number found (usually the price/income)
 */
export function getLargestNumber(text) {
  const numbers = extractNumbers(text)
  if (!numbers.length) return null
  return Math.max(...numbers.map(n => n.value))
}

/**
 * Get all numbers as a simple array of values
 */
export function getAllNumbers(text) {
  return extractNumbers(text).map(n => n.value)
}