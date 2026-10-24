import { test, expect } from '@playwright/test';

test('loads seed diaries and uses date and radio inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Flight diaries' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '2017-01-01' })).toBeVisible();
  await expect(page.getByLabel('Date', { exact: true })).toHaveAttribute('type', 'date');
  await expect(page.getByRole('radio')).toHaveCount(9);
  await expect(page.getByRole('radio', { name: 'sunny', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'great', exact: true })).toBeChecked();
});

test('adds a diary with selected enums and retains it after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Date', { exact: true }).fill('2031-06-17');
  await page.getByRole('radio', { name: 'rainy', exact: true }).check();
  await page.getByRole('radio', { name: 'poor', exact: true }).check();
  await page.getByRole('textbox', { name: 'Comment', exact: true }).fill('Rainy approach, synthetic test flight');
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/diaries') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  expect((await responsePromise).status()).toBe(200);
  const entry = page.locator('section').filter({ has: page.getByRole('heading', { name: '2031-06-17' }) }).last();
  await expect(entry.getByText('Visibility: poor')).toBeVisible();
  await expect(entry.getByText('Weather: rainy')).toBeVisible();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Comment', exact: true })).toHaveValue('');
  await page.reload();
  await expect(entry.getByText('Weather: rainy')).toBeVisible();
});

test('shows a backend validation reason and preserves the form for retry', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Date', { exact: true }).fill('2031-06-18');
  await page.getByRole('textbox', { name: 'Comment', exact: true }).fill('Retain this draft');
  await page.getByRole('radio', { name: 'cloudy', exact: true }).check();
  await page.route('**/api/diaries', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON() as Record<string, unknown>;
    await route.continue({ postData: JSON.stringify({ ...body, weather: 'invalid-weather' }) });
  });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('weather');
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2031-06-18');
  await expect(page.getByRole('textbox', { name: 'Comment', exact: true })).toHaveValue('Retain this draft');
  await expect(page.getByRole('radio', { name: 'cloudy', exact: true })).toBeChecked();
  await page.unroute('**/api/diaries');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '2031-06-18' }).last()).toBeVisible();
});

test('the diary form fits a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('radio', { name: 'windy', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
