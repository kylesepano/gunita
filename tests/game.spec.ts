import { test, expect } from '@playwright/test'
test('guest completes ten rounds, reloads, and sees final statistics', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Let’s play', exact: true }).click()
  await page.getByRole('button', { name: 'Curious explorer' }).click()
  await page.getByRole('button', { name: 'Begin the expedition' }).click()
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Spin the roulette' }).click()
    await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible()
    if (i === 2) {
      await page.reload()
      await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible()
    }
    const category = await page.evaluate(
      () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.category,
    )
    if (category === 'who') await page.locator('.portrait-card').first().click()
    if (category === 'what') await page.locator('.event-options button').first().click()
    if (category === 'why') await page.locator('.cause-grid button').first().click()
    if (category === 'when')
      await page
        .getByRole('slider')
        .fill('1500')
        .catch(async () => {
          await page.getByRole('slider').focus()
          await page.keyboard.press('ArrowRight')
        })
    if (category === 'where') {
      await page.locator('.coordinate-input summary').click()
      await page.getByLabel('Latitude', { exact: true }).fill('14')
      await page.getByLabel('Longitude', { exact: true }).fill('121')
      await page.getByRole('button', { name: 'Place pin' }).click()
    }
    if (category === 'how')
      await page.locator('.sequence-list li').first().getByRole('button', { name: /down/ }).click()
    await page.getByRole('button', { name: 'Lock in answer' }).click()
    await expect(page.locator('.answer-reveal')).toBeVisible()
    await page
      .getByRole('button', { name: i === 9 ? 'See your discoveries' : 'Next chapter' })
      .click()
  }
  await expect(page).toHaveURL(/results/)
  await expect(page.getByRole('heading', { name: 'A little wiser than before.' })).toBeVisible()
  await expect(page.locator('.performance-row')).toHaveCount(6)
  await page.reload()
  await expect(page.locator('.final-score')).toBeVisible()
  expect(errors).toEqual([])
})
test('mobile layout, archive search and missing-cloud guest flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true })
  await page.goto('/play')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Begin the expedition' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/archive')
  await page.getByRole('textbox', { name: 'Search history' }).fill('Mactan')
  await expect(page.locator('.archive-card')).toHaveCount(1)
  await page.goto('/auth')
  await expect(page.getByRole('link', { name: 'Play as guest' })).toBeVisible()
})
test('desktop landing screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true })
})
