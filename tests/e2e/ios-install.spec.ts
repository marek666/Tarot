import { expect, test } from '@playwright/test'
import { openCardSettings } from './helpers.ts'

test.use({
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})

test('iPhone instalační nápověda je relevantní, zavíratelná a jednorázová', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const hint = page.getByLabel('Instalace na iPhone')
  await expect(hint).toBeVisible()
  await expect(hint).toContainText('Přidat na plochu')
  await hint.getByRole('button', { name: 'Zavřít instalační nápovědu' }).click()
  await expect(hint).toBeHidden()

  await page.reload()
  await expect(hint).toBeHidden()
})

test('první tapnutí v iPhone prostředí odhalí obrácený význam', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await openCardSettings(page)
  await page.getByRole('checkbox', { name: /^Reversed\b/ }).tap()
  const card = page.locator('.tarot-card')
  await expect(card).toHaveAttribute('data-orientation', 'reversed')
  await card.locator('.card-front').tap()
  await expect(card.locator('.card-inner')).toHaveClass(/flipped/)
  await expect(card.locator('.meaning-label')).toHaveText('Obrácená poloha')
})
