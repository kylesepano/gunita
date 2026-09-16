import ts from 'typescript'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const source = await readFile('src/data/expandedEvents.ts', 'utf8')
const portraitsSource = await readFile('src/data/bankPortraits.ts', 'utf8')
const portraitsJs = ts.transpileModule(portraitsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
globalThis.__gunitaBankPortraits = (
  await import(`data:text/javascript;base64,${Buffer.from(portraitsJs).toString('base64')}`)
).bankPortraits
const bankPortraits = globalThis.__gunitaBankPortraits
const js = ts.transpileModule(
  source.replace(
    "import { bankPortraits } from './bankPortraits'",
    'const bankPortraits = globalThis.__gunitaBankPortraits',
  ),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  },
).outputText
const { expandedEvents } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
await mkdir('public/portraits', { recursive: true })
const credits = {}
for (const event of expandedEvents) {
  const initials = event.person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
  const hue = Math.abs([...event.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 760"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 35% 78%)"/><stop offset="1" stop-color="hsl(${(hue + 42) % 360} 38% 52%)"/></linearGradient></defs><rect width="640" height="760" fill="url(#g)"/><circle cx="320" cy="280" r="118" fill="#f4dfc6"/><path d="M140 760c16-184 103-270 180-270s164 86 180 270" fill="#344f71"/><path d="M208 266c20-104 205-130 225 9-30-36-72-48-114-35-44 14-72 33-111 26z" fill="#4b3b37"/><text x="320" y="670" fill="#fff" font-family="Arial,sans-serif" font-size="74" font-weight="700" text-anchor="middle">${initials}</text></svg>`
  const imagePath = bankPortraits[event.id] ?? `/portraits/bank-${event.id}.svg`
  if (!bankPortraits[event.id]) await writeFile(`public/portraits/bank-${event.id}.svg`, svg)
  credits[`bank-${event.id}`] = {
    person: event.person.name,
    event: event.title,
    sourcePage: event.source,
    imagePath,
    imageType: bankPortraits[event.id]
      ? 'Wikimedia thumbnail downloaded locally; verify attribution and license before production.'
      : 'Neutral illustration placeholder; replace with a licensed, non-occupational portrait in the admin editor when available.',
  }
}
await writeFile('public/portraits/bank-credits.json', JSON.stringify(credits, null, 2))
console.log(`Prepared ${expandedEvents.length} local bank portraits and credits.`)
