import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './frontend-checks',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  projects: [
    { name: 'course', testMatch: 'course.test.ts', use: { baseURL: 'http://localhost:5174' } },
    { name: 'flight-diaries', testMatch: 'flight.test.ts', use: { baseURL: 'http://localhost:5175' } },
  ],
});
