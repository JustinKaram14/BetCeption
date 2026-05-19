import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FilterUnverifiedFromLeaderboards1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_balance AS
      SELECT u.id AS user_id, u.username, u.balance
      FROM users u
      WHERE u.email_verified = TRUE
      ORDER BY u.balance DESC;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_level AS
      SELECT id AS user_id, username, level, xp
      FROM users
      WHERE email_verified = TRUE
      ORDER BY level DESC, xp DESC;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=UNDEFINED VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      INNER JOIN users u ON u.id = wt.user_id AND u.email_verified = TRUE
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY wt.user_id
      ORDER BY net_winnings_7d DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_balance AS
      SELECT u.id AS user_id, u.username, u.balance
      FROM users u
      ORDER BY u.balance DESC;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_level AS
      SELECT id AS user_id, username, level, xp
      FROM users
      ORDER BY level DESC, xp DESC;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=UNDEFINED VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY wt.user_id
      ORDER BY net_winnings_7d DESC;
    `);
  }
}
