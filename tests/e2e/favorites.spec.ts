import { expect, test } from '@playwright/test'
import { navigateMode } from './helpers.ts'

test('oblíbené fungují napříč režimy a zůstanou uložené po reloadu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: 'Přidat Blázen do oblíbených' }).click()
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Vybrat kartu', exact: true }).click()
  await page.getByLabel(/Pouze oblíbené/).check()
  await expect(page.locator('.picker-card')).toHaveCount(1)
  await page.keyboard.press('Escape')

  await navigateMode(page, 'Učení')
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()
  await navigateMode(page, 'Cesta Blázna')
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()
  await navigateMode(page, 'Karta dne')
  const dailyFavorite = page.locator('.daily-favorite')
  await expect(dailyFavorite).toBeVisible()
  const dailyCardId = await page.locator('.daily-card').getAttribute('data-card-id')
  const dailyIsFavorite = dailyCardId === 'major-00-fool'
  await expect(dailyFavorite).toHaveAttribute('aria-pressed', String(dailyIsFavorite))
  await navigateMode(page, 'Cesta Blázna')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()

  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  expect(state.version).toBe(3)
  expect(state.favoriteCardIds).toEqual(['major-00-fool'])
})
