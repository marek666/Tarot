import { expect, test, type Page } from '@playwright/test'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

async function openSpread(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Karta dne', exact: true }).click()
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  await expect(page.getByRole('heading', { name: 'Tři pohledy na jedno téma' })).toBeVisible()
}

async function deal(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Zamíchat a vyložit' }).click()
  await expect(page.locator('.spread-card')).toHaveCount(3)
}

async function storedSpread(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:spread')!))
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

test('uživatel zvolí rozložení, oblast a otázku a dostane tři unikátní skryté karty', async ({ page }) => {
  await openFreshApp(page)
  await openSpread(page)
  await page.getByLabel('Rozložení').selectOption('situation')
  await page.getByRole('button', { name: 'Práce', exact: true }).click()
  await page.getByLabel(/Vlastní otázka/).fill('Jaký krok má v práci největší smysl?')
  await page.getByLabel(/Reversed/).check()
  await deal(page)

  await expect(page.getByText('Situace / Překážka / Rada', { exact: true })).toBeVisible()
  await expect(page.locator('.spread-card[data-revealed="false"]')).toHaveCount(3)
  const stored = await storedSpread(page) as { cards: Array<{ cardId: string }>; layoutId: string; area: string; question: string }
  expect(stored.layoutId).toBe('situation')
  expect(stored.area).toBe('work')
  expect(stored.question).toBe('Jaký krok má v práci největší smysl?')
  expect(new Set(stored.cards.map((card) => card.cardId)).size).toBe(3)
})

test('karty lze odhalovat po jedné a poté zobrazit společný výklad', async ({ page }, testInfo) => {
  await openFreshApp(page)
  await openSpread(page)
  await deal(page)

  await page.getByRole('button', { name: 'Minulost: odhalit kartu' }).click()
  await expect(page.locator('.spread-card').nth(0)).toHaveAttribute('data-revealed', 'true')
  await expect(page.getByRole('heading', { name: 'Klasický význam' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Význam v pozici/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Vztah k oblasti' })).toBeVisible()

  await page.getByRole('button', { name: 'Odhalit další pozici' }).click()
  await expect(page.locator('.spread-card').nth(1)).toHaveAttribute('data-revealed', 'true')
  await page.getByRole('button', { name: 'Odhalit všechny karty' }).click()
  await expect(page.locator('.spread-card[data-revealed="true"]')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Jak číst karty společně' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Závěrečná reflexe' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('three-card-combined-mobile.png'), fullPage: true })
})

test('výukový režim nejprve skryje vzorový text', async ({ page }) => {
  await openFreshApp(page)
  await openSpread(page)
  await page.getByLabel(/Nejdřív vlastní výklad/).check()
  await deal(page)
  await page.getByRole('button', { name: 'Minulost: odhalit kartu' }).click()

  await expect(page.getByRole('heading', { name: 'Nejdřív vlastní výklad' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Klasický význam' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Zobrazit vzorový výklad' }).click()
  await expect(page.getByRole('heading', { name: 'Klasický význam' })).toBeVisible()

  const state = await storedSpread(page) as { cards: Array<{ revealed: boolean; interpretationRevealed: boolean }> }
  expect(state.cards[0]).toEqual({
    ...state.cards[0],
    revealed: true,
    interpretationRevealed: true,
  })
})

test('nový rozečtený výklad vyžaduje potvrzení', async ({ page }) => {
  await openFreshApp(page)
  await openSpread(page)
  await deal(page)
  await page.getByRole('button', { name: 'Minulost: odhalit kartu' }).click()

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Rozečtený výklad')
    await dialog.dismiss()
  })
  await page.getByRole('button', { name: 'Nový výklad' }).click()
  await expect(page.locator('.spread-card')).toHaveCount(3)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Nový výklad' }).click()
  await expect(page.getByRole('button', { name: 'Zamíchat a vyložit' })).toBeVisible()
  expect((await storedSpread(page) as { cards: unknown[] }).cards).toEqual([])
})

test('reload obnoví karty, orientace, pořadí i stav odhalení', async ({ page }) => {
  await openFreshApp(page)
  await openSpread(page)
  await page.getByLabel(/Reversed/).check()
  await deal(page)
  await page.getByRole('button', { name: 'Minulost: odhalit kartu' }).click()
  const before = await storedSpread(page)

  await page.reload()
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  await expect(page.locator('.spread-card')).toHaveCount(3)
  expect(await storedSpread(page)).toEqual(before)
  await expect(page.locator('.spread-card').nth(0)).toHaveAttribute('data-revealed', 'true')
  await expect(page.locator('.spread-card').nth(1)).toHaveAttribute('data-revealed', 'false')
})

test('výklad zůstane offline dostupný po prvním načtení', async ({ page, context }) => {
  await openFreshApp(page)
  await openSpread(page)
  await deal(page)
  await page.getByRole('button', { name: 'Odhalit všechny karty' }).click()
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await page.reload()
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  await expect(page.locator('.spread-card[data-revealed="true"]')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Jak číst karty společně' })).toBeVisible()
  expect(await page.locator('.spread-card img').first().evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )).toBe(true)
  await context.setOffline(false)
})

test('klávesnice odhalí kartu a umožní pokračovat', async ({ page }) => {
  await openFreshApp(page)
  await openSpread(page)
  await deal(page)
  const firstCard = page.getByRole('button', { name: 'Minulost: odhalit kartu' })
  await firstCard.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.spread-card').first()).toHaveAttribute('data-revealed', 'true')
  await page.getByRole('button', { name: 'Odhalit další pozici' }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.spread-card').nth(1)).toHaveAttribute('data-revealed', 'true')
})

test('rychlé tapy a přechod mezi režimy nepřelosují karty ani hlavní balíček', async ({ page }) => {
  await openFreshApp(page)
  await page.getByRole('button', { name: 'Vybrat kartu', exact: true }).click()
  await page.locator('.picker-card').nth(30).click()
  const trainerBefore = await page.evaluate(() => localStorage.getItem('tarot-trainer:state'))
  await openSpread(page)
  await deal(page)
  const idsBefore = await page.locator('.spread-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-card-id')))
  const first = page.locator('.spread-card .card-stage').first()
  for (let tap = 0; tap < 5; tap += 1) await first.tap()
  await expect(page.locator('.spread-card').first()).toHaveAttribute('data-revealed', 'true')
  const spreadBefore = await storedSpread(page)

  await page.getByRole('button', { name: 'Prohlížení', exact: true }).click()
  await page.getByLabel('Reversed').check()
  await page.getByRole('button', { name: 'Karta dne', exact: true }).click()
  await page.getByRole('tab', { name: 'Podzáložka Tři karty' }).click()
  const idsAfter = await page.locator('.spread-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-card-id')))
  expect(idsAfter).toEqual(idsBefore)
  expect(await storedSpread(page)).toEqual(spreadBefore)

  const trainerAfter = await page.evaluate(() => localStorage.getItem('tarot-trainer:state'))
  const before = JSON.parse(trainerBefore!) as { currentIndex: number; deckOrderIds: string[]; studyProgress: unknown }
  const after = JSON.parse(trainerAfter!) as { currentIndex: number; deckOrderIds: string[]; studyProgress: unknown }
  expect(after.currentIndex).toBe(before.currentIndex)
  expect(after.deckOrderIds).toEqual(before.deckOrderIds)
  expect(after.studyProgress).toEqual(before.studyProgress)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`tříkaretní výklad se vejde do ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await openFreshApp(page)
    await openSpread(page)
    await deal(page)

    expect(await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )).toBeLessThanOrEqual(1)
    await expect(page.locator('.spread-card')).toHaveCount(3)

    if (viewport.width === 390 || viewport.width === 1440) {
      await page.screenshot({
        path: testInfo.outputPath(`three-card-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      })
    }
  })
}
