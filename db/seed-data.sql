USE betception;

-- Reset demo data (optional safety; comment out if not desired)
DELETE FROM wallet_transactions WHERE id BETWEEN 5001 AND 5012;
DELETE FROM user_powerups WHERE id BETWEEN 6001 AND 6004;
DELETE FROM daily_reward_claims WHERE id BETWEEN 7001 AND 7004;
DELETE FROM users WHERE id BETWEEN 1001 AND 1004;

INSERT INTO users (id, username, email, password_hash, balance, xp, level, last_login_at, last_daily_reward_at)
VALUES
  (1001, 'demo_alice', 'alice@example.com', '$2b$12$o6Aom5/oxf81pe9oNVNn1ee7wOy42qlpeKPjt0cd.kvsqHBAHpJ9e', 2500.00, 4200, 8, UTC_TIMESTAMP(), '2025-11-10'),
  (1002, 'demo_bob', 'bob@example.com', '$2b$12$o6Aom5/oxf81pe9oNVNn1ee7wOy42qlpeKPjt0cd.kvsqHBAHpJ9e', 800.00, 1500, 4, UTC_TIMESTAMP(), NULL),
  (1003, 'demo_cara', 'cara@example.com', '$2b$12$o6Aom5/oxf81pe9oNVNn1ee7wOy42qlpeKPjt0cd.kvsqHBAHpJ9e', 120.00, 600, 3, UTC_TIMESTAMP(), '2025-11-09'),
  (1004, 'demo_dan', 'dan@example.com', '$2b$12$o6Aom5/oxf81pe9oNVNn1ee7wOy42qlpeKPjt0cd.kvsqHBAHpJ9e', 5400.00, 9600, 12, UTC_TIMESTAMP(), '2025-11-11')
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  balance = VALUES(balance),
  xp = VALUES(xp),
  level = VALUES(level),
  last_login_at = VALUES(last_login_at),
  last_daily_reward_at = VALUES(last_daily_reward_at);

INSERT INTO wallet_transactions (id, user_id, kind, amount, ref_table, ref_id, created_at) VALUES
  (5001, 1001, 'deposit',   1000.00, 'seed', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
  (5002, 1001, 'bet_place',  -50.00, 'main_bets', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
  (5003, 1001, 'bet_win',    120.00, 'main_bets', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
  (5004, 1001, 'reward',      300.00, 'daily_reward_claims', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)),

  (5005, 1002, 'deposit',    500.00, 'seed', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY)),
  (5006, 1002, 'bet_place',  -80.00, 'main_bets', 2, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY)),
  (5007, 1002, 'bet_place',  -40.00, 'main_bets', 3, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)),
  (5008, 1002, 'bet_win',    160.00, 'main_bets', 3, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)),

  (5009, 1003, 'deposit',    200.00, 'seed', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
  (5010, 1003, 'reward',     220.00, 'daily_reward_claims', 2, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 0 DAY)),

  (5011, 1004, 'deposit',   5000.00, 'seed', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
  (5012, 1004, 'adjustment', 400.00, 'admin_adjustments', 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE
  kind = VALUES(kind),
  amount = VALUES(amount),
  ref_table = VALUES(ref_table),
  ref_id = VALUES(ref_id),
  created_at = VALUES(created_at);

INSERT INTO daily_reward_claims (id, user_id, claim_date, amount)
VALUES
  (7001, 1001, CURDATE(), 300.00),
  (7002, 1002, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 200.00),
  (7003, 1003, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 180.00),
  (7004, 1004, CURDATE(), 400.00)
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount);

INSERT INTO user_powerups (id, user_id, type_id, quantity)
VALUES
  (6001, 1001, (SELECT id FROM powerup_types WHERE code = 'MULTI_PLUS'), 2),
  (6002, 1001, (SELECT id FROM powerup_types WHERE code = 'JOKER_CARD'), 1),
  (6003, 1002, (SELECT id FROM powerup_types WHERE code = 'MULTI_PLUS'), 1),
  (6004, 1004, (SELECT id FROM powerup_types WHERE code = 'NO_LOSS'), 3)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  acquired_at = CURRENT_TIMESTAMP;
