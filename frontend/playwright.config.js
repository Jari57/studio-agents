import { defineConfig, devices } from '@playwright/test';

// Keep release tests isolated from a developer's Vite instance. Port 5173 is
// the normal development port and can easily be serving another application.
const FRONTEND_PORT = process.env.PW_FRONTEND_PORT || '4173';
const BACKEND_PORT = process.env.PW_BACKEND_PORT || '3101';
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
process.env.FRONTEND_URL = FRONTEND_URL;
process.env.BACKEND_URL = BACKEND_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 90 * 1000,
  expect: { timeout: 10 * 1000 },
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'node server.js',
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      // A port collision must fail the run. Reusing an arbitrary local backend
      // makes the result non-reproducible and can test the wrong product.
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        PORT: BACKEND_PORT,
        NODE_ENV: 'test',
        FRONTEND_URL,
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      url: FRONTEND_URL,
      // Never reuse a service on Vite's default port (or any test port).
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        VITE_BACKEND_URL: BACKEND_URL,
      },
    },
  ],
});
