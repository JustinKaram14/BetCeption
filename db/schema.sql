-- ============================================================
-- BetCeption - Full MVP Database Schema (MySQL 8, InnoDB, utf8mb4)
-- ============================================================
-- Includes: Users, Auth, Rounds, Hands, Cards, Bets, Sidebets,
-- Wallet, Daily Rewards, Leaderboards, PowerUps, XP/Levels
-- ============================================================

CREATE DATABASE IF NOT EXISTS betception
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE betception;

-- =============================
-- Core: Users & Sessions
-- =============================
CREATE TABLE IF NOT EXISTS users (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username          VARCHAR(32) NOT NULL UNIQUE,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  balance           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  xp                INT NOT NULL DEFAULT 0,
  level             INT NOT NULL DEFAULT 1,
  last_login_at     TIMESTAMP NULL,
  last_daily_reward_at DATE NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  refresh_token   CHAR(64) NOT NULL UNIQUE,
  user_agent      VARCHAR(255) NULL,
  ip              VARCHAR(45) NULL,
  expires_at      TIMESTAMP NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX ix_sessions_user (user_id, expires_at)
) ENGINE=InnoDB;

-- =============================
-- Core: Rounds
-- =============================
CREATE TABLE IF NOT EXISTS rounds (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  status          ENUM('created','dealing','in_progress','settled','aborted') NOT NULL DEFAULT 'created',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at      TIMESTAMP NULL,
  ended_at        TIMESTAMP NULL,
  server_seed_hash CHAR(64) NULL,
  server_seed     CHAR(64) NULL,
  INDEX ix_round_status (status, created_at)
) ENGINE=InnoDB;

-- =============================
-- Core: Hands
-- =============================
CREATE TABLE IF NOT EXISTS hands (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  round_id        BIGINT UNSIGNED NOT NULL,
  owner_type      ENUM('dealer','player') NOT NULL,
  user_id         BIGINT UNSIGNED NULL,
  parent_hand_id  BIGINT UNSIGNED NULL,
  status          ENUM('active','stood','busted','blackjack','surrendered','settled') NOT NULL DEFAULT 'active',
  hand_value      TINYINT UNSIGNED NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hands_round   FOREIGN KEY (round_id)       REFERENCES rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_hands_user    FOREIGN KEY (user_id)        REFERENCES users(id)  ON DELETE SET NULL,
  CONSTRAINT fk_hands_parent  FOREIGN KEY (parent_hand_id) REFERENCES hands(id)  ON DELETE SET NULL,
  INDEX ix_hands_round (round_id),
  INDEX ix_hands_user (user_id)
) ENGINE=InnoDB;

-- =============================
-- Core: Cards
-- =============================
CREATE TABLE IF NOT EXISTS cards (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  hand_id         BIGINT UNSIGNED NOT NULL,
  draw_order      TINYINT UNSIGNED NOT NULL,
  `rank`          ENUM('2','3','4','5','6','7','8','9','10','J','Q','K','A') NOT NULL,
  suit            ENUM('C','D','H','S') NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cards_hand FOREIGN KEY (hand_id) REFERENCES hands(id) ON DELETE CASCADE,
  UNIQUE KEY ux_cards_hand_draw (hand_id, draw_order),
  INDEX ix_cards_hand (hand_id)
) ENGINE=InnoDB;

-- =============================
-- Core: Main Bets
-- =============================
CREATE TABLE IF NOT EXISTS main_bets (
  id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  round_id            BIGINT UNSIGNED NOT NULL,
  hand_id             BIGINT UNSIGNED NOT NULL,
  user_id             BIGINT UNSIGNED NOT NULL,
  amount              DECIMAL(18,2) NOT NULL,
  status              ENUM('placed','won','lost','push','refunded','void') NOT NULL DEFAULT 'placed',
  payout_multiplier   DECIMAL(6,3) NULL,
  settled_amount      DECIMAL(18,2) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at          TIMESTAMP NULL,
  CONSTRAINT fk_main_bets_round FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_main_bets_hand  FOREIGN KEY (hand_id)  REFERENCES hands(id)  ON DELETE CASCADE,
  CONSTRAINT fk_main_bets_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  UNIQUE KEY ux_main_bet_hand (hand_id),
  INDEX ix_main_bets_user_round (user_id, round_id)
) ENGINE=InnoDB;

-- =============================
-- Sidebet Catalog
-- =============================
CREATE TABLE IF NOT EXISTS sidebet_types (
  id              TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(64) NOT NULL UNIQUE,
  title           VARCHAR(128) NOT NULL,
  description     VARCHAR(512) NULL,
  base_odds       DECIMAL(8,3) NULL,
  config_json     JSON NULL
) ENGINE=InnoDB;

