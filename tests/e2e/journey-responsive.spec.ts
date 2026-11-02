import { expect, test, type Page } from '@playwright/test'
import { navigateMode } from './helpers.ts'

const viewports = [
  { width: 320, height: 568, group: 'mobile' },
  { width: 375, height: 667, group: 'mobile' },
  { width: 390, height: 844, group: 'mobile' },
  { width: 430, height: 932, group: 'mobile' },
  { width: 768, height: 1024, group: 'tablet-portrait' },
  { width: 1024, height: 768, group: 'tablet-landscape' },
  { width: 1280, height: 800, group: 'desktop-low' },
  { width: 1440, height: 900, group: 'desktop' },
  { width: 1920, height: 1080, group: 'desktop' },
  { width: 2560, height: 1440, group: 'desktop' },
] as const

async function openFreshJourney(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await navigateMode(page, 'Cesta Blázna')
  await expect(page.getByRole('heading', { name: 'První krok' })).toBeVisible()
}

for (const viewport of viewports) {
  test(`Cesta Blázna: ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await openFreshJourney(page)

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

    const layout = await page.locator('.chapter-layout').boundingBox()
    const aside = await page.locator('.chapter-aside').boundingBox()
    const content = await page.locator('.chapter-content').boundingBox()
    const story = await page.locator('.story').boundingBox()
    expect(layout).not.toBeNull()
    expect(aside).not.toBeNull()
    expect(content).not.toBeNull()
    expect(story).not.toBeNull()

    if (viewport.group === 'mobile' || viewport.group === 'tablet-portrait') {
      expect((aside?.y ?? 0)).toBeLessThan(content?.y ?? 0)
      expect(story?.width ?? 0).toBeGreaterThan(
        viewport.group === 'mobile' ? viewport.width - 100 : 600,
      )
    } else {
      expect((aside?.x ?? 0)).toBeLessThan(content?.x ?? 0)
      expect(story?.width ?? 0).toBeGreaterThan(500)
    }

    if (viewport.group.startsWith('desktop')) {
      expect(layout?.width ?? 0).toBeGreaterThan(950)
      expect(layout?.width ?? Infinity).toBeLessThanOrEqual(1280)
      expect(story?.width ?? 0).toBeLessThanOrEqual(800)
    }

    await page.screenshot({
      path: testInfo.outputPath(`journey-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    })

    if (viewport.width === 390 || viewport.width === 1440) {
      await page.getByRole('button', { name: /Vybrat kapitolu/ }).click()
      await expect(page.getByRole('dialog', { name: 'Vybrat kapitolu Cesty Blázna' })).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath(`journey-picker-${viewport.width}x${viewport.height}.png`),
      })
      await page.keyboard.press('Escape')
    }
  })
}

test('sticky karta se zapíná jen na dostatečně vysokém desktopu', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await openFreshJourney(page)
  await expect(page.locator('.chapter-aside')).toHaveCSS('position', 'static')

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.chapter-aside')).toHaveCSS('position', 'sticky')
  await page.evaluate(() => window.scrollTo(0, 600))
  await expect.poll(async () => (await page.locator('.chapter-aside').boundingBox())?.y).toBeGreaterThanOrEqual(15)
  expect((await page.locator('.chapter-aside').boundingBox())?.y ?? 100).toBeLessThanOrEqual(18)
})
test('změna kapitoly po scrollování vrátí čtenáře na její začátek', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshJourney(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: 'Další →' }).tap()

  await expect(page.locator('.progress')).toHaveText('2/22')
  await expect.poll(async () => (await page.locator('#journey-chapter-start').boundingBox())?.y).toBeGreaterThanOrEqual(0)
  expect((await page.locator('#journey-chapter-start').boundingBox())?.y ?? 100).toBeLessThanOrEqual(20)
})

test('zavření klasického významu obnoví předchozí pozici příběhu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshJourney(page)
  const toggle = page.getByRole('button', { name: 'Otevřít klasický význam' })
  await toggle.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => window.scrollY)
  await toggle.click()
  await expect(page.getByText('Blázen — přímá poloha')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: 'Zpět k příběhu' }).click()
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(2)
})

test('tablet se po změně orientace přepne z jednoho do dvou sloupců', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await openFreshJourney(page)
  const portraitAside = await page.locator('.chapter-aside').boundingBox()
  const portraitContent = await page.locator('.chapter-content').boundingBox()
  expect(portraitAside?.y ?? 0).toBeLessThan(portraitContent?.y ?? 0)

  await page.setViewportSize({ width: 1024, height: 768 })
  const landscapeAside = await page.locator('.chapter-aside').boundingBox()
  const landscapeContent = await page.locator('.chapter-content').boundingBox()
  expect(landscapeAside?.x ?? 0).toBeLessThan(landscapeContent?.x ?? 0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('desktopové Prohlížení a Učení zůstávají centrované a pohodlně široké', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const shell = await page.locator('.app-shell').boundingBox()
  const picker = await page.locator('.picker-trigger').boundingBox()
  const card = await page.locator('.tarot-card').boundingBox()
  expect(shell?.width ?? 0).toBeGreaterThanOrEqual(730)
  expect(picker?.width ?? 0).toBeGreaterThanOrEqual(380)
  expect(card?.width ?? 0).toBeGreaterThanOrEqual(330)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

  await navigateMode(page, 'Učení')
  await expect(page.locator('.study-progress')).toBeVisible()
  expect((await page.locator('.study-progress').boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(440)
  await expect(page.getByRole('button', { name: /Pokrok v učení/ })).toHaveAttribute('aria-expanded', 'false')
})
