const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const root = path.join(__dirname, '..')
const env = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.local')),
  ...process.env,
}

const apiBase = String(env.REACT_APP_API_URL || '').replace(/\/$/, '')
const outPath = path.join(root, 'public', 'runtime-config.js')
const contents = `window.__API_BASE__=${JSON.stringify(apiBase)};\n`

fs.writeFileSync(outPath, contents, 'utf8')
console.log(`[runtime-config] wrote ${outPath}${apiBase ? ` → ${apiBase}` : ' (empty — dev proxy)'}`)
