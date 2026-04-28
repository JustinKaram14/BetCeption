/**
 * Auth-Flow-Performance-Test
 *
 * Misst Register- und Login-Latenzen unter Ramp-Last.
 * SRS-Ziel: p(95) < 600 ms für beide Endpunkte.
 *
 * Hinweis: Die Auth-Rate-Limitierung muss in der Perf-Umgebung
 * hochgesetzt sein (AUTH_RATE_LIMIT_MAX >= 500 in docker-compose.perf.yml).
 *
 * Ausführen:
 *   k6 run --env BASE_URL=http://localhost:3001 performance/k6/scenarios/auth-flow.js
 */

import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { registerUser, loginUser } from '../lib/utils.js';
import { authThresholds } from '../lib/thresholds.js';

const authErrors = new Counter('auth_errors');

export const options = {
  scenarios: {
    auth_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 5  },  // hochfahren
        { duration: '60s', target: 10 },  // Lasthaltephase
        { duration: '20s', target: 0  },  // abkühlen
      ],
    },
  },
  thresholds: {
    ...authThresholds,
    auth_errors: ['count<10'],
  },
};

export default function () {
  // Eindeutige Nutzer-ID pro VU + Iteration
  const uid   = `${__VU}-${__ITER}`;
  const email    = `perf-auth-${uid}@betception.test`;
  const username = `pa${uid}`.slice(0, 32);
  const password = 'Perf1234!';

  // --- Register ---
  const regRes = registerUser(email, username, password);
  const regOk = check(regRes, { 'register → 201': (r) => r.status === 201 });
  if (!regOk) {
    authErrors.add(1);
    return;
  }

  sleep(0.5);

  // --- Login ---
  const token = loginUser(email, password);
  const loginOk = check(token, { 'login → accessToken present': (t) => t !== null });
  if (!loginOk) {
    authErrors.add(1);
    return;
  }

  sleep(1);
}
