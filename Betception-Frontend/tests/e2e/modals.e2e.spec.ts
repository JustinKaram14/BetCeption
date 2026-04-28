import { expect, test } from '@playwright/test';

import { mockBetceptionApi } from '.\\support\\api-mocks';

test.describe('modal and responsive browser flows', () => {
  test('opens the how-to-play modal and closes it with escape', async ({ page }) => {
    await mockBetceptionApi(page);
    await page.goto('/homepage');

    await page.getByTestId('how-to-play-button').click();

    await expect(page.getByTestId('how-to-play-card')).toBeVisible();
    await expect(page.getByTestId('how-to-play-close')).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('how-to-play-card')).toBeHidden();
  });

  test('opens the daily reward modal for authenticated users and closes it with escape', async ({ page }) => {
    await mockBetceptionApi(page, { authenticated: true, rewardState: 'success' });
    await page.goto('/homepage');

    await expect(page.getByTestId('homepage-user-panel')).toBeVisible();
    await page.getByTestId('daily-rewards-button').click();

    await expect(page.getByTestId('daily-reward-card')).toBeVisible();
    await expect(page.getByTestId('daily-reward-close')).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('daily-reward-card')).toBeHidden();
  });

  test('uses the stacked homepage layout on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 560, height: 900 });
    await mockBetceptionApi(page);
    await page.goto('/homepage');

    const flexDirection = await page
      .getByTestId('homepage-main-content')
      .evaluate((element) => window.getComputedStyle(element).flexDirection);

    expect(flexDirection).toBe('column');
  });

  test('Tab key navigates between focusable controls inside the how-to-play modal', async ({ page }) => {
    await mockBetceptionApi(page);
    await page.goto('/homepage');

    await page.getByTestId('how-to-play-button').click();
    await expect(page.getByTestId('how-to-play-card')).toBeVisible();
    await expect(page.getByTestId('how-to-play-close')).toBeFocused();

    // Tab through close + 6 step-dots to reach the "Next" button
    // (Previous is disabled at step 0 and therefore not in the tab order)
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.getByTestId('how-to-play-next')).toBeFocused();
  });
});
