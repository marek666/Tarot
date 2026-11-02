import { expect, test, type Page } from '@playwright/test'

const stateKey = 'tarot-trainer:state'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

async function openCardPicker(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Vybrat kartu', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Vybrat kartu' })).toBeVisible()
}

async function selectCard(page: Page, cardId: string): Promise<void> {
  await openCardPicker(page)
  await page.locator(`.picker-card[data-card-id="${cardId}"]`).click()
  await expect(page.getByRole('dialog', { name: 'Vybrat kartu' })).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

test('Prohlížení vybere kartu 65 a zachová ji po reloadu', async ({ page }) => {
  await openFreshApp(page)
  await selectCard(page, 'pentacles-01')

  await expect(page.locator('.progress')).toHaveText('65/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', 'pentacles-01')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
  await page.reload()
  await expect(page.locator('.progress')).toHaveText('65/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', 'pentacles-01')
})

test('Učení vybere kartu 40 bez změny studijního pokroku', async ({ page }) => {
  await openFreshApp(page)
  await page.getByRole('button', { name: 'Učení', exact: true }).click()
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).studyProgress, stateKey)
  await selectCard(page, 'cups-04')
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).studyProgress, stateKey)

  await expect(page.locator('.progress')).toHaveText('40/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', 'cups-04')
  expect(after).toEqual(before)
  await expect(page.getByRole('button', { name: 'Odhalit význam' })).toBeVisible()
})

test('Cesta Blázna vybere kapitolu 18 bez přepnutí režimu', async ({ page }) => {
  await openFreshApp(page)
  await page.getByRole('button', { name: 'Cesta Blázna' }).click()
  await page.getByRole('button', { name: /Vybrat kapitolu/ }).click()
  await page.locator('.picker-card[data-card-id="major-17-star"]').click()

  await expect(page.locator('.progress')).toHaveText('18/22')
  await expect(page.getByRole('button', { name: 'Cesta Blázna' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Obnovit důvěru' })).toBeVisible()
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey)
  expect(state.journeyChapterIndex).toBe(17)
})

test('vyhledávání bez diakritiky a filtry arkán i barev fungují', async ({ page }) => {
  await openFreshApp(page)
  await openCardPicker(page)
  const search = page.getByPlaceholder('Hledat česky nebo anglicky…')

  await search.fill('veleknezka')
  await expect(page.locator('.picker-card')).toHaveCount(1)
  await expect(page.locator('.picker-card')).toHaveAttribute('data-card-id', 'major-02-high-priestess')

  await search.fill('')
  await page.getByLabel('Filtrovat arkánu nebo barvu').selectOption('major')
  await expect(page.locator('.picker-card')).toHaveCount(22)
  await page.getByLabel('Filtrovat arkánu nebo barvu').selectOption('cups')
  await expect(page.locator('.picker-card')).toHaveCount(14)
  await expect(page.locator('.picker-card').first()).toHaveAttribute('data-card-id', 'cups-01')
})

test('studijní filtry zobrazí Umím, Procvičit a Zbývající', async ({ page }) => {
  await openFreshApp(page)
  await page.getByRole('button', { name: 'Učení', exact: true }).click()

  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await page.getByRole('button', { name: 'Umím' }).click()
  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await page.getByRole('button', { name: 'Procvičit' }).click()
  await openCardPicker(page)

  const filter = page.getByLabel('Filtrovat podle studijního stavu')
  await filter.selectOption('known')
  await expect(page.locator('.picker-card')).toHaveCount(1)
  await filter.selectOption('practice')
  await expect(page.locator('.picker-card')).toHaveCount(1)
  await filter.selectOption('remaining')
  await expect(page.locator('.picker-card')).toHaveCount(76)
})

test('výběr při Shuffle zachová pořadí a najde kartu v něm', async ({ page }) => {
  await openFreshApp(page)
  await page.getByLabel('Shuffle').check()
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey)
  await selectCard(page, 'pentacles-01')
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey)

  expect(after.deckOrderIds).toEqual(before.deckOrderIds)
  expect(after.currentIndex).toBe(before.deckOrderIds.indexOf('pentacles-01'))
  await expect(page.getByLabel('Shuffle')).toBeChecked()
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', 'pentacles-01')
})

test('výběr při Reversed přidělí orientaci a během flipu zobrazí novou kartu zepředu', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await openFreshApp(page)
  await page.getByLabel('Reversed').check()
  await page.locator('.card-stage').tap()
  await selectCard(page, 'cups-04')

  await expect(page.getByLabel('Reversed')).toBeChecked()
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', 'cups-04')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', 'reversed')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)

  await selectCard(page, 'major-00-fool')
  await selectCard(page, 'cups-04')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', 'reversed')
})

test('dialog podporuje klávesnici, focus trap, Escape a mobilní bottom sheet', async ({ page }) => {
  await openFreshApp(page)
  const trigger = page.getByRole('button', { name: 'Vybrat kartu', exact: true })
  await trigger.focus()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Vybrat kartu' })
  await expect(dialog).toBeVisible()
  await expect(page.getByPlaceholder('Hledat česky nebo anglicky…')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.picker-card').first()).toBeFocused()

  const box = await dialog.boundingBox()
  expect(Math.abs((box?.y ?? 0) + (box?.height ?? 0) - 844)).toBeLessThanOrEqual(1)
  expect(box?.width).toBe(390)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.setViewportSize({ width: 1280, height: 900 })
  await trigger.click()
  const desktopBox = await dialog.boundingBox()
  expect(desktopBox?.width).toBeLessThanOrEqual(672)
  expect(Math.abs((desktopBox?.x ?? 0) - (1280 - (desktopBox?.width ?? 0)) / 2)).toBeLessThanOrEqual(1)
  expect((desktopBox?.height ?? 901)).toBeLessThanOrEqual(900 * 0.84 + 1)
  await page.keyboard.press('Escape')
})
