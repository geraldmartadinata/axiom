// E2E failure path: no API key + mock OFF → inline error, stays on page, NO session created.
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL || 'http://localhost:5174'
let failed = false

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const page = await browser.newPage()
page.on('pageerror', e => { failed = true; console.log('PAGE ERROR:', String(e)) })

try {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  await page.locator('input[aria-label]').fill('Beli Yamaha NMAX 2024 harga 38 juta, DP 5 juta')
  await page.getByRole('button', { name: /^analy[sz]e$|^analisis$/i }).click()

  // Wait for the inline error box
  const errBox = page.locator('div.border-terracotta\\/30')
  await errBox.waitFor({ state: 'visible', timeout: 10000 })
  const errText = await errBox.innerText()
  console.log(`PASS  inline error shown: "${errText.split('\n')[0]}"`)
  if (!errText.toLowerCase().includes('gagal') && !errText.toLowerCase().includes('failed')) {
    failed = true; console.log('FAIL  error copy unexpected')
  }

  // Stays on dashboard — no navigation
  await page.waitForTimeout(1200)
  const stayed = !page.url().includes('/analyze/')
  console.log(`${stayed ? 'PASS' : 'FAIL'}  stays on page (no navigation) — ${page.url()}`)
  if (!stayed) failed = true

  // No broken session created
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('axiom-storage') || 'null'))
  const count = stored?.state?.history?.length ?? 0
  console.log(`${count === 0 ? 'PASS' : 'FAIL'}  no session created — count=${count}`)
  if (count !== 0) failed = true
} catch (err) {
  failed = true
  console.log('FAIL  SCRIPT ERROR:', String(err).slice(0, 300))
} finally {
  await browser.close()
  console.log(failed ? '\nFAIL-PATH: FAILED' : '\nFAIL-PATH: ALL PASS')
  process.exit(failed ? 1 : 0)
}
