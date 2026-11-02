import { expect, test, type Page } from '@playwright/test'

const viewports = [
  { name: '320 px', width: 320, height: 720 },
  { name: '360 px', width: 360, height: 800 },
  { name: '375 px', width: 375, height: 812 },
  { name: '390 px', width: 390, height: 844 },
  { name: '430 px', width: 430, height: 932 },
  { name: '768 px', width: 768, height: 1024 },
  { name: '1440 px', width: 1440, height: 1000 },
] as const

async function openFreshApp(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
}

for (const viewport of viewports) {
  test(`layout se vejde do viewportu ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openFreshApp(page)

    await expect(page.locator('.tarot-card')).toBeVisible()
    await expect(page.getByRole('button', { name: /Další/ })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    const undersizedTargets = await page.locator('button:visible, input:visible').evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          label: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName,
          box: node.getBoundingClientRect(),
        }))
        .filter(({ box }) => box.width < 44 || box.height < 44)
        .map(({ label, box }) => `${label}: ${Math.round(box.width)}×${Math.round(box.height)}`),
    )
    expect(undersizedTargets).toEqual([])
  })
}

test('obrácená ilustrace po klepnutí vždy ukáže obrácený význam', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)

  await page.getByLabel('Reversed').check()
  const card = page.locator('.tarot-card')
  await expect(card).toHaveAttribute('data-orientation', 'reversed')
  await expect(card.locator('img.reversed')).toBeVisible()

  await card.locator('.card-front').tap()
  await expect(card.locator('.card-inner')).toHaveClass(/flipped/)
  await expect(card.locator('.meaning-label')).toHaveText('Obrácená poloha')
  await expect(card.locator('.meaning-summary')).toContainText('Svoboda se mění')

  await card.locator('details').click()
  await expect(card.locator('details')).toHaveAttribute('open', '')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('dotykové přejetí listuje bez náhodného otočení', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)

  const stage = page.locator('.card-stage')
  const box = await stage.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return

  await stage.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box.x + box.width * 0.8,
    clientY: box.y + box.height * 0.5,
  })
  await stage.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box.x + box.width * 0.2,
    clientY: box.y + box.height * 0.5,
  })

  await expect(page.locator('.progress')).toHaveText('2/78')
  await expect(page.locator('.card-inner')).not.toHaveClass(/flipped/)
})

test('studijní relace a pokrok přežijí obnovení stránky', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)

  await page.getByRole('button', { name: 'Učení' }).click()
  await page.getByRole('button', { name: 'Odhalit význam' }).click()
  await expect(page.locator('.meaning-summary')).toBeVisible()
  await page.locator('.study-actions .practice-button').click()
  await expect(page.locator('.progress')).toHaveText('2/78')
  await page.getByRole('button', { name: /Pokrok v učení/ }).click()
  await expect(page.locator('.study-progress dd').nth(1)).toHaveText('1')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Učení', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.progress')).toHaveText('2/78')
  await expect(page.getByRole('button', { name: /Pokrok v učení/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.study-progress dd').nth(1)).toHaveText('1')
})

test('aplikace se po prvním načtení obnoví offline včetně ilustrace', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(page.locator('.card-front img')).toBeVisible()

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tarot Trainer' })).toBeVisible()
  await expect(page.locator('.card-front img')).toBeVisible()
  expect(
    await page.locator('.card-front img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
  ).toBe(true)
  await context.setOffline(false)
})

test('layout zůstává použitelný po změně orientace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFreshApp(page)
  await page.setViewportSize({ width: 844, height: 390 })

  await expect(page.locator('.tarot-card')).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true)
})
