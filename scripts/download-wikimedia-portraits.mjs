import { mkdir, readFile, writeFile } from 'node:fs/promises'

const links = JSON.parse(
  await readFile('.tmp-portrait-links.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
)
const byEvent = new Map()
for (const link of links) {
  const event = link.event?.value?.split('/').pop()
  const image = link.image?.value?.replace('http://', 'https://')
  if (event && image && !byEvent.has(event)) byEvent.set(event, image)
}

await mkdir('public/portraits/wikidata', { recursive: true })
const entries = [...byEvent.entries()]
const saved = []
let cursor = 0
async function worker() {
  while (cursor < entries.length) {
    const [qid, image] = entries[cursor++]
    try {
      const response = await fetch(`${image}?width=360`, { redirect: 'follow' })
      if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/'))
        continue
      await writeFile(
        `public/portraits/wikidata/${qid}.img`,
        Buffer.from(await response.arrayBuffer()),
      )
      saved.push(qid)
    } catch {
      // The neutral local fallback remains available when a thumbnail cannot be retrieved.
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker))
const map = Object.fromEntries(saved.map((qid) => [qid, `/portraits/wikidata/${qid}.img`]))
await writeFile(
  'src/data/wikimediaPortraits.ts',
  `// Generated from Wikimedia Commons thumbnails.\nexport const wikimediaPortraits: Record<string, string> = ${JSON.stringify(map, null, 2)}\n`,
)
console.log(`Saved ${saved.length} Wikimedia portrait thumbnails.`)
