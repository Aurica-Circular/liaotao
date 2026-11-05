// stats.mjs — Readable table of the last generations, from Liaotao's JSON log
//
// Usage: npm run stats -- [count] [--file <path>]
// Default: last 10 generations from ~/.local/share/liaotao/logs/app.log
// (path_manager.logs_dir in config/default.toml).

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const fileFlag = args.indexOf('--file')
const file = fileFlag >= 0 ? args[fileFlag + 1] : join(homedir(), '.local/share/liaotao/logs/app.log')
const count = Number(args.find((a, i) => /^\d+$/.test(a) && i !== fileFlag + 1) ?? 10)

if (!existsSync(file)) {
  console.error(`No log file at ${file}`)
  process.exit(1)
}

// Older lines wrote optional numbers as "Some(123)" / "None".
const num = (v) => {
  if (v === undefined || v === null || v === 'None') return null
  const m = String(v).match(/^Some\((.*)\)$/)
  const n = Number(m ? m[1] : v)
  return Number.isFinite(n) ? n : null
}

const rows = readFileSync(file, 'utf8')
  .split('\n')
  .filter((line) => line.includes('"generation finished"'))
  .map((line) => {
    try { return JSON.parse(line) } catch { return null }
  })
  .filter(Boolean)
  .slice(-count)

if (rows.length === 0) {
  console.log('No generation logged yet.')
  process.exit(0)
}

const sec = (ms) => (ms === null ? '-' : `${(ms / 1000).toFixed(1)} s`)
const when = (iso) => {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const table = rows.map(({ timestamp, fields: f }) => {
  const speed = num(f.speed)
  const unit = f.speed_unit === 'tokens/s' ? 'tok/s' : 'chars/s'
  return {
    'When': when(timestamp),
    'Engine': f.engine,
    'Model': f.model,
    'Total': sec(num(f.duration_ms)),
    'First word': sec(num(f.first_token_ms)),
    'Thinking': sec(num(f.thinking_ms)),
    'Writing': sec(num(f.writing_ms)),
    'Speed': speed === null ? '-' : `${speed} ${unit}`,
    'Tokens': num(f.completion_tokens) ?? '-',
    'Stopped': f.stopped ? 'yes' : '',
  }
})

const cols = Object.keys(table[0])
const width = Object.fromEntries(cols.map((c) => [c, Math.max(c.length, ...table.map((r) => String(r[c]).length))]))
const line = (r) => cols.map((c) => String(r[c]).padEnd(width[c])).join('  ')

console.log(line(Object.fromEntries(cols.map((c) => [c, c]))))
console.log(cols.map((c) => '─'.repeat(width[c])).join('  '))
table.forEach((r) => console.log(line(r)))
console.log(`\n${rows.length} generation(s) · ${file}`)
