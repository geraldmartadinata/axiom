import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Zense-style dev middleware: serves POST /api/gemini INLINE inside the Vite
 * dev server — no separate api-dev.mjs process, no proxy, one `npm run dev`.
 * Production on Vercel uses the real serverless function in api/gemini.js.
 * Fallback: when Gemini is unavailable (missing key / 429 / network), return
 * a mock extraction so the app always responds.
 */
function geminiDevPlugin() {
  return {
    name: 'gemini-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        // Express-style helpers for the Vercel handler
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
        }

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          req.body = Buffer.concat(chunks).toString('utf8')

          const mod = await import('./api/gemini.js')
          // Vite config bundler mangles the default export name; resolve defensively.
          const handler = mod.default ?? mod.handler ?? mod.handler2
          if (typeof handler !== 'function') {
            throw new Error(`gemini handler not found (keys: ${Object.keys(mod).join(',')})`)
          }
          await handler(req, res)
        } catch (err) {
          console.error('[gemini-dev] unhandled:', err?.message || err)
          if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Internal error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load .env so GEMINI_API_KEY is available to the dev middleware (server-side only).
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
  }

  return {
    plugins: [react(), tailwindcss(), geminiDevPlugin()],
    server: {
      port: 5173,
    },
  }
})
