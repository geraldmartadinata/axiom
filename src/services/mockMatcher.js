// Shared mock-scenario matcher — used by BOTH the client (extraction.js) and the
// serverless handler (api/gemini.js) so fallback behavior is identical everywhere.
// Pure module: no imports, no side effects.

import mockCar from '../mocks/mock-car.json' with { type: 'json' }
import mockGadget from '../mocks/mock-gadget.json' with { type: 'json' }
import mockProperty from '../mocks/mock-property.json' with { type: 'json' }
import mockBad from '../mocks/mock-bad.json' with { type: 'json' }

export function detectLanguage(prompt) {
  const idWords = ['bisa', 'beli', 'nggak', 'gak', 'cicil', 'dp', 'gaji', 'jt', 'miliar', 'triliun', 'bln', 'thn', 'tahun', 'bulan', 'rumah', 'apartemen', 'mobil', 'motor', 'hp', 'ponsel', 'laptop', 'cicilan', 'tenor', 'bunga', 'angsuran']
  const words = prompt.toLowerCase().split(/\s+/)
  const idCount = words.filter(w => idWords.some(iw => w.includes(iw))).length
  return idCount >= 2 ? 'id' : 'en'
}

export function matchMock(prompt) {
  const p = prompt.toLowerCase()

  // Indonesian vehicle keywords
  const vehicleKeywords = [
    'civic', 'avanza', 'veloz', 'honda', 'toyota', 'mobil', 'motor', 'car', 'vehicle',
    'tesla', 'bmw', 'm5', 'bmw m5', 'innova', 'fortuner', 'cr-v', 'hr-v', 'brio', 'jazz',
    'city', 'mobilio', 'xpander', 'pajero', 'triton', 'ranger', 'everest'
  ]

  // Indonesian tech keywords
  const techKeywords = [
    'iphone', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'hp', 'ponsel', 'phone',
    'laptop', 'macbook', 'ipad', 'tablet', 'gadget', 'mac', 'galaxy', 'redmi', 'poco',
    'iphone 16', 'iphone 15', 'ipad pro', 'airpods', 'apple watch'
  ]

  // Indonesian property keywords
  const propertyKeywords = [
    'rumah', 'apartemen', 'apartment', 'property', 'house', 'home', 'studio',
    'jakarta', 'bekasi', 'depok', 'tangerang', 'bogor', 'bandung', 'surabaya',
    'kpr', 'cicilan rumah', 'dp rumah', 'sertifikat', 'shm', 'shgb'
  ]

  const isVehicle = vehicleKeywords.some(kw => p.includes(kw))
  const isTech = techKeywords.some(kw => p.includes(kw))
  const isProperty = propertyKeywords.some(kw => p.includes(kw))

  // Check for bad scenario (low income, high price)
  const isBad = (p.includes('avanza') || p.includes('veloz') || p.includes('bmw') || p.includes('m5') || p.includes('110')) &&
                (p.includes('5jt') || p.includes('5 juta') || p.includes('2jt') || p.includes('2 juta') || p.includes('2k'))

  if (isBad) return mockBad
  if (isVehicle) return mockCar
  if (isTech) return mockGadget
  if (isProperty) return mockProperty

  // Default based on language
  return mockCar
}
