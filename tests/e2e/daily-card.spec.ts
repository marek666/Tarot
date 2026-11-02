import { expect, test, type Page } from '@playwright/test'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

async function openDailyCard(page: Page): Promise<void> {
  await navigateMode(page, 'Karta dne')
  await expect(page.locator('.daily-card')).toBeVisible()
}

test('Karta dne zůstane stejná po reloadu a změna oblasti ji nepřelosuje', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await openDailyCard(page)

  const daily = page.locator('.daily-card')
  const cardId = await daily.getAttribute('data-card-id')
  const orientation = await daily.getAttribute('data-orientation')
  await page.getByRole('button', { name: 'Vztahy', exact: true }).click()
  await expect(daily).toHaveAttribute('data-area', 'relationships')
  await expect(page.getByText('Souvislost s tradičním významem')).toBeVisible()
  await expect(page.getByText('Otázka k zamyšlení')).toBeVisible()
  await expect(daily).toHaveAttribute('data-card-id', cardId!)
  await expect(daily).toHaveAttribute('data-orientation', orientation!)

  await page.reload()
  await expect(page.locator('.desktop-nav button').filter({ hasText: 'Výklady' })).toHaveAttribute('aria-pressed', 'true')
  await expect(daily).toHaveAttribute('data-card-id', cardId!)
  await expect(daily).toHaveAttribute('data-orientation', orientation!)
  await expect(daily).toHaveAttribute('data-area', 'relationships')
})

test('uložená obrácená Karta dne zobrazí obrácenou ilustraci i význam', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    localStorage.setItem('tarot-trainer:daily-card', JSON.stringify({
      version: 1,
      localDate: date,
      cardId: 'major-14-temperance',
      orientation: 'reversed',
      area: 'growth',
    }))
  })
  await page.reload()
  await openDailyCard(page)

  const daily = page.locator('.daily-card')
  await expect(daily).toHaveAttribute('data-card-id', 'major-14-temperance')
  await expect(daily).toHaveAttribute('data-orientation', 'reversed')
  await expect(daily.locator('figure img')).toHaveClass(/reversed/)
  await expect(daily.getByText('Obrácená poloha', { exact: true }).first()).toBeVisible()
  await expect(daily.getByText(/Osobní rozvoj · Obrácená poloha/)).toBeVisible()
})

test('Karta dne nemění hlavní balíček, Shuffle ani studijní pokrok', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await page.getByRole('button', { name: 'Vybrat kartu', exact: true }).click()
  await page.locator('.picker-card').nth(24).click()
  await page.getByLabel('Shuffle').check()

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  await openDailyCard(page)
  const dailyCardId = await page.locator('.daily-card').getAttribute('data-card-id')
  await page.getByRole('button', { name: 'Práce', exact: true }).click()
  await navigateMode(page, 'Učení')
  await navigateMode(page, 'Karta dne')
  await expect(page.locator('.daily-card')).toHaveAttribute('data-card-id', dailyCardId!)
  await expect(page.locator('.daily-card')).toHaveAttribute('data-area', 'work')
  await navigateMode(page, 'Učení')

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  expect(after.deckOrderIds).toEqual(before.deckOrderIds)
  expect(after.currentIndex).toBe(before.currentIndex)
  expect(after.orientations).toEqual(before.orientations)
  expect(after.shuffleEnabled).toBe(true)
  expect(after.studyProgress).toEqual(before.studyProgress)
})

test('oblíbená Karta dne se projeví ve společném filtru', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    localStorage.clear()
    localStorage.setItem('tarot-trainer:daily-card', JSON.stringify({
      version: 1,
      localDate: date,
      cardId: 'cups-07',
      orientation: 'upright',
      area: 'general',
    }))
  })
  await page.reload()
  await openDailyCard(page)
  await page.getByRole('button', { name: 'Přidat Sedmička pohárů do oblíbených' }).click()
  await navigateMode(page, 'Prohlížení')
  await page.getByRole('button', { name: 'Vybrat kartu', exact: true }).click()
  await page.getByLabel(/Pouze oblíbené/).check()

  await expect(page.locator('.picker-card')).toHaveCount(1)
  await expect(page.locator('.picker-card')).toHaveAttribute('data-card-id', 'cups-07')
})

test('nový simulovaný kalendářní den vytvoří nový denní záznam', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install({ time: new Date('2026-11-02T10:00:00') })
  await openFreshApp(page)
  await openDailyCard(page)
  const firstDate = await page.locator('.daily-card').evaluate(() =>
    JSON.parse(localStorage.getItem('tarot-trainer:daily-card')!).localDate,
  )

  await page.clock.setSystemTime(new Date('2026-11-03T10:00:00'))
  await page.reload()
  const secondDate = await page.locator('.daily-card').evaluate(() =>
    JSON.parse(localStorage.getItem('tarot-trainer:daily-card')!).localDate,
  )

  expect(firstDate).toBe('2026-11-02')
  expect(secondDate).toBe('2026-11-03')
})

test('Karta dne zůstane dostupná offline včetně výkladu a ilustrace', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await openDailyCard(page)
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await page.reload()
  await expect(page.locator('.daily-card figure img')).toBeVisible()

  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.daily-card')).toBeVisible()
  await expect(page.getByText('Otázka k zamyšlení')).toBeVisible()
  expect(await page.locator('.daily-card figure img').evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )).toBe(true)
  await context.setOffline(false)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`Karta dne nemá přetékání na ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await openFreshApp(page)
    await openDailyCard(page)

    expect(await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )).toBeLessThanOrEqual(1)
    await expect(page.locator('.daily-card figure img')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Obecný výklad', exact: true })).toBeVisible()

    if (viewport.width === 390 || viewport.width === 1440) {
      await page.screenshot({
        path: testInfo.outputPath(`daily-card-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      })
    }
  })
}

async function navigateMode(page: import('@playwright/test').Page, name: string): Promise<void> {
  const desktop = page.locator('.site-header .desktop-nav').getByRole('button', { name: name === 'Karta dne' ? 'Výklady' : name, exact: true })
  if (await desktop.isVisible()) {
    await desktop.click()
  } else {
    await page.getByRole('button', { name: 'Otevřít menu' }).click()
    await page.getByRole('dialog', { name: 'Navigace Tarot Trainer' }).getByRole('button', { name: name === 'Karta dne' ? 'Výklady' : name, exact: true }).click()
  }
}
