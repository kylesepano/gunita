import { writeFile } from 'node:fs/promises'

const dates = []
for (let month = 1; month <= 12; month++)
  for (let day = 1; day <= new Date(2024, month, 0).getDate(); day++)
    dates.push([String(month).padStart(2, '0'), String(day).padStart(2, '0')])

const responses = await Promise.all(
  dates.map(async ([month, day]) => {
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`)
      return response.ok ? await response.json() : { events: [] }
    } catch {
      return { events: [] }
    }
  }),
)
const candidates = []
for (const response of responses)
  for (const event of response.events ?? []) {
    const page = event.pages?.[0]
    if (event.year >= 1000 && event.year <= 2020 && page?.title && page?.content_urls?.desktop?.page)
      candidates.push({ year: event.year, text: event.text, title: page.title, source: page.content_urls.desktop.page })
  }
const unique = [...new Map(candidates.map((entry) => [`${entry.year}:${entry.title}`, entry])).values()]
const coordinates = new Map()
for (let index = 0; index < unique.length; index += 50) {
  const titles = unique.slice(index, index + 50).map((entry) => entry.title).join('|')
  const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates&colimit=1&titles=${encodeURIComponent(titles)}`
  try {
    const response = await fetch(endpoint)
    const pages = Object.values((await response.json()).query?.pages ?? {})
    for (const page of pages) if (page.title && page.coordinates?.[0]) coordinates.set(page.title, page.coordinates[0])
  } catch {}
}
const selected = unique.filter((entry) => coordinates.has(entry.title)).slice(0, 500).map((entry, index) => {
  const point = coordinates.get(entry.title)
  return { id: `on-this-day-${entry.year}-${index}`, ...entry, lat: point.lat, lon: point.lon }
})
if (selected.length < 488) throw new Error(`Only ${selected.length} source-backed, mapped historical entries were found.`)
const output = `import type { HistoricalEvent } from '../types/history'\n\nconst records = ${JSON.stringify(selected, null, 2)}\n\nexport const onThisDaySupplement: HistoricalEvent[] = records.map((entry) => ({\n  id: entry.id, title: entry.title, year: entry.year, location: 'Mapped historical location', coordinates: [entry.lat, entry.lon], scope: 'world', country: 'World',\n  clue: entry.text, description: entry.text,\n  person: { id: entry.id + '-subject', name: entry.title, bio: 'Subject associated with this source-backed historical record', image: '/portraits/historical-figure.svg' },\n  role: 'Which subject is associated with this historical context?',\n  causes: ['Conditions described in the historical record', 'Wider developments during this period'],\n  distractors: [], sequence: ['Earlier conditions developed', 'The recorded event unfolded', 'The event became part of the historical record', 'Its effects continued'],\n  source: entry.source, wherePrompt: 'Where did this recorded event take place? Pin the location.',\n}))\n`
await writeFile('src/data/onThisDaySupplement.ts', output)
console.log(`Generated ${selected.length} mapped historical contexts from Wikimedia.`)
