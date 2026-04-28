import { Page, Route } from '@playwright/test';

type MockUser = {
  sub: string;
  email: string;
  username: string;
};

type MockApiOptions = {
  authenticated?: boolean;
  rewardState?: 'success' | 'already-claimed';
  claimedAmount?: number;
  rewardBalance?: number;
  user?: Partial<MockUser>;
};

const defaultUser: MockUser = {
  sub: 'user-1',
  email: 'neo@matrix.io',
  username: 'neo',
};

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createAccessToken(user: MockUser) {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({
    sub: user.sub,
    email: user.email,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })}.playwright-signature`;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockBetceptionApi(page: Page, options: MockApiOptions = {}) {
  let activeUser: MockUser = {
    ...defaultUser,
    ...options.user,
  };

  const rewardEligibleAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await page.route('**/leaderboard/balance*', async (route) => {
    await fulfillJson(route, {
      total: 1,
      limit: 100,
      offset: 0,
      currentUserRank: 1,
      items: [
        {
          rank: 1,
          userId: activeUser.sub,
          username: activeUser.username,
          balance: 1600,
        },
      ],
    });
  });

  await page.route('**/leaderboard/level*', async (route) => {
    await fulfillJson(route, {
      total: 1,
      limit: 100,
      offset: 0,
      currentUserRank: 1,
      items: [
        {
          rank: 1,
          userId: activeUser.sub,
          username: activeUser.username,
          level: 4,
          xp: 1250,
        },
      ],
    });
  });

  await page.route('**/leaderboard/winnings*', async (route) => {
    await fulfillJson(route, {
      total: 1,
      limit: 100,
      offset: 0,
      currentUserRank: 1,
      items: [
        {
          rank: 1,
          userId: activeUser.sub,
          username: activeUser.username,
          netWinnings7d: 420,
        },
      ],
    });
  });

  await page.route('**/auth/refresh', async (route) => {
    if (!options.authenticated) {
      await fulfillJson(route, { message: 'Unauthorized' }, 401);
      return;
    }

    await fulfillJson(route, {
      accessToken: createAccessToken(activeUser),
    });
  });

  await page.route('**/auth/register', async (route) => {
    const payload = JSON.parse(route.request().postData() ?? '{}');
    activeUser = {
      ...activeUser,
      email: payload.email ?? activeUser.email,
      username: payload.username ?? activeUser.username,
    };

    await fulfillJson(route, { message: 'ok' }, 201);
  });

  await page.route('**/auth/login', async (route) => {
    const payload = JSON.parse(route.request().postData() ?? '{}');
    activeUser = {
      ...activeUser,
      email: payload.email ?? activeUser.email,
    };

    await fulfillJson(route, {
      accessToken: createAccessToken(activeUser),
    });
  });

  await page.route('**/auth/logout', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/wallet', async (route) => {
    await fulfillJson(route, {
      id: 'wallet-1',
      username: activeUser.username,
      balance: options.rewardBalance ?? 1600,
      xp: 1250,
      level: 4,
      lastDailyRewardAt: null,
    });
  });

  await page.route('**/rewards/daily/claim', async (route) => {
    if (options.rewardState === 'already-claimed') {
      await fulfillJson(
        route,
        {
          message: 'Already claimed',
          eligibleAt: rewardEligibleAt,
        },
        409,
      );
      return;
    }

    await fulfillJson(route, {
      claimedAmount: options.claimedAmount ?? 100,
      balance: options.rewardBalance ?? 1700,
      eligibleAt: rewardEligibleAt,
    });
  });

  await page.route('**/round/active', async (route) => {
    await fulfillJson(route, { message: 'No active round' }, 404);
  });
}
