/**
 * Game-Flow-Performance-Test
 *
 * Misst den vollständigen Blackjack-Rundenablauf unter Last:
 *   Round Start → Stand → Settle + Wallet Summary
 *
 * SRS-Ziel: p(95) < 300 ms für alle Spielaktionen.
 *
 * Vorbereitung (setup): Erstellt VU_COUNT Testnutzer und loggt sie ein.
 * Jede VU bekommt ihren eigenen Nutzer zugewiesen, um Konflikte bei
 * aktiven Runden zu vermeiden.
 *
 * Ausführen:
 *   k6 run --env BASE_URL=http://localhost:3001 performance/k6/scenarios/game-flow.js
 */

import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import {
  registerUser,
  loginUser,
  deposit,
  startRound,
  standRound,
  settleRound,
  walletSummary,
} from '../lib/utils.js';
import { gameThresholds } from '../lib/thresholds.js';

const gameErrors = new Counter('game_errors');

// Anzahl vorab registrierter Testnutzer (= max. gleichzeitige VUs)
const VU_COUNT = 10;

export const options = {
  scenarios: {
    blackjack_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: VU_COUNT },  // hochfahren
        { duration: '90s', target: VU_COUNT },  // Lasthaltephase
        { duration: '15s', target: 0         },  // abkühlen
      ],
    },
  },
  thresholds: {
    ...gameThresholds,
    game_errors: ['count<10'],
  },
};

/**
 * Einmalige Setup-Phase: Nutzer registrieren, einloggen und Guthaben aufladen.
 * Die zurückgegebenen Daten werden allen VUs übergeben.
 */
export function setup() {
  const users = [];
  const ts    = Date.now();

  for (let i = 0; i < VU_COUNT; i++) {
    const id       = `gf-${i}-${ts}`;
    const email    = `game-${id}@betception.test`;
    const username = `gm${id}`.slice(0, 32);
    const password = 'Perf1234!';

    const regRes = registerUser(email, username, password);
    if (regRes.status !== 201) {
      console.error(`setup: Registrierung für Nutzer ${i} fehlgeschlagen – ${regRes.body}`);
      continue;
    }

    const token = loginUser(email, password);
    if (!token) {
      console.error(`setup: Login für Nutzer ${i} fehlgeschlagen`);
      continue;
    }

    // Guthaben für viele Runden bereitstellen (10 € pro Runde, 200 Runden)
    const depRes = deposit(token, 2000);
    if (depRes.status !== 200 && depRes.status !== 201) {
      console.warn(`setup: Einzahlung für Nutzer ${i} nicht erfolgreich – ${depRes.body}`);
    }

    users.push({ email, password, token });
  }

  console.log(`setup: ${users.length} Testnutzer bereit`);
  return users;
}

/**
 * Haupt-Schleife: jede VU spielt eine vollständige Blackjack-Runde.
 */
export default function (users) {
  if (!users || users.length === 0) {
    gameErrors.add(1);
    return;
  }

  // Jede VU bekommt einen festen Nutzer (VU-IDs starten bei 1)
  const user = users[(__VU - 1) % users.length];

  // --- Round Start ---
  const startRes = startRound(user.token, 10);
  const startOk  = check(startRes, { 'round start → 201': (r) => r.status === 201 });
  if (!startOk) {
    // Möglicherweise abgelaufenes Token – neu einloggen und weiterfahren
    const newToken = loginUser(user.email, user.password);
    if (newToken) user.token = newToken;
    gameErrors.add(1);
    sleep(1);
    return;
  }

  const roundId = JSON.parse(startRes.body).round.id;

  // --- Stand (einfachster Pfad ohne Bustrisiko) ---
  const standRes = standRound(user.token, roundId);
  const standOk  = check(standRes, { 'round stand → 200': (r) => r.status === 200 });
  if (!standOk) {
    gameErrors.add(1);
    sleep(1);
    return;
  }

  // --- Settle ---
  const settleRes = settleRound(user.token, roundId);
  check(settleRes, { 'round settle → 200': (r) => r.status === 200 });

  // --- Wallet Summary ---
  const walletRes = walletSummary(user.token);
  check(walletRes, { 'wallet summary → 200': (r) => r.status === 200 });

  sleep(1);
}
