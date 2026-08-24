// E2E: submit → session created → navigate → persist → second session → recent list.
// Run against a dev server with VITE_USE_MOCK=true (mock resolver for the happy path).
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const results = []
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: Boolean(cond), detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const page = await browser.newPage()
page.on('pageerror', e => results.push({ name: 'PAGE ERROR', pass: false, detail: String(e) }))

try {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const input = page.locator('input[aria-label]')
  const analyzeBtn = page.getByRole('button', { name: /^analy[sz]e$|^analisis$/i })

  // --- Test 1: first prompt creates a NEW session ---
  const prompt1 = 'Beli Yamaha NMAX 2024 harga 38 juta, DP 5 juta, tenor 2 tahun, income 8 juta/bulan'
  await input.fill(prompt1)
  await analyzeBtn.click()
  await page.waitForURL(/\/analyze\/scenario_/, { timeout: 15000 })
  const url1 = page.url()
  const id1 = url1.match(/scenario_\d+/)?.[0]
  ok('T1 navigates to NEW session', Boolean(id1), id1)

  // Results view renders THAT session (not found-screen)
  await page.waitForTimeout(600)
  const notFound = await page.getByText(/sessionnotfound|tidak ditemukan|not found/i).count()
  ok('T1 results render (no not-found)', notFound === 0)

  const stored1 = await page.evaluate(() => JSON.parse(localStorage.getItem('axiom-storage') || 'null'))
  const sessions1 = stored1?.state?.history || []
  ok('T1 exactly one session persisted', sessions1.length === 1, `count=${sessions1.length}`)
  ok('T1 stored ID matches URL', sessions1[0]?.id === id1, `${sessions1[0]?.id} vs ${id1}`)
  ok('T1 original prompt stored', (sessions1[0]?.scenario?.raw_prompt || '').includes('NMAX'))

  // --- Test 2: second prompt → ANOTHER new session, both in history ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const input2 = page.locator('input[aria-label]')
  await input2.fill('MacBook Pro M4 45 juta cicilan 12 bulan, gaji 10 juta per bulan')
  await page.getByRole('button', { name: /^analy[sz]e$|^analisis$/i }).click()
  await page.waitForURL(/\/analyze\/scenario_/, { timeout: 15000 })
  const id2 = page.url().match(/scenario_\d+/)?.[0]
  ok('T2 second session created', Boolean(id2) && id2 !== id1, `${id1} -> ${id2}`)

  const stored2 = await page.evaluate(() => JSON.parse(localStorage.getItem('axiom-storage') || 'null'))
  const sessions2 = stored2?.state?.history || []
  ok('T2 two sessions persisted', sessions2.length === 2, `count=${sessions2.length}`)

  // Both appear in /analyze history
  await page.goto(BASE + '/analyze', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const histText = await page.content()
  const hasId1Name = histText.includes(sessions2[sessions2.length - 1]?.scenario?.item_name || '§none§')
  ok('T2 history hub lists older session', hasId1Name)

  // Dashboard Recent Analysis lists both
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const dash = await page.content()
  ok('T3 dashboard recent shows newest item', dash.includes(String(sessions2[0]?.scenario?.item_name || '§none§').slice(0, 12)))
  ok('T3 dashboard recent shows older item', dash.includes(String(sessions2[1]?.scenario?.item_name || '§none§').slice(0, 12)))

  // --- Test 4: refresh on /analyze/{id} still loads ---
  await page.goto(`${BASE}/analyze/${sessions2[0].id}`, { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const notFoundAfterRefresh = await page.getByText(/sessionnotfound|tidak ditemukan|not found/i).count()
  ok('T4 refresh persists session', notFoundAfterRefresh === 0 && page.url().includes(sessions2[0].id))
} catch (err) {
  ok('SCRIPT COMPLETED', false, String(err).slice(0, 300))
} finally {
  await browser.close()
  const failed = results.filter(r => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  process.exit(failed.length ? 1 : 0)
}
