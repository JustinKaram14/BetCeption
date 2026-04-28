/**
 * Leaderboard-Performance-Test
 *
 * Misst alle drei Leaderboard-Endpunkte (Balance, Level, Winnings) unter Last.
 * Der Leaderboard-Endpunkt ist öffentlich – kein Auth-Token erforderlich.
 * SRS-Ziel: p(95) < 300 ms.
 *
 * Ausführen:
 *   k6 run --env BASE_URL=http://localhost:3001 performance/k6/scenarios/leaderboard.js
 */

import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import {
  leaderboardBalance,
  leaderboardLevel,
  leaderboardWinnings,
} from '../lib/utils.js';
import { leaderboardThresholds } from '../lib/thresholds.js';

const lbErrors = new Counter('leaderboard_errors');

export const options = {
  scenarios: {
    leaderboard_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 20  },  // Leaderboard verträgt höhere Last
        { duration: '90s', target: 20  },
        { duration: '15s', target: 0   },
      ],
    },
  },
  thresholds: {
    ...leaderboardThresholds,
    leaderboard_errors: ['count<5'],
  },
};

export default function () {
  // Balance-Leaderboard
  const balRes = leaderboardBalance();
  const balOk  = check(balRes, { 'leaderboard balance → 200': (r) => r.status === 200 });
  if (!balOk) lbErrors.add(1);

  // Level-Leaderboard
  const lvlRes = leaderboardLevel();
  const lvlOk  = check(lvlRes, { 'leaderboard level → 200': (r) => r.status === 200 });
  if (!lvlOk) lbErrors.add(1);

  // Weekly-Winnings-Leaderboard
  const winRes = leaderboardWinnings();
  const winOk  = check(winRes, { 'leaderboard winnings → 200': (r) => r.status === 200 });
  if (!winOk) lbErrors.add(1);

  sleep(0.5);
}
