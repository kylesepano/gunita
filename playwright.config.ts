import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testIgnore: 'admin.spec.ts',
  timeout: 90000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'chrome',
    ...devices['Desktop Chrome'],
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
})
