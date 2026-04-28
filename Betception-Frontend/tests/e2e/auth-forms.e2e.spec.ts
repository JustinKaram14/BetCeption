import { expect, test } from '@playwright/test';

import { mockBetceptionApi } from '.\\support\\api-mocks';

test.describe('homepage auth flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockBetceptionApi(page);
  });

  test('logs in from the homepage form', async ({ page }) => {
    await page.goto('/homepage');

    await page.getByTestId('auth-email-input').fill('neo@matrix.io');
    await page.getByTestId('auth-password-input').fill('supersecret');
    await page.getByTestId('auth-submit').click();

    await expect(page.getByTestId('homepage-user-panel')).toBeVisible();
    await expect(page.getByTestId('homepage-user-greeting')).toContainText('neo');
  });

  test('registers from the homepage form', async ({ page }) => {
    await page.goto('/homepage');

    await page.getByTestId('auth-tab-register').click();
    await page.getByTestId('auth-email-input').fill('trinity@matrix.io');
    await page.getByTestId('auth-username-input').fill('trinity');
    await page.getByTestId('auth-password-input').fill('supersecret');
    await page.getByTestId('auth-submit').click();

    await expect(page.getByTestId('homepage-user-panel')).toBeVisible();
    await expect(page.getByTestId('homepage-user-greeting')).toContainText('trinity');
  });
});

test.describe('logout flow', () => {
  test('logs out and shows the auth panel again', async ({ page }) => {
    await mockBetceptionApi(page, { authenticated: true });
    await page.goto('/homepage');

    await expect(page.getByTestId('homepage-user-panel')).toBeVisible();

    await page.getByTestId('logout-button').click();

    await expect(page.getByTestId('homepage-user-panel')).toBeHidden();
    await expect(page.getByTestId('auth-submit')).toBeVisible();
  });
});
