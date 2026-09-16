import ts from 'typescript'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
const source = await readFile('src/data/events.ts', 'utf8')
const expandedSource = await readFile('src/data/expandedEvents.ts', 'utf8')
const supplementSource = await readFile('src/data/wikidataSupplement.ts', 'utf8')
const portraitsSource = await readFile('src/data/bankPortraits.ts', 'utf8')
const portraitsJs = ts.transpileModule(portraitsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { bankPortraits } = await import(
  `data:text/javascript;base64,${Buffer.from(portraitsJs).toString('base64')}`
)
globalThis.__gunitaBankPortraits = bankPortraits
const supplementJs = ts.transpileModule(supplementSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { wikidataSupplement } = await import(
  `data:text/javascript;base64,${Buffer.from(supplementJs).toString('base64')}`
)
const expandedJs = ts.transpileModule(
  expandedSource.replace(
    "import { bankPortraits } from './bankPortraits'",
    'const bankPortraits = globalThis.__gunitaBankPortraits',
  ),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  },
).outputText
const { expandedEvents } = await import(
  `data:text/javascript;base64,${Buffer.from(expandedJs).toString('base64')}`
)
const js = ts.transpileModule(
  source
    .replace(
      "import { expandedEvents } from './expandedEvents'",
      'const expandedEvents = globalThis.__gunitaExpandedEvents',
    )
    .replace(
      "import { wikidataSupplement } from './wikidataSupplement'",
      'const wikidataSupplement = globalThis.__gunitaWikidataSupplement',
    )
    .replace(
      /export const events: HistoricalEvent\[\] = \[\.\.\.coreEvents, \.\.\.expandedEvents, \.\.\.wikidataSupplement\]/,
      'export const events = [...coreEvents, ...expandedEvents, ...wikidataSupplement]',
    ),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  },
).outputText
globalThis.__gunitaExpandedEvents = expandedEvents
globalThis.__gunitaWikidataSupplement = wikidataSupplement
const { events } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const quote = (x) => (x == null ? 'null' : `'${String(x).replaceAll("'", "''")}'`)
const lines = [
  '-- Generated from src/data/events.ts. Run npm run seed:generate after editing content.',
  'begin;',
]
for (const e of events) {
  const country =
    e.country ??
    (e.scope === 'philippines'
      ? 'Philippines'
      : ({
          waterloo: 'Belgium',
          apollo: 'United States (launch site)',
          berlin: 'Germany',
          dday: 'France',
          constantinople: 'Türkiye',
        }[e.id] ?? 'Unknown'))
  const eid = `(select id from public.historical_events where slug=${quote(e.id)})`
  const pid = `(select id from public.historical_people where slug=${quote(e.person.id)})`
  lines.push(
    `insert into public.historical_events(slug,title,summary,description,year,location_name,latitude,longitude,country,history_scope,source_summary,editorial_note,where_prompt,is_published) values(${[e.id, e.title, e.clue, e.description].map(quote).join(',')},${e.year},${quote(e.location)},${e.coordinates.join(',')},${quote(country)},${[e.scope, e.source, e.note, e.wherePrompt].map(quote).join(',')},true) on conflict(slug) do update set title=excluded.title,summary=excluded.summary,description=excluded.description,year=excluded.year,location_name=excluded.location_name,latitude=excluded.latitude,longitude=excluded.longitude,country=excluded.country,source_summary=excluded.source_summary,editorial_note=excluded.editorial_note,where_prompt=excluded.where_prompt;`,
  )
  if (e.distractors?.length) {
    lines.push(
      `update public.historical_events set cause_distractors=${quote(JSON.stringify(e.distractors))}::jsonb where slug=${quote(e.id)};`,
    )
  }
  lines.push(
    `insert into public.historical_people(slug,name,short_bio,image_url,birth_year,death_year) values(${[e.person.id, e.person.name, e.person.bio, e.person.image, e.person.birthYear ?? null, e.person.deathYear ?? null].map(quote).join(',')}) on conflict(slug) do update set name=excluded.name,short_bio=excluded.short_bio,image_url=excluded.image_url,birth_year=excluded.birth_year,death_year=excluded.death_year;`,
  )
  lines.push(
    `insert into public.event_people(event_id,person_id,role,is_primary) values(${eid},${pid},${quote(e.role)},true) on conflict(event_id,person_id) do update set role=excluded.role;`,
  )
  for (const [i, text] of e.causes.entries())
    lines.push(
      `insert into public.event_causes(event_id,description,sort_order) values(${eid},${quote(text)},${i}) on conflict(event_id,sort_order) do update set description=excluded.description;`,
    )
  for (const [i, text] of e.sequence.entries())
    lines.push(
      `insert into public.event_sequence(event_id,description,sort_order) values(${eid},${quote(text)},${i}) on conflict(event_id,sort_order) do update set description=excluded.description;`,
    )
  for (const difficulty of ['easy', 'medium', 'hard'])
    lines.push(
      `insert into public.event_clues(event_id,difficulty,clue_text) values(${eid},${quote(difficulty)},${quote(e.clue)}) on conflict(event_id,difficulty) do update set clue_text=excluded.clue_text;`,
    )
  lines.push(
    `insert into public.event_sources(event_id,url,title,accessed_at,editorial_status) values(${eid},${quote(e.source)},${quote(e.title + ' — reference')},'2026-09-15',${quote(e.note ? 'needs_review' : 'reference_checked')}) on conflict(event_id,url) do nothing;`,
  )
}
lines.push('commit;')
await writeFile('supabase/seed.sql', lines.join('\n'))

const maxEditorBytes = 300_000
const body = lines.slice(2, -1)
const chunks = []
let chunk = []
let chunkBytes = 0
for (const statement of body) {
  const startsEvent = statement.startsWith('insert into public.historical_events')
  const statementBytes = Buffer.byteLength(statement) + 1
  if (startsEvent && chunk.length && chunkBytes + statementBytes > maxEditorBytes) {
    chunks.push(chunk)
    chunk = []
    chunkBytes = 0
  }
  chunk.push(statement)
  chunkBytes += statementBytes
}
if (chunk.length) chunks.push(chunk)

await rm('supabase/seed-parts', { recursive: true, force: true })
await mkdir('supabase/seed-parts', { recursive: true })
for (const [index, statements] of chunks.entries()) {
  const part = String(index + 1).padStart(2, '0')
  await writeFile(
    `supabase/seed-parts/${part}.sql`,
    [
      `-- Gunita seed, part ${index + 1} of ${chunks.length}. Run these files in numerical order.`,
      'begin;',
      ...statements,
      'commit;',
      '',
    ].join('\n'),
  )
}
await writeFile(
  'supabase/seed-parts/README.md',
  `# Supabase SQL Editor seed files\n\nThe SQL Editor cannot run the complete seed at once. Open and run 01.sql, then 02.sql, and continue in numerical order through ${String(chunks.length).padStart(2, '0')}.sql. Each file is an independent transaction and can safely be re-run.\n`,
)
console.log(`Generated ${events.length} events in ${chunks.length} SQL Editor seed parts.`)
