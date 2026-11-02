import { expect, test, type Page } from '@playwright/test'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

test('panel pokroku je pouze v Učení, je sbalený a zachová data i kartu', async ({ page }) => {
  await openFreshApp(page)
  await expect(page.locator('.study-progress')).toHaveCount(0)
  await navigateMode(page, 'Učení')

  const toggle = page.getByRole('button', { name: /Pokrok v učení — 0\/78/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!).studyProgress)
  await toggle.focus()
  await page.keyboard.press('Enter')

  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0')
  await expect(page.locator('.progress')).toHaveText('1/78')
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!).studyProgress)
  expect(after).toEqual(before)

  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  await page.reload()
  await expect(page.getByRole('button', { name: /Pokrok v učení/ })).toHaveAttribute('aria-expanded', 'true')
  await navigateMode(page, 'Prohlížení')
  await expect(page.locator('.study-progress')).toHaveCount(0)
})

test('Cesta Blázna umožní navigaci, výběr kapitoly, význam a návrat', async ({ page }) => {
  await openFreshApp(page)
  await navigateMode(page, 'Učení')
  await navigateMode(page, 'Cesta Blázna')

  await expect(page.locator('.progress')).toHaveText('1/22')
  await expect(page.getByRole('heading', { name: 'První krok' })).toBeVisible()
  await expect(page.getByText(/moderní výukový způsob/)).toBeVisible()
  await expect(page.locator('.study-progress')).toHaveCount(0)
  await expect(page.getByLabel('Shuffle')).toHaveCount(0)

  await page.getByRole('button', { name: 'Další →' }).click()
  await expect(page.locator('.progress')).toHaveText('2/22')
  await expect(page.getByRole('heading', { name: 'Co mám v rukou' })).toBeVisible()
  await page.getByRole('button', { name: '← Předchozí' }).click()
  await expect(page.locator('.progress')).toHaveText('1/22')
  await page.getByRole('button', { name: 'Další →' }).click()

  await page.getByRole('button', { name: /Vybrat kapitolu/ }).click()
  await page.locator('.picker-card[data-card-id="major-09-hermit"]').click()
  await expect(page.locator('.progress')).toHaveText('10/22')
  await expect(page.locator('figure img')).toHaveAttribute('src', '/cards/major-09-hermit.jpg')

  await page.getByRole('button', { name: 'Otevřít klasický význam' }).click()
  await expect(page.getByText('Poustevník — přímá poloha')).toBeVisible()
  await expect(page.locator('.progress')).toHaveText('10/22')

  await page.getByRole('button', { name: '← Zpět' }).click()
  await expect(page.getByRole('button', { name: 'Učení', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.progress')).toHaveText('1/78')
})

test('rozečtená kapitola a nejvyšší postup přežijí reload i přepnutí režimu', async ({ page }) => {
  await openFreshApp(page)
  await navigateMode(page, 'Cesta Blázna')
  await page.getByRole('button', { name: /Vybrat kapitolu/ }).click()
  await page.locator('.picker-card[data-card-id="major-14-temperance"]').click()
  await expect(page.locator('.progress')).toHaveText('15/22')

  await navigateMode(page, 'Prohlížení')
  await expect(page.locator('.progress')).toHaveText('1/78')
  await navigateMode(page, 'Cesta Blázna')
  await expect(page.locator('.progress')).toHaveText('15/22')

  await page.reload()
  await expect(page.locator('.progress')).toHaveText('15/22')
  await expect(page.getByRole('heading', { name: 'Nová rovnováha' })).toBeVisible()
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  expect(state.journeyChapterIndex).toBe(14)
  expect(state.journeyHighestChapterIndex).toBe(14)

  await page.getByRole('button', { name: 'Od začátku' }).click()
  await expect(page.locator('.progress')).toHaveText('1/22')
  await expect(page.getByRole('heading', { name: 'První krok' })).toBeVisible()
})

test('přímé přepnutí z rozečteného studia přes příběh zachová platnou relaci', async ({ page }) => {
  await openFreshApp(page)
  await navigateMode(page, 'Učení')
  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await navigateMode(page, 'Cesta Blázna')
  await navigateMode(page, 'Prohlížení')
  await page.reload()

  await expect(page.getByRole('button', { name: 'Prohlížení' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.progress')).toHaveText('1/78')
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  expect(state.version).toBe(3)
  expect(state.studyRevealed).toBe(false)
})

test('Cesta Blázna zůstane dostupná offline', async ({ page, context }) => {
  await openFreshApp(page)
  await navigateMode(page, 'Cesta Blázna')
  await page.getByRole('button', { name: 'Další →' }).click()
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await page.reload()

  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.progress')).toHaveText('2/22')
  await expect(page.getByRole('heading', { name: 'Co mám v rukou' })).toBeVisible()
  expect(await page.locator('figure img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  await context.setOffline(false)
})

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
  { width: 1440, height: 1000 },
]) {
  test(`Cesta Blázna se vejde do viewportu ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openFreshApp(page)
    await navigateMode(page, 'Cesta Blázna')

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    const undersized = await page.locator('button:visible').evaluateAll((buttons) =>
      buttons.filter((button) => {
        const box = button.getBoundingClientRect()
        return box.width < 44 || box.height < 44
      }).map((button) => button.textContent?.trim()),
    )
    expect(undersized).toEqual([])
  })
}

test('desktop Cesty Blázna využívá široké dvousloupcové rozložení', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openFreshApp(page)
  await navigateMode(page, 'Cesta Blázna')

  const layout = await page.locator('.chapter-layout').boundingBox()
  const aside = await page.locator('.chapter-aside').boundingBox()
  const content = await page.locator('.chapter-content').boundingBox()
  expect(layout?.width).toBeGreaterThan(900)
  expect(aside?.x).toBeLessThan(content?.x ?? 0)
  expect(content?.width).toBeGreaterThan(500)
  await expect(page.getByRole('heading', { name: 'Příběh' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Návaznost' })).toBeVisible()
})

async function navigateMode(page: import('@playwright/test').Page, name: string): Promise<void> {
  const desktop = page.locator('.site-header .desktop-nav').getByRole('button', { name: name === 'Karta dne' ? 'Výklady' : name, exact: true })
  if (await desktop.isVisible()) {
    await desktop.click()
  } else {
    await page.getByRole('button', { name: 'Otevřít menu' }).click()
    await page.getByRole('dialog', { name: 'Navigace Tarot Trainer' }).getByRole('button', { name: name === 'Karta dne' ? 'Výklady' : name, exact: true }).click()
  }
}
