import { expect, test, type Page } from '@playwright/test'
import { resolve } from 'node:path'
import { navigateMode, setCardSetting } from './helpers.ts'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

async function openJournal(page: Page): Promise<void> {
  await navigateMode(page, 'Výklady')
  await page.getByRole('tab', { name: 'Podzáložka Deník' }).click()
  await expect(page.getByRole('heading', { name: 'Deník výkladů' })).toBeVisible()
}

test('mobilní hamburger otevírá režimy a ponechá obsah na místě', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  const trigger = page.getByRole('button', { name: 'Otevřít menu' })
  const contentTop = (await page.locator('main').boundingBox())?.y
  await expect(trigger).toBeVisible()
  await expect(page.locator('.trainer-mode-switch')).toHaveCount(0)
  await trigger.click()
  const nav = page.getByRole('dialog', { name: 'Navigace Tarot Trainer' })
  await expect(nav).toBeVisible()
  expect((await page.locator('main').boundingBox())?.y).toBe(contentTop)
  await page.keyboard.press('Escape')
  await expect(nav).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.mouse.click(4, 820)
  await expect(nav).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await nav.getByRole('button', { name: 'Výklady' }).click()
  await expect(nav).toBeHidden()
  await page.getByRole('tab', { name: 'Podzáložka Deník' }).click()
  await expect(page.getByRole('heading', { name: 'Deník výkladů' })).toBeVisible()
})

test('desktop nabízí režimy přímo v hlavičce a sbalené nastavení karet', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openFreshApp(page)
  await expect(page.locator('.site-header .desktop-nav').getByRole('button', { name: 'Prohlížení' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Otevřít menu' })).toBeHidden()
  const settings = page.locator('.compact-settings')
  await expect(settings).not.toHaveAttribute('open', '')
  await setCardSetting(page, 'Shuffle', true)
  await expect(settings.locator('summary')).toHaveAttribute('aria-label', /Shuffle aktivní/)
  const controls = await settings.locator('.mode-controls').boundingBox()
  const settingsBox = await settings.boundingBox()
  const cardTitle = await page.locator('.card-title').boundingBox()
  expect(controls?.width ?? 0).toBeGreaterThanOrEqual(380)
  expect((cardTitle?.y ?? 0)).toBeGreaterThan((settingsBox?.y ?? 0) + (settingsBox?.height ?? 0))
})

test('Kartu dne lze uložit do deníku a záznam vydrží reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await navigateMode(page, 'Výklady')
  await page.getByRole('button', { name: 'Uložit Kartu dne do deníku' }).click()
  await page.getByRole('tab', { name: 'Podzáložka Deník' }).click()
  await expect(page.locator('.journal-list li')).toHaveCount(1)
  await page.locator('.journal-list li button').click()
  await page.getByLabel('Moje poznámky').fill('Vlastní výklad')
  await page.getByRole('button',{name:'Uložit poznámku'}).click()
  await expect(page.getByRole('status')).toHaveText('Poznámka uložena.')
  await page.reload()
  await page.getByRole('tab',{name:'Podzáložka Deník'}).click()
  await page.locator('.journal-list li button').click()
  await expect(page.getByLabel('Moje poznámky')).toHaveValue('Vlastní výklad')
})

test('dokončený výklad se uloží jednou a historický detail nezmění aktivní relaci', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await navigateMode(page, 'Výklady')
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  await page.getByRole('button', { name: 'Zamíchat a vyložit' }).click()
  await page.getByRole('button', { name: 'Odhalit všechny karty' }).click()
  const activeSpread = await page.evaluate(() => localStorage.getItem('tarot-trainer:spread'))

  await page.getByRole('button', { name: 'Uložit výklad do deníku' }).click()
  await page.getByRole('button', { name: 'Uložit výklad do deníku' }).click()
  await expect(page.getByRole('alert')).toContainText('už je v deníku')

  await page.getByRole('tab', { name: 'Podzáložka Deník' }).click()
  await expect(page.locator('.journal-list li')).toHaveCount(1)
  await page.locator('.journal-list li button').click()
  await expect(page.getByRole('heading', { name: 'Společný výklad' })).toBeVisible()
  await expect(page.locator('.journal-card')).toHaveCount(3)

  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  await expect(page.locator('.spread-card[data-revealed="true"]')).toHaveCount(3)
  expect(await page.evaluate(() => localStorage.getItem('tarot-trainer:spread'))).toBe(activeSpread)
})

test('neuloženou poznámku nelze ztratit tichým přepnutím', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await navigateMode(page, 'Výklady')
  await page.getByRole('button', { name: 'Uložit Kartu dne do deníku' }).click()
  await openJournal(page)
  await page.locator('.journal-list li button').click()
  await page.getByLabel('Moje poznámky').fill('Rozepsaná poznámka')

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Poznámka není uložená')
    await dialog.dismiss()
  })
  await page.getByRole('tab', { name: 'Podzáložka Karta dne' }).click()
  await expect(page.getByLabel('Moje poznámky')).toHaveValue('Rozepsaná poznámka')

  await page.getByRole('button', { name: 'Uložit poznámku' }).click()
  await page.getByRole('tab', { name: 'Podzáložka Karta dne' }).click()
  await expect(page.getByRole('button', { name: 'Uložit Kartu dne do deníku' })).toBeVisible()
})

test('export, odstranění a bezpečný import obnoví deník bez duplicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await navigateMode(page, 'Výklady')
  await page.getByRole('button', { name: 'Uložit Kartu dne do deníku' }).click()
  await openJournal(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  const exportedPath = await download.path()
  expect(exportedPath).not.toBeNull()

  await page.locator('.journal-list li button').click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Odstranit výklad' }).click()
  await expect(page.locator('.journal-list li')).toHaveCount(0)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByLabel('Importovat deník JSON').setInputFiles(exportedPath!)
  await expect(page.locator('.journal-list li')).toHaveCount(1)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByLabel('Importovat deník JSON').setInputFiles(exportedPath!)
  await expect(page.locator('.journal-list li')).toHaveCount(1)
})

test('uložený deník zůstane dostupný offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await navigateMode(page, 'Výklady')
  await page.getByRole('button', { name: 'Uložit Kartu dne do deníku' }).click()
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await openJournal(page)
  await expect(page.locator('.journal-list li')).toHaveCount(1)
  await context.setOffline(false)
})

test('hlavička nepřetéká v podporovaných view portech', async ({ page }) => {
  await openFreshApp(page)
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )).toBeLessThanOrEqual(1)
    if (viewport.width <= 839) {
      await expect(page.getByRole('button', { name: 'Otevřít menu' })).toBeVisible()
    } else {
      await expect(page.locator('.site-header .desktop-nav')).toBeVisible()
    }
  }
})

test('vytvoří referenční screenshoty kompaktního rozhraní', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await page.screenshot({ path: resolve('test-results/v041-after-mobile.png'), fullPage: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: resolve('test-results/v041-after-desktop.png'), fullPage: true })
})
