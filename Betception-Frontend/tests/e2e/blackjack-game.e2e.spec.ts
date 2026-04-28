import { expect, test } from '@playwright/test';

import { mockBetceptionApi } from '.\\support\\api-mocks';

const ROUND_ID = 'round-e2e-1';

function makeRound(roundStatus: string, playerStatus: string) {
  const settled = roundStatus === 'settled';
  return {
    id: ROUND_ID,
    status: roundStatus,
    startedAt: new Date().toISOString(),
    endedAt: settled ? new Date().toISOString() : null,
    mainBet: {
      id: 'bet-1',
      amount: '25',
      status: settled ? 'lost' : 'placed',
      payoutMultiplier: settled ? '0' : null,
      settledAmount: settled ? '0' : null,
      settledAt: settled ? new Date().toISOString() : null,
    },
    playerHand: {
      id: 'hand-p',
      ownerType: 'player',
      status: playerStatus,
      handValue: 14,
      cards: [],
    },
    dealerHand: {
      id: 'hand-d',
      ownerType: 'dealer',
      status: settled ? 'settled' : 'active',
      handValue: settled ? 20 : 10,
      cards: [],
    },
    sideBets: [],
    fairness: {
      roundId: ROUND_ID,
      status: roundStatus,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      serverSeedHash: 'abc',
      serverSeed: null,
      revealedAt: null,
    },
  };
}

test.describe('blackjack game flow', () => {
  test('places a bet, deals, stands and shows the round result overlay', async ({ page }) => {
    await mockBetceptionApi(page, { authenticated: true });

    await page.route('**/round/start', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ round: makeRound('in_progress', 'active') }),
      });
    });

    await page.route('**/round/stand/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ round: makeRound('in_progress', 'stood') }),
      });
    });

    await page.route('**/round/settle/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ round: makeRound('settled', 'settled') }),
      });
    });

    await page.goto('/blackjack');

    // Deal button is disabled until a bet is placed
    await expect(page.getByTestId('deal-button')).toBeDisabled();

    // Place a 25-coin chip bet
    await page.getByTestId('chip-25').click();
    await expect(page.getByTestId('deal-button')).not.toBeDisabled();

    // Deal — API responds with an in-progress round
    await page.getByTestId('deal-button').click();
    await expect(page.getByTestId('stand-button')).not.toBeDisabled();
    await expect(page.getByTestId('hit-button')).not.toBeDisabled();

    // Stand — after 850 ms the component auto-settles, then shows the result overlay
    await page.getByTestId('stand-button').click();
    await expect(page.locator('.round-over-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('shows the deal button and no hit/stand when navigating to a fresh blackjack page', async ({
    page,
  }) => {
    await mockBetceptionApi(page, { authenticated: true });
    await page.goto('/blackjack');

    await expect(page.getByTestId('deal-button')).toBeVisible();
    await expect(page.getByTestId('hit-button')).toBeDisabled();
    await expect(page.getByTestId('stand-button')).toBeDisabled();
  });
});
