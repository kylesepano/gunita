import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const report = []
for (const route of ['/', '/play', '/archive', '/auth']) {
  await page.goto(`http://127.0.0.1:5173${route}`)
  await page.locator('.site-header').waitFor()
  await page.evaluate(() => document.fonts.ready)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  report.push({ route, violations: result.violations })
  console.log(
    route,
    JSON.stringify(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, message: n.failureSummary })),
      })),
    ),
  )
}
await writeFile('test-results/accessibility.json', JSON.stringify(report, null, 2))
await browser.close()
