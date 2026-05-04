import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.\\tests\\e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  // ng serve is started/stopped by globalSetup/globalTeardown so we have full
  // control over spawn options (stdio, env) and avoid Windows pipe-buffer issues
  // that plagued the built-in webServer mechanism.
  globalSetup: './tests/e2e/support/global-setup',
  globalTeardown: './tests/e2e/support/global-teardown',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
