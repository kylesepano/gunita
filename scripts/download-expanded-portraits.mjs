import ts from 'typescript'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const source = await readFile('src/data/expandedEvents.ts', 'utf8')
const js = ts.transpileModule(
  source.replace(
    "import { bankPortraits } from './bankPortraits'",
    'const bankPortraits = {}',
  ),
  {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  },
).outputText
const { expandedEvents } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
await mkdir('public/portraits', { recursive: true })
const credits = {}

async function wikipediaThumbnail(title) {
  const apiUrl =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=480&titles=' +
    encodeURIComponent(title) +
    '&origin=*'
  const response = await fetch(apiUrl, { headers: { accept: 'application/json' } })
  if (!response.ok) return null
  const summary = await response.json()
  const page = Object.values(summary.query?.pages ?? {})[0]
  return page?.thumbnail?.source ?? null
}

async function commonsThumbnail(name) {
  const apiUrl =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=' +
    encodeURIComponent(name) +
    '&prop=imageinfo&iiprop=url&iiurlwidth=480&origin=*'
  const response = await fetch(apiUrl, { headers: { accept: 'application/json' } })
  if (!response.ok) return null
  const result = await response.json()
  const pages = Object.values(result.query?.pages ?? {})
  return pages.find((page) => page.imageinfo?.[0]?.thumburl)?.imageinfo?.[0]?.thumburl ?? null
}

for (const event of expandedEvents) {
  const article = event.source.split('/wiki/')[1]
  const title = decodeURIComponent(article).replaceAll('_', ' ')
  const image = (await wikipediaThumbnail(title)) || (await wikipediaThumbnail(event.person.name)) || (await commonsThumbnail(event.person.name))
  if (!image) throw new Error(`${event.person.name}: no portrait found`)
  const asset = await fetch(image)
  if (!asset.ok) throw new Error(`${event.person.name}: image ${asset.status}`)
  await writeFile(`public/portraits/bank-${event.id}.jpg`, Buffer.from(await asset.arrayBuffer()))
  credits[`bank-${event.id}`] = {
    person: event.person.name,
    event: event.title,
    sourcePage: event.source,
    imageUrl: image,
    licenseNote: 'Wikipedia article thumbnail; verify the underlying Wikimedia Commons license before public redistribution.',
  }
  process.stdout.write('.')
}
await writeFile('public/portraits/bank-credits.json', JSON.stringify(credits, null, 2))
console.log(`\nDownloaded ${expandedEvents.length} local bank portraits.`)
