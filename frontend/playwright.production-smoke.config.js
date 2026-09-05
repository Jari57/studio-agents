import { defineConfig, devices } from '@playwright/test';

// Read-only landing-page checks. No auth, generation, or account mutations.
export default defineConfig({
  testDir: './tests',
  testMatch: 'mobile.spec.js',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'https://studioagentsai.com', screenshot: 'only-on-failure' },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
