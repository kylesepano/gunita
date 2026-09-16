import { readFile, writeFile } from 'node:fs/promises'

const source = JSON.parse(
  await readFile('.tmp-events.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
)
const unique = new Map()

for (const item of source) {
  const title = item.eventLabel?.value
  const qid = item.event?.value?.split('/').pop()
  const point = item.coord?.value?.match(/^Point\(([-.\d]+) ([-.\d]+)\)$/)
  if (!title || !qid || !point || unique.has(title)) continue
  unique.set(title, {
    id: `wikidata-${qid.toLowerCase()}`,
    title,
    year: Number(item.date.value.slice(0, 4)),
    lat: Number(point[2]),
    lon: Number(point[1]),
    country: item.countryLabel.value,
    person: item.personLabel.value,
    birthYear: Number(item.birth.value.match(/-?\d{1,4}/)?.[0]) || undefined,
    qid,
  })
}

const rows = [...unique.values()]
if (rows.length < 376)
  throw new Error(`Expected at least 376 unique imported events; received ${rows.length}.`)

const output =
  `import type { HistoricalEvent } from '../types/history'\n\n` +
  `// Generated from a Wikidata event query on 2026-09-16. Each item keeps its Wikidata source URL.\n` +
  `// Review entries before editorial publication; this bank supplies broad quiz coverage.\n` +
  `type ImportedEvent = { id: string; title: string; year: number; lat: number; lon: number; country: string; person: string; birthYear?: number; qid: string }\n\n` +
  `const imported: ImportedEvent[] = ${JSON.stringify(rows, null, 2)}\n\n` +
  `function nearbyAlternatives(event: ImportedEvent) {\n` +
  `  const byYear = (left: ImportedEvent, right: ImportedEvent) => Math.abs(left.year - event.year) - Math.abs(right.year - event.year)\n` +
  `  const candidates = imported.filter((candidate) => candidate.id !== event.id).sort(byYear)\n` +
  `  return [...candidates.filter((candidate) => candidate.country === event.country), ...candidates.filter((candidate) => candidate.country !== event.country)]\n` +
  `    .slice(0, 2).map((candidate) => \`Conditions surrounding \${candidate.title}\`)\n` +
  `}\n\n` +
  `export const wikidataSupplement: HistoricalEvent[] = imported.map((event) => ({\n` +
  `  id: event.id, title: event.title, year: event.year,\n` +
  `  location: \`Historical site in \${event.country}\`, coordinates: [event.lat, event.lon],\n` +
  `  scope: event.country === 'Philippines' ? 'philippines' : 'world', country: event.country,\n` +
  `  clue: \`This event is a significant moment in history. Study its people, timing, and setting.\`,\n` +
  `  description: \`\${event.title} took place in \${event.year}. Use the linked source for further historical context.\`,\n` +
  `  person: { id: \`\${event.id}-person\`, name: event.person, bio: 'A historical figure associated with this event', image: '/portraits/historical-figure.svg', birthYear: event.birthYear },\n` +
  `  role: 'Which historical figure was associated with this event?',\n` +
  `  causes: [\`Conditions and decisions surrounding \${event.title}\`, \`Wider changes affecting \${event.country} during this period\`],\n` +
  `  distractors: nearbyAlternatives(event),\n` +
  `  sequence: [\`Earlier conditions shaped the context for \${event.title}\`, 'Leaders and communities acted at the historical site', \`\${event.title} unfolded in \${event.year}\`, 'Its consequences continued beyond the immediate event'],\n` +
  `  source: \`https://www.wikidata.org/wiki/\${event.qid}\`,\n` +
  `  note: 'Imported research entry. Review the linked source and replace the generated summary before publication.',\n` +
  `  wherePrompt: \`Where did \${event.title} take place? Pin the location.\`,\n` +
  `}))\n`

await writeFile('src/data/wikidataSupplement.ts', output)
console.log(`Generated ${rows.length} Wikidata-backed supplemental events.`)
