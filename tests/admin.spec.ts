import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { events } from '../src/data/events'
import { causeDistractors } from '../src/data/causeDistractors'
import type { HistoricalEvent } from '../src/types/history'

function row(event: HistoricalEvent, published = true, stamp = new Date().toISOString()) {
  return {
    slug: event.id,
    title: event.title,
    summary: event.clue,
    description: event.description,
    year: event.year,
    location_name: event.location,
    latitude: event.coordinates[0],
    longitude: event.coordinates[1],
    history_scope: event.scope,
    country: event.country ?? 'Philippines',
    editorial_note: event.note ?? null,
    where_prompt: event.wherePrompt ?? null,
    source_summary: event.source,
    cause_distractors: event.distractors ?? causeDistractors[event.id],
    is_published: published,
    is_deleted: false,
    updated_at: stamp,
    event_people: [
      {
        role: event.role,
        is_primary: true,
        historical_people: {
          slug: event.person.id,
          name: event.person.name,
          short_bio: event.person.bio,
          image_url: event.person.image,
          image_position: event.person.imagePosition ?? '50% 25%',
        },
      },
    ],
    event_causes: event.causes.map((description, sort_order) => ({ description, sort_order })),
    event_sequence: event.sequence.map((description, sort_order) => ({ description, sort_order })),
  }
}
async function mockBackend(page: Page, admin = true) {
  const user = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  }
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
      }),
    ).toString('base64url'),
    'test-signature',
  ].join('.')
  let rows = events.map((e) => row(e))
  let saves = 0
  let removes = 0
  await page.route('https://gunita-test.supabase.co/**', async (route) => {
    const url = new URL(route.request().url())
    const send = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/auth/v1/token')
      return send({
        access_token: token,
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user,
      })
    if (url.pathname === '/auth/v1/user') return send(user)
    if (url.pathname === '/auth/v1/logout') return send({})
    if (url.pathname === '/rest/v1/rpc/is_admin') return send(admin)
    if (url.pathname === '/rest/v1/historical_events')
      return send(
        rows.filter(
          (r) =>
            !r.is_deleted && (url.searchParams.get('is_published') !== 'eq.true' || r.is_published),
        ),
      )
    if (url.pathname === '/rest/v1/rpc/admin_save_event') {
      if (!admin) return send({ message: 'Admin access required' }, 403)
      const body = route.request().postDataJSON()
      const event = body.p_event as HistoricalEvent
      rows = rows.filter((r) => r.slug !== event.id)
      rows.push(row(event, body.p_published, new Date(Date.now() + saves + 1).toISOString()))
      saves++
      return send(event.id)
    }
    if (url.pathname === '/rest/v1/rpc/admin_remove_event') {
      if (!admin) return send({ message: 'Admin access required' }, 403)
      const body = route.request().postDataJSON()
      rows = rows.map((r) =>
        r.slug === body.p_slug ? { ...r, is_deleted: true, is_published: false } : r,
      )
      removes++
      return send(null)
    }
    return send({ message: `Unhandled test request ${url.pathname}` }, 400)
  })
  return { getSaves: () => saves, getRemoves: () => removes }
}
async function login(page: Page) {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible()
  await page.getByLabel('Email address').fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
test('admin signs in, views, creates, edits, publishes and removes a question', async ({
  page,
}) => {
  const backend = await mockBackend(page)
  await login(page)
  await expect(page.getByRole('heading', { name: 'Question library' })).toBeVisible()
  await expect(page.locator('.admin-question-row')).toHaveCount(124)
  await page.getByRole('button', { name: 'View Battle of Mactan', exact: true }).click()
  await expect(page.locator('.admin-preview')).toContainText('Lapulapu')
  await page.getByRole('button', { name: 'Back to library' }).click()
  await page.getByRole('button', { name: 'Add question' }).click()
  await page.getByLabel('Event title', { exact: true }).fill('Apollo 11 review copy')
  await page.getByLabel('Year (use a negative number for BCE)').fill('1969')
  await page.getByLabel('Clue shown before answering').fill(events[6].clue)
  await page.getByLabel('Historical explanation').fill(events[6].description)
  await page.getByLabel('Source URL', { exact: true }).fill(events[6].source)
  await page.getByLabel('Location name', { exact: true }).fill(events[6].location)
  await page.getByLabel('Country or geographic region').fill('United States')
  await page.getByLabel('Latitude', { exact: true }).fill('28.608')
  await page.getByLabel('Longitude', { exact: true }).fill('-80.604')
  await page.getByLabel('Question about the person').fill(events[6].role)
  await page.getByLabel('Person’s name').fill('Neil Armstrong')
  await page.getByLabel('Short context').fill(events[6].person.bio)
  await page.getByLabel('Neutral portrait URL or local image path').fill('/portraits/armstrong.jpg')
  await page.getByLabel('Correct causes (1–4, one per line)').fill(events[6].causes.join('\n'))
  await page
    .getByLabel('Clearly incorrect causes (2–4, one per line)')
    .fill(causeDistractors.apollo.join('\n'))
  await page
    .getByLabel('Stages in the correct chronological order (2–8, one per line)')
    .fill(events[6].sequence.join('\n'))
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(audit.violations.map((v) => v.id)).toEqual([])
  await page.getByRole('button', { name: 'Save question', exact: true }).click()
  await expect(
    page.getByText('Question saved. Published changes appear in new games.'),
  ).toBeVisible()
  await expect(page.locator('.admin-question-row')).toHaveCount(events.length + 1)
  await page.goto('/archive')
  await expect(page.locator('.archive-card')).toHaveCount(events.length)
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Edit Apollo 11 review copy', exact: true }).click()
  await page.getByLabel('Event title', { exact: true }).fill('Apollo 11 reviewed')
  await page
    .getByRole('checkbox', { name: 'Publish this question so it appears in new games' })
    .check()
  await page.getByRole('button', { name: 'Save question', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Apollo 11 reviewed' })).toBeVisible()
  await page.goto('/archive')
  await expect(page.getByRole('heading', { name: 'Apollo 11 reviewed' })).toBeVisible()
  await page.goto('/play')
  await page.getByRole('button', { name: 'When only' }).click()
  await page.getByRole('button', { name: 'Begin the expedition' }).click()
  const snapshot = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gunita-game-v1')!).state.catalog,
  )
  expect(snapshot.some((e: HistoricalEvent) => e.title === 'Apollo 11 reviewed')).toBe(true)
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Remove Apollo 11 reviewed', exact: true }).click()
  await page.getByRole('button', { name: 'Keep question' }).click()
  expect(backend.getRemoves()).toBe(0)
  await page.getByRole('button', { name: 'Remove Apollo 11 reviewed', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm removal' }).click()
  await expect(page.locator('.admin-question-row')).toHaveCount(124)
  expect(backend.getSaves()).toBe(2)
  expect(backend.getRemoves()).toBe(1)
  await page.goto('/archive')
  await expect(page.getByRole('heading', { name: 'Apollo 11 reviewed' })).toHaveCount(0)
})
test('an ordinary signed-in account cannot access question management', async ({ page }) => {
  await mockBackend(page, false)
  await login(page)
  await expect(page.getByRole('heading', { name: 'Admin access required.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add question' })).toHaveCount(0)
})
test('admin library and edit form fit a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockBackend(page)
  await login(page)
  await expect(page.locator('.admin-question-row')).toHaveCount(124)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results-admin/library-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Edit Battle of Mactan', exact: true }).click()
  await expect(page.getByLabel('Event title', { exact: true })).toHaveValue('Battle of Mactan')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results-admin/edit-mobile.png', fullPage: true })
})
