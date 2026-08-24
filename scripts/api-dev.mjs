// Local dev API runner — serves api/gemini.js (Vercel serverless function) at :3000
// so `vite` can proxy /api/* to it during development.
// Usage: node scripts/api-dev.mjs   (then: npm run dev in another terminal)
import http from 'node:http'
import handler from '../api/gemini.js'

const PORT = Number(process.env.API_PORT) || 3000

http.createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  req.body = Buffer.concat(chunks).toString('utf8') // string form; handler parses JSON itself
  // Express-style helpers so the Vercel handler's res.status(...).json(...) works.
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
  try {
    await handler(req, res)
  } catch (err) {
    console.error('[api-dev] unhandled:', err?.message || err)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal error' }))
  }
}).listen(PORT, () => console.log(`API dev server listening on http://127.0.0.1:${PORT}`))
