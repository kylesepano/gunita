import { readFile, writeFile } from 'node:fs/promises'
const credits = JSON.parse(await readFile('public/portraits/credits.json', 'utf8'))
const escape = (x) =>
  String(x ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;')
await writeFile(
  'public/portraits/credits.html',
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gunita · Image credits</title><style>body{max-width:800px;margin:40px auto;padding:24px;background:#f5f7fa;color:#25394f;font:16px/1.8 system-ui}h1{font-size:36px}article{border-top:1px solid #dce2e9;padding:24px 0;min-height:150px}a{color:#36587e}img{width:90px;height:105px;object-fit:cover;float:right;margin-left:16px}h2{font-size:23px}</style></head><body><a href="/">← Gunita</a><h1>Portrait credits</h1><p>Images are hosted locally. Display framing uses CSS. Paintings and statues are historical depictions, not photographs of the people themselves.</p>${credits.map((c) => `<article><img src="${c.id}.jpg" alt="${escape(c.title.replaceAll('_', ' '))}"><h2>${escape(c.title.replaceAll('_', ' '))}</h2><p>${escape(c.author)} · <a href="${escape(c.licenseUrl)}">${escape(c.license)}</a></p><a href="${escape(c.filePage)}">Original image and full attribution</a><p>${escape(c.credit)}</p><p>${escape(c.note)}</p></article>`).join('')}</body></html>`,
)
