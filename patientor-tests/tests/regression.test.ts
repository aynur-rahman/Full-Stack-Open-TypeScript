import { test, expect } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';

const createPatient = async (request: APIRequestContext) => {
  const response = await request.post('http://localhost:3001/api/patients', {
    data: { name: `Entry regression ${Date.now()}`, dateOfBirth: '1990-01-01', ssn: '010190-9999', gender: 'other', occupation: 'Test engineer' },
  });
  expect(response.status()).toBe(200);
  const patient: { id: string } = await response.json();
  return patient.id;
};

const openEntryForm = async (page: Page, type: string, description: string) => {
  await page.getByRole('button', { name: 'Add New Entry' }).click();
  await page.getByRole('combobox', { name: 'Entry type' }).click();
  await page.getByRole('option', { name: type, exact: true }).click();
  await page.getByLabel(/^Date\b/).fill('2026-10-03');
  await page.getByLabel(/^Description\b/).fill(description);
  await page.getByLabel(/^Specialist\b/).fill('Dr. Example');
};

test('health check stores selected rating and diagnoses and survives reload', async ({ page, request }) => {
  await page.goto(`/patients/${await createPatient(request)}`);
  await openEntryForm(page, 'HealthCheck', 'Health check with two diagnoses');
  await page.getByRole('combobox', { name: 'Health rating' }).click();
  await page.getByRole('option', { name: '2 – High risk' }).click();
  await page.getByRole('combobox', { name: 'Diagnosis codes' }).click();
  await page.getByRole('option', { name: 'M24.2 Disorder of ligament', exact: true }).click();
  await page.getByRole('option', { name: 'M51.2 Other specified intervertebral disc displacement', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const entry = page.getByRole('article').filter({ hasText: 'Health check with two diagnoses' });
  await expect(entry.getByText('The patient has a high risk of getting sick')).toBeVisible();
  await expect(entry.getByText('M24.2 Disorder of ligament')).toBeVisible();
  await expect(entry.getByText('M51.2 Other specified intervertebral disc displacement')).toBeVisible();
  await page.reload();
  await expect(entry).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
});

test('hospital entry displays discharge data after saving', async ({ page, request }) => {
  await page.goto(`/patients/${await createPatient(request)}`);
  await openEntryForm(page, 'Hospital', 'Hospital treatment completed');
  await page.getByLabel(/^Discharge date\b/).fill('2026-10-04');
  await page.getByLabel(/^Discharge criteria\b/).fill('Recovered and ready to return home');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const entry = page.getByRole('article').filter({ hasText: 'Hospital treatment completed' });
  await expect(entry.getByText('Hospital', { exact: true })).toBeVisible();
  await expect(entry.getByText('Discharged 2026-10-04: Recovered and ready to return home')).toBeVisible();
});

test('occupational entry supports optional sick leave and employer', async ({ page, request }) => {
  await page.goto(`/patients/${await createPatient(request)}`);
  await openEntryForm(page, 'OccupationalHealthcare', 'Occupational consultation');
  await page.getByLabel(/^Employer\b/).fill('Example company');
  await page.getByLabel('Sick leave start').fill('2026-10-03');
  await page.getByLabel('Sick leave end').fill('2026-10-05');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const entry = page.getByRole('article').filter({ hasText: 'Occupational consultation' });
  await expect(entry.getByText('Occupational healthcare · Example company')).toBeVisible();
  await expect(entry.getByText('Sick leave: 2026-10-03 – 2026-10-05')).toBeVisible();
  await openEntryForm(page, 'OccupationalHealthcare', 'Occupational follow-up without leave');
  await page.getByLabel(/^Employer\b/).fill('Example company');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
});

test('backend rejection preserves entry fields and a corrected retry succeeds', async ({ page, request }) => {
  await page.goto(`/patients/${await createPatient(request)}`);
  await openEntryForm(page, 'HealthCheck', '   ');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('alert')).toContainText('description');
  await expect(page.getByLabel(/^Specialist\b/)).toHaveValue('Dr. Example');
  await expect(page.getByLabel(/^Date\b/)).toHaveValue('2026-10-03');
  await page.getByLabel(/^Description\b/).fill('Corrected health check');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByText('Corrected health check')).toBeVisible();
});

test('unknown patient and unknown page show clear errors with a working Home link', async ({ page }) => {
  await page.goto('/patients/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('alert')).toContainText(/patient not found/i);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Patient list' })).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByRole('alert')).toContainText('Page not found');
});

test('patient list, detail and entry dialog fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'John McClane' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'John McClane' }).click();
  await expect(page.getByRole('heading', { name: 'John McClane' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Add New Entry' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});
