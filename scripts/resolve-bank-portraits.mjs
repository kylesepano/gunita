import ts from 'typescript'
import { readFile, writeFile } from 'node:fs/promises'

const source = await readFile('src/data/expandedEvents.ts', 'utf8')
const js = ts.transpileModule(
  source.replace("import { bankPortraits } from './bankPortraits'", 'const bankPortraits = {}'),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  },
).outputText
const { expandedEvents } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
)

const titles = new Set()
for (const event of expandedEvents) {
  titles.add(decodeURIComponent(event.source.split('/wiki/')[1]).replaceAll('_', ' '))
  titles.add(event.person.name)
}
const thumbnails = new Map()
const titleList = [...titles]
for (let offset = 0; offset < titleList.length; offset += 40) {
  const batch = titleList.slice(offset, offset + 40)
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=480&titles=' +
    encodeURIComponent(batch.join('|')) +
    '&origin=*'
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'Gunita content review/1.0' },
  })
  if (!response.ok) throw new Error(`Wikipedia API failed: ${response.status}`)
  const result = await response.json()
  for (const page of Object.values(result.query?.pages ?? {})) {
    if (page.thumbnail?.source) thumbnails.set(page.title.toLowerCase(), page.thumbnail.source)
  }
}

const resolved = {}
for (const event of expandedEvents) {
  const personImage = thumbnails.get(event.person.name.toLowerCase())
  if (!personImage) continue
  const asset = await fetch(personImage, { headers: { 'user-agent': 'Gunita content review/1.0' } })
  if (!asset.ok) continue
  await writeFile(`public/portraits/bank-${event.id}.jpg`, Buffer.from(await asset.arrayBuffer()))
  resolved[event.id] = `/portraits/bank-${event.id}.jpg`
}
await writeFile(
  'src/data/bankPortraits.ts',
  `export const bankPortraits: Record<string, string> = ${JSON.stringify(resolved, null, 2)}\n`,
)
console.log(
  `Resolved ${Object.keys(resolved).length} Wikimedia portraits; remaining entries use neutral local illustrations.`,
)
