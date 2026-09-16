import { readFile, writeFile } from 'node:fs/promises'
const credits = JSON.parse(await readFile('public/portraits/credits.json', 'utf8'))
const replacements = { armstrong: 'Neil Armstrong at Congressional Gold Medal Ceremony.jpg' }
// Only use verified Commons files. Armstrong's civilian photo replaces the spacesuit image.
for (const [id, filename] of Object.entries(replacements)) {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '600',
    format: 'json',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  const data = await response.json()
  const info = Object.values(data.query.pages)[0]?.imageinfo?.[0]
  if (!info) {
    console.log(`No verified file for ${id}; existing asset retained.`)
    continue
  }
  const asset = await fetch(info.thumburl ?? info.url)
  if (!asset.ok) throw new Error(`Failed image download: ${id}`)
  await writeFile(`public/portraits/${id}.jpg`, Buffer.from(await asset.arrayBuffer()))
  const c = credits.find((c) => c.id === id)
  c.url = info.thumburl ?? info.url
  c.filePage = info.descriptionurl
  c.note =
    'Civilian portrait, selected to avoid occupational clothing or equipment as an answer cue.'
  const strip = (value) =>
    (value ?? '')
      .replace(/<[^>]*>/g, '')
      .replaceAll('&amp;', '&')
      .trim()
  c.author = strip(info.extmetadata.Artist?.value)
  c.license = strip(info.extmetadata.LicenseShortName?.value)
  c.licenseUrl = info.extmetadata.LicenseUrl?.value ?? c.filePage
  c.credit = strip(info.extmetadata.Credit?.value)
  console.log(`${id}: ${info.descriptionurl}`)
}
await writeFile('public/portraits/credits.json', JSON.stringify(credits, null, 2))
