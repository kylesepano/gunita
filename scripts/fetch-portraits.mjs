import { readFile, writeFile, mkdir } from 'node:fs/promises'

// Refresh only the reviewed, pinned assets. Discovery must be curated separately.
const credits = JSON.parse(await readFile('public/portraits/credits.json', 'utf8'))
await mkdir('public/portraits', { recursive: true })
for (const asset of credits) {
  const response = await fetch(asset.url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error(`Could not download the reviewed image for ${asset.id}`)
  }
  await writeFile(`public/portraits/${asset.id}.jpg`, Buffer.from(await response.arrayBuffer()))
  console.log(`Refreshed ${asset.id}; attribution retained in credits.json`)
}
