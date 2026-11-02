import { expect, test, type Locator, type Page } from '@playwright/test'

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

function nextButton(page: Page): Locator {
  return page.locator('.deck-navigation .next-button')
}

async function goToPosition(page: Page, position: number): Promise<void> {
  for (let current = 1; current < position; current += 1) {
    await nextButton(page).click()
  }
  await expect(page.locator('.progress')).toHaveText(`${position}/78`)
}

async function storedIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('tarot-trainer:state')
    if (!raw) throw new Error('Chybí uložená relace.')
    return (JSON.parse(raw) as { currentIndex: number }).currentIndex
  })
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

test('karta 25 zůstane stejná po deseti otočeních', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 25)
  const card = page.locator('.tarot-card')
  const cardId = await card.getAttribute('data-card-id')

  for (let tap = 0; tap < 10; tap += 1) await card.locator('.card-stage').tap()

  await expect(page.locator('.progress')).toHaveText('25/78')
  await expect(card).toHaveAttribute('data-card-id', cardId!)
  await expect(card.locator('.card-inner')).not.toHaveClass(/flipped/)
  expect(await storedIndex(page)).toBe(24)
})

test('pět rychlých tapů na kartě 37 skončí na významu bez ztráty indexu', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 37)
  const stage = page.locator('.card-stage')

  for (let tap = 0; tap < 5; tap += 1) await stage.tap()

  await expect(page.locator('.progress')).toHaveText('37/78')
  await expect(page.locator('.card-inner')).toHaveClass(/flipped/)
  await expect(page.locator('.meaning-summary')).toBeVisible()
  expect(await storedIndex(page)).toBe(36)
})

test('navigace během flipu zobrazí kartu 51 přední stranou', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 50)
  const previousCardId = await page.locator('.tarot-card').getAttribute('data-card-id')

  await page.locator('.card-stage').tap()
  await nextButton(page).click()

  await expect(page.locator('.progress')).toHaveText('51/78')
  await expect(page.locator('.tarot-card')).not.toHaveAttribute('data-card-id', previousCardId!)
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
  await expect(page.locator('.card-front')).toBeVisible()
  expect(await storedIndex(page)).toBe(50)
})

test('klávesová navigace během flipu mění jen kartu a novou ukáže zepředu', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 12)

  await page.locator('.card-stage').tap()
  await page.keyboard.press('ArrowRight')

  await expect(page.locator('.progress')).toHaveText('13/78')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
  expect(await storedIndex(page)).toBe(12)

  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.progress')).toHaveText('12/78')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
})

test('změna Reversed během animace upraví aktuální kartu bez resetu relace', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 6)
  const cardId = await page.locator('.tarot-card').getAttribute('data-card-id')

  await page.locator('.card-stage').tap()
  await page.getByLabel('Reversed').check()

  await expect(page.locator('.progress')).toHaveText('6/78')
  await expect(page.getByLabel('Reversed')).toBeChecked()
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', cardId!)
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', 'reversed')
  await expect(page.locator('.card-inner')).toHaveClass(/flipped/)
  await expect(page.locator('.meaning-label')).toHaveText('Obrácená poloha')
  expect(await storedIndex(page)).toBe(5)

  await page.getByLabel('Reversed').uncheck()

  await expect(page.locator('.progress')).toHaveText('6/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', cardId!)
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', 'upright')
  await expect(page.locator('.card-inner')).toHaveClass(/flipped/)
  await expect(page.locator('.meaning-label')).toHaveText('Přímá poloha')
})

test('Shuffle rozdá všech 78 unikátních karet před novým kolem', async ({ page }) => {
  await openFreshApp(page)
  await page.getByLabel('Shuffle').check()
  const seen = new Set<string>()

  for (let position = 1; position <= 78; position += 1) {
    const cardId = await page.locator('.tarot-card').getAttribute('data-card-id')
    expect(cardId).not.toBeNull()
    seen.add(cardId!)
    if (position < 78) await nextButton(page).click()
  }

  expect(seen.size).toBe(78)
  await expect(page.locator('.progress')).toHaveText('78/78')
  await expect(nextButton(page)).toContainText('Zamíchat znovu')
})

test('karta 40, její orientace a nastavení se obnoví po reloadu', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await openFreshApp(page)
  await page.getByLabel('Reversed').check()
  await goToPosition(page, 40)
  const card = page.locator('.tarot-card')
  const cardId = await card.getAttribute('data-card-id')
  const orientation = await card.getAttribute('data-orientation')

  await page.reload()

  await expect(page.locator('.progress')).toHaveText('40/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', cardId!)
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', orientation!)
  await expect(page.getByLabel('Reversed')).toBeChecked()
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
})

test('rychlé přepnutí flipu, navigace a režimu zachová kartu i pokrok', async ({ page }) => {
  await openFreshApp(page)
  await goToPosition(page, 8)
  await page.locator('.card-stage').tap()
  await navigateMode(page, 'Učení')

  await expect(page.locator('.progress')).toHaveText('8/78')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await expect(page.locator('.card-inner')).toHaveClass(/flipped/)
  await navigateMode(page, 'Prohlížení')

  await expect(page.locator('.progress')).toHaveText('8/78')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
  expect(await storedIndex(page)).toBe(7)
})

test('návrat na předchozí kartu zachová její identitu a orientaci', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await openFreshApp(page)
  await page.getByLabel('Reversed').check()
  await nextButton(page).click()
  const secondId = await page.locator('.tarot-card').getAttribute('data-card-id')
  const secondOrientation = await page.locator('.tarot-card').getAttribute('data-orientation')
  await nextButton(page).click()
  await page.getByRole('button', { name: /Předchozí/ }).click()

  await expect(page.locator('.progress')).toHaveText('2/78')
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-card-id', secondId!)
  await expect(page.locator('.tarot-card')).toHaveAttribute('data-orientation', secondOrientation!)
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
})

test('reload po kontrole service workeru zachová studijní pokrok', async ({ page }) => {
  await openFreshApp(page)
  await navigateMode(page, 'Učení')
  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await page.locator('.study-actions .known-button').click()
  await page.getByRole('button', { name: /Pokrok v učení/ }).click()
  await expect(page.locator('.study-progress dd').nth(0)).toHaveText('1')

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
  })
  await page.reload()

  await expect(page.locator('.progress')).toHaveText('2/78')
  await expect(page.locator('.study-progress dd').nth(0)).toHaveText('1')
  await expect(page.locator('.desktop-nav button').filter({ hasText: 'Učení' })).toHaveAttribute('aria-pressed', 'true')
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
