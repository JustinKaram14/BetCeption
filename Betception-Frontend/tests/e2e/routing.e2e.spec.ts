import { expect, test } from '@playwright/test';

import { mockBetceptionApi } from '.\\support\\api-mocks';

test.describe('frontend routing', () => {
  test('redirects the root path and unknown routes to homepage', async ({ page }) => {
    await mockBetceptionApi(page);

    await page.goto('/');
    await expect(page).toHaveURL(/\/homepage$/);

    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/homepage$/);
  });

  test('redirects signed-out users away from the protected blackjack route', async ({ page }) => {
    await mockBetceptionApi(page);

    await page.goto('/blackjack');

    await expect(page).toHaveURL(/\/homepage\?redirect=%2Fblackjack$/);
    await expect(page.getByTestId('auth-submit')).toBeVisible();
  });

  test('navigates to blackjack after a successful login', async ({ page }) => {
    await mockBetceptionApi(page);
    await page.goto('/homepage');

    await page.getByTestId('auth-email-input').fill('neo@matrix.io');
    await page.getByTestId('auth-password-input').fill('supersecret');
    await page.getByTestId('auth-submit').click();
    await expect(page.getByTestId('homepage-user-panel')).toBeVisible();

    await page.getByTestId('enter-game-button').click();

    await expect(page).toHaveURL(/\/blackjack$/);
    await expect(page.getByTestId('deal-button')).toBeVisible();
  });
});
