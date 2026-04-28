/**
 * Gemeinsame HTTP-Hilfsfunktionen für alle k6-Szenarien.
 * Jede Funktion setzt das Tag `name` für gefilterte Threshold-Auswertung.
 */

import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function jsonHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function registerUser(email, username, password) {
  return http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, username, password }),
    { headers: jsonHeaders(), tags: { name: 'register' } },
  );
}

export function loginUser(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { name: 'login' } },
  );
  if (res.status !== 200) return null;
  return JSON.parse(res.body).accessToken || null;
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export function walletSummary(token) {
  return http.get(
    `${BASE_URL}/wallet`,
    { headers: jsonHeaders(token), tags: { name: 'wallet_summary' } },
  );
}

export function walletTransactions(token) {
  return http.get(
    `${BASE_URL}/wallet/transactions`,
    { headers: jsonHeaders(token), tags: { name: 'transactions' } },
  );
}

export function deposit(token, amount) {
  return http.post(
    `${BASE_URL}/wallet/deposit`,
    JSON.stringify({ amount }),
    { headers: jsonHeaders(token), tags: { name: 'deposit' } },
  );
}

export function withdraw(token, amount) {
  return http.post(
    `${BASE_URL}/wallet/withdraw`,
    JSON.stringify({ amount }),
    { headers: jsonHeaders(token), tags: { name: 'withdraw' } },
  );
}

// ---------------------------------------------------------------------------
// Round
// ---------------------------------------------------------------------------

export function startRound(token, betAmount) {
  return http.post(
    `${BASE_URL}/round/start`,
    JSON.stringify({ betAmount, sideBets: [] }),
    { headers: jsonHeaders(token), tags: { name: 'round_start' } },
  );
}

export function hitRound(token, roundId) {
  return http.post(
    `${BASE_URL}/round/hit/${roundId}`,
    null,
    { headers: jsonHeaders(token), tags: { name: 'round_hit' } },
  );
}

export function standRound(token, roundId) {
  return http.post(
    `${BASE_URL}/round/stand/${roundId}`,
    null,
    { headers: jsonHeaders(token), tags: { name: 'round_stand' } },
  );
}

export function settleRound(token, roundId) {
  return http.post(
    `${BASE_URL}/round/settle/${roundId}`,
    null,
    { headers: jsonHeaders(token), tags: { name: 'round_settle' } },
  );
}

// ---------------------------------------------------------------------------
// Leaderboard (öffentlich, kein Token erforderlich)
// ---------------------------------------------------------------------------

export function leaderboardBalance() {
  return http.get(
    `${BASE_URL}/leaderboard/balance`,
    { tags: { name: 'leaderboard_balance' } },
  );
}

export function leaderboardLevel() {
  return http.get(
    `${BASE_URL}/leaderboard/level`,
    { tags: { name: 'leaderboard_level' } },
  );
}

export function leaderboardWinnings() {
  return http.get(
    `${BASE_URL}/leaderboard/winnings`,
    { tags: { name: 'leaderboard_winnings' } },
  );
}
