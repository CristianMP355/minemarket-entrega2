import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Levanta automáticamente backend y frontend antes de ejecutar las pruebas E2E.
  webServer: [
    {
      command: 'npm --prefix ../backend start',
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
