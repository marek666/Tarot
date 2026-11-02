import { expect, test } from '@playwright/test'

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

  await page.getByRole('button', { name: 'Učení', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()
  await page.getByRole('button', { name: 'Cesta Blázna' }).click()
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Odebrat Blázen z oblíbených' })).toBeVisible()

  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tarot-trainer:state')!))
  expect(state.version).toBe(3)
  expect(state.favoriteCardIds).toEqual(['major-00-fool'])
})
