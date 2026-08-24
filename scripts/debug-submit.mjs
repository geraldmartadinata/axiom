// Debug: what actually happens on submit?
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage()
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[console.${m.type()}]`, m.text().slice(0, 200)) })
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)))
page.on('requestfailed', r => console.log('[reqfail]', r.url().slice(0, 120)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

const btns = await page.getByRole('button').allInnerTexts()
console.log('buttons:', JSON.stringify(btns))

await page.locator('input[aria-label]').fill('Beli Yamaha NMAX 2024 harga 38 juta, DP 5 juta, tenor 2 tahun')
await page.getByRole('button', { name: /^analy[sz]e$|^analisis$/i }).click()

await page.waitForTimeout(5000)
console.log('URL after:', page.url())
console.log('history:', await page.evaluate(() => localStorage.getItem('axiom-history')))
const err = await page.locator('.border-terracotta\\/30').count()
if (err) console.log('errorbox:', await page.locator('.border-terracotta\\/30').innerText())
await browser.close()
