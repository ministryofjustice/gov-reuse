import { expect, test } from '@playwright/test'

test.describe('Cookie consent', () => {
  test('accepting cookies hides banner and stores consent cookie', async ({ page, context }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Accept additional cookies' }).click()

    await expect(page.locator('.govuk-cookie-banner')).toBeHidden()

    const cookies = await context.cookies()
    const consent = cookies.find(c => c.name === 'cookie_consent')
    expect(consent).toBeTruthy()
    expect(decodeURIComponent(consent!.value)).toContain('"analytics":true')
    expect(decodeURIComponent(consent!.value)).toContain('"settings":true')
  })

  test('cookies page allows preferences to be saved', async ({ page, context }) => {
    await page.goto('/cookies')
    await page.getByLabel('Do not use cookies that measure my website use').check()
    await page.getByLabel('Use cookies that remember my settings on the site').check()
    await page.getByRole('button', { name: 'Save changes' }).click()

    const cookies = await context.cookies()
    const consent = cookies.find(c => c.name === 'cookie_consent')
    expect(decodeURIComponent(consent!.value)).toContain('"analytics":false')
    expect(decodeURIComponent(consent!.value)).toContain('"settings":true')
  })
})
