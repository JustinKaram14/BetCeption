/**
 * Wallet-Performance-Test
 *
 * Misst Deposit, Wallet-Summary und Transaction-History unter Last.
 * SRS-Ziel: p(95) < 300 ms.
 *
 * Ausführen:
 *   k6 run --env BASE_URL=http://localhost:3001 performance/k6/scenarios/wallet-flow.js
 */

import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import {
  registerUser,
  loginUser,
  deposit,
  walletSummary,
  walletTransactions,
} from '../lib/utils.js';
import { walletThresholds } from '../lib/thresholds.js';

const walletErrors = new Counter('wallet_errors');

const VU_COUNT = 10;

export const options = {
  scenarios: {
    wallet_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: VU_COUNT },
        { duration: '90s', target: VU_COUNT },
        { duration: '15s', target: 0        },
      ],
    },
  },
  thresholds: {
    ...walletThresholds,
    wallet_errors: ['count<10'],
  },
};

export function setup() {
  const users = [];
  const ts    = Date.now();

  for (let i = 0; i < VU_COUNT; i++) {
    const id       = `wf-${i}-${ts}`;
    const email    = `wallet-${id}@betception.test`;
    const username = `wl${id}`.slice(0, 32);
    const password = 'Perf1234!';

    const regRes = registerUser(email, username, password);
    if (regRes.status !== 201) {
      console.error(`setup: Registrierung für Nutzer ${i} fehlgeschlagen`);
      continue;
    }

    const token = loginUser(email, password);
    if (!token) {
      console.error(`setup: Login für Nutzer ${i} fehlgeschlagen`);
      continue;
    }

    users.push({ email, password, token });
  }

  console.log(`setup: ${users.length} Wallet-Testnutzer bereit`);
  return users;
}

export default function (users) {
  if (!users || users.length === 0) {
    walletErrors.add(1);
    return;
  }

  const user = users[(__VU - 1) % users.length];

  // --- Deposit ---
  const depRes = deposit(user.token, 100);
  const depOk  = check(depRes, { 'deposit → 200/201': (r) => r.status === 200 || r.status === 201 });
  if (!depOk) {
    walletErrors.add(1);
    sleep(0.5);
    return;
  }

  // --- Wallet Summary ---
  const summaryRes = walletSummary(user.token);
  check(summaryRes, { 'wallet summary → 200': (r) => r.status === 200 });

  // --- Transaction History ---
  const txRes = walletTransactions(user.token);
  check(txRes, { 'transactions → 200': (r) => r.status === 200 });

  sleep(0.5);
}