-- =============================
-- Side Bets
-- =============================
CREATE TABLE IF NOT EXISTS side_bets (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  round_id        BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  type_id         TINYINT UNSIGNED NOT NULL,
  amount          DECIMAL(18,2) NOT NULL,
  predicted_color ENUM('RED','BLACK') NULL,
  predicted_suit  ENUM('C','D','H','S') NULL,
  predicted_rank  ENUM('2','3','4','5','6','7','8','9','10','J','Q','K','A') NULL,
  target_context  ENUM('FIRST_PLAYER_CARD','FIRST_DEALER_CARD') NOT NULL DEFAULT 'FIRST_PLAYER_CARD',
  status          ENUM('placed','won','lost','refunded','void') NOT NULL DEFAULT 'placed',
  odds            DECIMAL(8,3) NULL,
  settled_amount  DECIMAL(18,2) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at      TIMESTAMP NULL,
  CONSTRAINT fk_side_bets_round FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_side_bets_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_side_bets_type  FOREIGN KEY (type_id)  REFERENCES sidebet_types(id) ON DELETE RESTRICT,
  INDEX ix_sidebets_user_round (user_id, round_id)
) ENGINE=InnoDB;

-- =============================
-- Wallet Transactions
-- =============================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  kind        ENUM('deposit','withdraw','bet_place','bet_win','bet_refund','adjustment','reward') NOT NULL,
  amount      DECIMAL(18,2) NOT NULL,  -- signed (+/-)
  ref_table   VARCHAR(32) NULL,
  ref_id      BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX ix_wallet_user_created (user_id, created_at)
) ENGINE=InnoDB;

-- =============================
-- Daily Rewards
-- =============================
CREATE TABLE IF NOT EXISTS daily_reward_claims (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  claim_date DATE NOT NULL,
  amount     DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_daily_reward (user_id, claim_date),
  CONSTRAINT fk_daily_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================
-- PowerUps (Shop & Inventory)
-- =============================
CREATE TABLE IF NOT EXISTS powerup_types (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(128) NOT NULL,
  description VARCHAR(512),
  min_level INT NOT NULL DEFAULT 1,
  price DECIMAL(18,2) NOT NULL,
  effect_json JSON NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_powerups (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type_id TINYINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  acquired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_powerups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_powerups_type FOREIGN KEY (type_id) REFERENCES powerup_types(id) ON DELETE RESTRICT,
  UNIQUE KEY ux_user_powerups (user_id, type_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS powerup_consumptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type_id TINYINT UNSIGNED NOT NULL,
  round_id BIGINT UNSIGNED NULL,
  consumed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pu_cons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pu_cons_type FOREIGN KEY (type_id) REFERENCES powerup_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================
-- Leaderboards (Views)
-- =============================
DROP VIEW IF EXISTS leaderboard_balance;
CREATE ALGORITHM=MERGE VIEW leaderboard_balance AS
SELECT u.id AS user_id, u.username, u.balance
FROM users u
ORDER BY u.balance DESC;

DROP VIEW IF EXISTS leaderboard_weekly_winnings;
CREATE ALGORITHM=MERGE VIEW leaderboard_weekly_winnings AS
SELECT
  wt.user_id,
  SUM(wt.amount) AS net_winnings_7d
FROM wallet_transactions wt
WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY wt.user_id
ORDER BY net_winnings_7d DESC;

DROP VIEW IF EXISTS leaderboard_level;
CREATE ALGORITHM=MERGE VIEW leaderboard_level AS
SELECT id AS user_id, username, level, xp
FROM users
ORDER BY level DESC, xp DESC;

-- =============================
-- Seed Sidebet Types
-- =============================
INSERT INTO sidebet_types (code, title, description, base_odds, config_json) VALUES
('FIRST_CARD_COLOR','Erste Karte: Farbe','Tippe, ob die erste aufgedeckte Karte rot oder schwarz ist', 2.000,
 JSON_OBJECT('fields', JSON_ARRAY('predicted_color'),'context', JSON_ARRAY('FIRST_PLAYER_CARD','FIRST_DEALER_CARD'))),
('FIRST_CARD_SUIT','Erste Karte: Symbol','Tippe genaue Farbe (♣/♦/♥/♠)', 4.000,
 JSON_OBJECT('fields', JSON_ARRAY('predicted_suit'),'context', JSON_ARRAY('FIRST_PLAYER_CARD','FIRST_DEALER_CARD'))),
('FIRST_CARD_RANK','Erste Karte: Wert','Tippe den Rang der ersten Karte', 13.000,
 JSON_OBJECT('fields', JSON_ARRAY('predicted_rank'),'context', JSON_ARRAY('FIRST_PLAYER_CARD','FIRST_DEALER_CARD')))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  base_odds = VALUES(base_odds),
  config_json = VALUES(config_json);

-- =============================
-- Seed Example PowerUps
-- =============================
INSERT INTO powerup_types (code, title, description, min_level, price, effect_json) VALUES
('MULTI_PLUS','Multiplikator-Pille','Erhöht Sidebet-Multiplikatoren um +20%', 3, 500,
 JSON_OBJECT('multiplier_bonus', 0.2)),
('JOKER_CARD','Joker-Pille','Einmaliger Schutz: Bust wird zu Push', 5, 1000,
 JSON_OBJECT('joker', 1)),
('NO_LOSS','Schutz-Pille','10% Chance, Einsatz zurückzubekommen, wenn verloren', 7, 1500,
 JSON_OBJECT('no_loss_chance', 0.1))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  min_level = VALUES(min_level),
  price = VALUES(price),
  effect_json = VALUES(effect_json);

-- ============================================================
-- End of BetCeption Schema
-- ============================================================
