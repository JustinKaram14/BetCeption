import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeeklyLeaderboards1700000000019 implements MigrationInterface {
  name = 'AddWeeklyLeaderboards1700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_xp_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        amount INT UNSIGNED NOT NULL,
        ref_table VARCHAR(32) NULL,
        ref_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX ix_user_xp_events_user_created (user_id, created_at),
        CONSTRAINT fk_user_xp_events_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_alltime_winnings AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS net_winnings
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.kind IN ('bet_place', 'bet_win', 'bet_refund')
        AND u.deleted_at IS NULL
      GROUP BY wt.user_id, u.username
      ORDER BY net_winnings DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_weekly_balance AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS balance_7d
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
      GROUP BY wt.user_id, u.username
      ORDER BY balance_7d DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_weekly_level AS
      SELECT
        xe.user_id,
        u.username,
        SUM(xe.amount) AS xp_7d
      FROM user_xp_events xe
      JOIN users u ON u.id = xe.user_id
      WHERE xe.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
      GROUP BY xe.user_id, u.username
      ORDER BY xp_7d DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.kind IN ('bet_place', 'bet_win', 'bet_refund')
        AND wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
      GROUP BY wt.user_id, u.username
      ORDER BY net_winnings_7d DESC
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP VIEW IF EXISTS leaderboard_weekly_level');
    await queryRunner.query('DROP VIEW IF EXISTS leaderboard_weekly_balance');
    await queryRunner.query('DROP VIEW IF EXISTS leaderboard_alltime_winnings');

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
      GROUP BY wt.user_id, u.username
      ORDER BY net_winnings_7d DESC
    `);

    await queryRunner.query('DROP TABLE IF EXISTS user_xp_events');
  }
}
