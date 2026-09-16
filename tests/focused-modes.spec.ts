import { test, expect } from '@playwright/test'
for (const mode of ['where', 'when'] as const) {
  test(`${mode} only: ten rounds skip roulette and survive reload`, async ({ page }) => {
    await page.goto('/play')
    await page.getByRole('button', { name: mode === 'where' ? 'Where only' : 'When only' }).click()
    await page.getByRole('button', { name: 'Begin the expedition' }).click()
    for (let i = 0; i < 10; i++) {
      await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Spin the roulette' })).toHaveCount(0)
      if (i === 3) {
        await page.reload()
        await expect(page.getByRole('button', { name: 'Lock in answer' })).toBeVisible()
      }
      expect(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.category,
        ),
      ).toBe(mode)
      if (mode === 'where') {
        await page.locator('.coordinate-input summary').click()
        await page.getByLabel('Latitude', { exact: true }).fill('14')
        await page.getByLabel('Longitude', { exact: true }).fill('121')
        await page.getByRole('button', { name: 'Place pin' }).click()
      } else {
        await page.getByRole('slider').focus()
        await page.keyboard.press('ArrowRight')
      }
      await page.getByRole('button', { name: 'Lock in answer' }).click()
      await page
        .getByRole('button', { name: i === 9 ? 'See your discoveries' : 'Next chapter' })
        .click()
    }
    await expect(page).toHaveURL(/results/)
    const rounds = await page.evaluate(
      () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.results,
    )
    expect(rounds).toHaveLength(10)
    expect(rounds.every((r: { category: string }) => r.category === mode)).toBe(true)
  })
}
test('branding is English, focused links work, and admin setup is discoverable', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page).toHaveTitle('GUNITA')
  await expect(page.locator('body')).not.toContainText(
    /Ikot ng Kasaysayan|Paikutin|SINO|SAAN|KAILAN|BAKIT|PAANO/,
  )
  await page.locator('.category-card').filter({ hasText: 'Where' }).click()
  await expect(page.getByRole('button', { name: 'Where only' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('link', { name: 'Admin', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View the current library' })).toBeVisible()
})
