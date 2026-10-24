import { test, expect } from '@playwright/test';

test('renders all six typed parts, variant attributes and the computed total', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Half Stack application development' })).toBeVisible();
  await expect(page.locator('section')).toHaveCount(6);
  for (const title of ['Fundamentals · 10', 'Using props to pass data · 7', 'Basics of type Narrowing · 7', 'Deeper type usage · 14', 'TypeScript in frontend · 10', 'Backend development · 21']) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  for (const text of ['This is an awesome course part', 'Group projects: 3', 'How to go from unknown to string', 'Confusing description', 'a hard part', 'Typing the backend', 'Required skills: nodejs, jest', 'Number of exercises 69']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'https://type-level-typescript.com/template-literal-types' })).toHaveAttribute('href', 'https://type-level-typescript.com/template-literal-types');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
