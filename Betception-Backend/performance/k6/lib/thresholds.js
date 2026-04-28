/**
 * SRS-Performanceziele als k6-Threshold-Definitionen.
 *
 * Spiel-Aktionen:     p(95) < 300 ms
 * Auth-Endpunkte:     p(95) < 600 ms
 * Leaderboard/Wallet: p(95) < 300 ms
 * Fehlerrate:         < 1 %
 */

export const GAME_P95_MS        = 300;
export const AUTH_P95_MS        = 600;
export const LEADERBOARD_P95_MS = 300;
export const WALLET_P95_MS      = 300;
export const MAX_ERROR_RATE     = 0.01;

export const authThresholds = {
  'http_req_duration{name:register}': [`p(95)<${AUTH_P95_MS}`],
  'http_req_duration{name:login}'   : [`p(95)<${AUTH_P95_MS}`],
  http_req_failed: [`rate<${MAX_ERROR_RATE}`],
};

export const gameThresholds = {
  'http_req_duration{name:round_start}' : [`p(95)<${GAME_P95_MS}`],
  'http_req_duration{name:round_hit}'   : [`p(95)<${GAME_P95_MS}`],
  'http_req_duration{name:round_stand}' : [`p(95)<${GAME_P95_MS}`],
  'http_req_duration{name:round_settle}': [`p(95)<${GAME_P95_MS}`],
  http_req_failed: [`rate<${MAX_ERROR_RATE}`],
};

export const walletThresholds = {
  'http_req_duration{name:wallet_summary}': [`p(95)<${WALLET_P95_MS}`],
  'http_req_duration{name:deposit}'        : [`p(95)<${WALLET_P95_MS}`],
  'http_req_duration{name:transactions}'   : [`p(95)<${WALLET_P95_MS}`],
  http_req_failed: [`rate<${MAX_ERROR_RATE}`],
};

export const leaderboardThresholds = {
  'http_req_duration{name:leaderboard_balance}' : [`p(95)<${LEADERBOARD_P95_MS}`],
  'http_req_duration{name:leaderboard_level}'   : [`p(95)<${LEADERBOARD_P95_MS}`],
  'http_req_duration{name:leaderboard_winnings}': [`p(95)<${LEADERBOARD_P95_MS}`],
  http_req_failed: [`rate<${MAX_ERROR_RATE}`],
};
