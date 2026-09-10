import { expect, test } from '@playwright/test'

test('registers a transaction and shows it in the dashboard', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Registrar' }).click()
  await page.getByLabel('Importe').fill('12,34')
  await page.getByLabel('Comercio o concepto').fill('Panaderia')
  await page.getByRole('button', { name: 'Guardar movimiento' }).click()

  await expect(page.getByText('Panaderia')).toBeVisible()
  await expect(page.getByText('-12,34 €')).toBeVisible()
})

test('registers a manual movement without a merchant', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Registrar' }).click()
  await page.getByLabel('Importe').fill('8,50')
  await page.getByRole('button', { name: 'Guardar movimiento' }).click()

  await expect(page.getByText('Movimiento manual')).toBeVisible()
})
