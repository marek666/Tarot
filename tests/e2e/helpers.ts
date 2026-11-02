import { expect, type Page } from '@playwright/test'

export type AppModeLabel = 'Prohlížení' | 'Učení' | 'Cesta Blázna' | 'Výklady' | 'Karta dne'

export async function navigateMode(page: Page, label: AppModeLabel): Promise<void> {
  const visibleLabel = label === 'Karta dne' ? 'Výklady' : label
  const desktopButton = page.locator('.site-header .desktop-nav').getByRole('button', {
    name: visibleLabel,
    exact: true,
  })

  if (await desktopButton.isVisible()) {
    await desktopButton.click()
    return
  }

  await page.getByRole('button', { name: 'Otevřít menu' }).click()
  const dialog = page.getByRole('dialog', { name: 'Navigace Tarot Trainer' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: visibleLabel, exact: true }).click()
  await expect(dialog).toBeHidden()
}

export async function openCardSettings(page: Page): Promise<void> {
  const settings = page.locator('.compact-settings')
  if (await settings.getAttribute('open') === null) await settings.locator('summary').click()
  await expect(settings).toHaveAttribute('open', '')
}

export async function setCardSetting(
  page: Page,
  label: 'Shuffle' | 'Reversed',
  enabled: boolean,
): Promise<void> {
  await openCardSettings(page)
  const input = page.locator('.compact-settings').getByRole('checkbox', { name: new RegExp(`^${label}\\b`) })
  if (enabled) await input.check()
  else await input.uncheck()
  await expect(input).toBeChecked({ checked: enabled })
}
