import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { events } from '../src/data/events'
import { generateChallenge } from '../src/game/questionGenerator'
import { categories } from '../src/game/roulette'
for (const { type } of categories) {
  test(`${type}: interactive answer, reveal and mobile accessibility`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/play')
    await page.getByRole('button', { name: 'Begin the expedition' }).click()
    const event = events[0]
    const challenge = generateChallenge(event, 'easy')
    await page.evaluate(
      ({ type, challenge, event }) => {
        const saved = JSON.parse(localStorage.getItem('gunita-game-v1')!)
        Object.assign(saved.state, {
          category: type,
          challenge,
          deck: [event.id, ...saved.state.deck.slice(1)],
          phase: 'answering',
          difficulty: 'easy',
          startedAt: Date.now(),
        })
        localStorage.setItem('gunita-game-v1', JSON.stringify(saved))
      },
      { type, challenge, event },
    )
    await page.reload()
    await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible()
    if (type === 'who') {
      await expect(page.locator('.portrait-card img')).toHaveCount(8)
      expect(
        await page
          .locator('.portrait-card img')
          .evaluateAll((imgs) =>
            imgs.every(
              (img) =>
                (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      ).toBe(true)
      await page.getByRole('button', { name: /Lapulapu/ }).click()
    }
    if (type === 'where') {
      await page.locator('.coordinate-input summary').click()
      await page.getByLabel('Latitude', { exact: true }).fill(String(event.coordinates[0]))
      await page.getByLabel('Longitude', { exact: true }).fill(String(event.coordinates[1]))
      await page.getByRole('button', { name: 'Place pin' }).click()
    }
    if (type === 'when') await page.getByRole('button', { name: '1521', exact: true }).click()
    if (type === 'what') await page.getByRole('button', { name: /Battle of Mactan/ }).click()
    if (type === 'why')
      for (const cause of event.causes)
        await page.getByRole('button', { name: cause, exact: true }).click()
    if (type === 'how') {
      for (let index = 0; index < event.sequence.length; index++) {
        const item = event.sequence[index]
        let current = await page.locator('.sequence-list li p').allTextContents()
        while (current.indexOf(item) > index) {
          await page.getByRole('button', { name: `Move ${item} up`, exact: true }).click()
          current = await page.locator('.sequence-list li p').allTextContents()
        }
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
    await page.getByRole('button', { name: 'Lock in answer' }).click()
    await expect(page.locator('.answer-reveal')).toBeVisible()
    if (type === 'who') {
      await expect(page.locator('.portrait-card.correct-answer')).toHaveCount(1)
      await expect(page.locator('.portrait-card.correct-answer')).toContainText('Lapulapu')
      await expect(page.locator('.portrait-card.correct-answer')).toContainText('Correct answer')
    }
    if (type === 'why') {
      await expect(page.locator('.cause-grid > button.correct-answer')).toHaveCount(
        event.causes.length,
      )
      await expect(page.locator('.cause-grid > button.incorrect-answer')).toHaveCount(
        challenge.causes.filter((cause) => !cause.correct).length,
      )
      await expect(page.locator('.cause-grid')).toContainText('Correct cause')
      await expect(page.locator('.cause-grid')).toContainText('Incorrect cause')
    }
    const result = await page.evaluate(
      () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.results[0],
    )
    expect(result.breakdown.accuracy).toBe(1)
    if (type === 'where') {
      await expect(page.getByText(/0 km from the target/)).toBeVisible()
      await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(3)
    }
    await page.screenshot({ path: `test-results/challenge-${type}-mobile.png`, fullPage: true })
  })
}
test('normal-motion roulette lands on its preselected segment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/play')
  await page.getByRole('button', { name: 'Begin the expedition' }).click()
  await page.getByRole('button', { name: 'Spin the roulette' }).click()
  await expect(page.getByRole('button', { name: 'Finding your next chapter…' })).toBeDisabled()
  const chosen = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.category,
  )
  await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible({ timeout: 7000 })
  const category = categories.find((c) => c.type === chosen)!
  await expect(page.locator('.challenge-label')).toContainText(category.english)
})
