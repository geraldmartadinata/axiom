// Hook usage vs import audit — finds hooks used but not imported from react.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'src'
const HOOKS = ['useState', 'useEffect', 'useMemo', 'useRef', 'useCallback', 'useContext', 'useReducer', 'useLayoutEffect', 'useId']

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(jsx|js)$/.test(e.name) ? [path.join(dir, e.name)] : []
  )
}

let problems = 0
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8')
  const used = new Set()
  for (const h of HOOKS) {
    if (new RegExp(`\\b${h}\\s*\\(`).test(src)) used.add(h)
  }
  if (used.size === 0) continue

  // collect all named imports from 'react'
  const reactImports = new Set()
  const re = /import\s*(type\s*)?{([^}]*)}\s*from\s*['"]react['"]/g
  let m
  while ((m = re.exec(src))) {
    m[2].split(',').map(s => s.trim().replace(/^type\s+/, '')).filter(Boolean).forEach(n => reactImports.add(n))
  }

  // useNavigate etc. come from react-router-dom, not react — exclude router hooks
  const missing = [...used].filter(h => !reactImports.has(h))
  if (missing.length) {
    console.log(`MISSING in ${file}: ${missing.join(', ')}`)
    console.log(`  current react import: ${/import\s*{[^}]*}\s*from\s*['"]react['"]/.exec(src)?.[0] || '(none)'}`)
    problems++
  }
}
console.log(problems === 0 ? 'OK: no missing react hook imports' : `${problems} file(s) with problems`)
