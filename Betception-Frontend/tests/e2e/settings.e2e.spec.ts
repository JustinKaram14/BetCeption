import { expect, test } from '@playwright/test';

import { mockBetceptionApi } from '.\\support\\api-mocks';

test.describe('settings menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockBetceptionApi(page);
    await page.goto('/homepage');
  });

  test('opens on click and shows the language carousel', async ({ page }) => {
    await page.getByTestId('settings-button').click();

    await expect(page.getByTestId('settings-popover')).toBeVisible();
    await expect(page.getByTestId('settings-language-current')).toBeVisible();
  });

  test('cycles to the next language when clicking the next arrow', async ({ page }) => {
    await page.getByTestId('settings-button').click();

    const initialText = await page.getByTestId('settings-language-current').textContent();

    await page.getByTestId('settings-language-next').click();

    const updatedText = await page.getByTestId('settings-language-current').textContent();
    expect(updatedText).not.toBe(initialText);
  });

  test('cycles to the previous language when clicking the back arrow', async ({ page }) => {
    await page.getByTestId('settings-button').click();

    // Move forward first so going back is meaningful
    await page.getByTestId('settings-language-next').click();
    const afterNext = await page.getByTestId('settings-language-current').textContent();

    await page.getByTestId('settings-language-previous').click();
    const afterPrevious = await page.getByTestId('settings-language-current').textContent();

    expect(afterPrevious).not.toBe(afterNext);
  });

  test('closes on Escape and returns focus to the settings button', async ({ page }) => {
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('settings-popover')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('settings-popover')).toBeHidden();
    await expect(page.getByTestId('settings-button')).toBeFocused();
  });

  test('changing the language updates visible page text', async ({ page }) => {
    // Default language is 'de' — the "How to play" button shows German text
    const germanText = await page.getByTestId('how-to-play-button').textContent();

    await page.getByTestId('settings-button').click();
    // Switch from 'de' to 'en'
    await page.getByTestId('settings-language-next').click();
    await page.keyboard.press('Escape');

    const englishText = await page.getByTestId('how-to-play-button').textContent();
    expect(englishText?.trim()).not.toBe(germanText?.trim());
  });
});
