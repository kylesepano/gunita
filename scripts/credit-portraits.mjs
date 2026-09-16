import { readFile, writeFile } from 'node:fs/promises'
const credits = JSON.parse(await readFile('public/portraits/credits.json', 'utf8'))
const strip = (value) => (value ?? '').replace(/<[^>]*>/g, '').replaceAll('&amp;', '&')
for (const c of credits) {
  const imagePath = new URL(c.url).pathname
  let filename = imagePath.includes('/thumb/')
    ? decodeURIComponent(imagePath.split('/').at(-2))
    : decodeURIComponent(imagePath.split('/').at(-1))
  if (c.id === 'lapulapu') filename = 'Lapu-Lapu Monument Illuminated.jpg'
  const query = new URLSearchParams({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '400',
    format: 'json',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${query}`, {
    signal: AbortSignal.timeout(20000),
  })
  const data = await response.json()
  const page = Object.values(data.query.pages)[0]
  const info = page.imageinfo?.[0]
  if (!info) throw new Error(`Missing Commons file ${filename}`)
  c.filePage = info.descriptionurl
  c.author = strip(info.extmetadata.Artist?.value)
  c.license = strip(info.extmetadata.LicenseShortName?.value)
  c.licenseUrl = info.extmetadata.LicenseUrl?.value ?? c.filePage
  c.credit = strip(info.extmetadata.Credit?.value)
  if (c.id === 'lapulapu') {
    const image = await fetch(info.thumburl ?? info.url)
    if (!image.ok) throw new Error('Statue download failed')
    await writeFile('public/portraits/lapulapu.jpg', Buffer.from(await image.arrayBuffer()))
    c.url = info.thumburl ?? info.url
  }
  console.log(`${c.id}: ${c.license} / ${c.author}`)
}
await writeFile('public/portraits/credits.json', JSON.stringify(credits, null, 2))
const escape = (x) =>
  String(x).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
await writeFile(
  'public/portraits/credits.html',
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gunita · Image credits</title><style>body{max-width:760px;margin:60px auto;padding:24px;background:#f8f7f2;color:#354a3b;font:15px/1.8 system-ui}h1{font:46px Georgia}article{border-top:1px solid #ddd;padding:20px 0}a{color:#786137}img{width:70px;height:90px;object-fit:cover;float:right}</style><a href="/">← Gunita</a><h1>Faces from the archive.</h1><p>Images are hosted locally. Display crops are made with CSS; source files are unaltered thumbnails. Historical paintings and commemorative statues are depictions, not photographs of the people themselves.</p>${credits.map((c) => `<article><img src="${c.id}.jpg" alt="${escape(c.title.replaceAll('_', ' '))}"><h2>${escape(c.title.replaceAll('_', ' '))}</h2><p>${escape(c.author)} · <a href="${escape(c.licenseUrl)}">${escape(c.license)}</a></p><a href="${escape(c.filePage)}">Original file and full attribution</a><p>${escape(c.credit)}</p><p>${escape(c.note)}</p></article>`).join('')}</html>`,
)
