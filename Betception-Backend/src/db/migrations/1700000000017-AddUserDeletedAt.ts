import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletedAt1700000000017 implements MigrationInterface {
  name = 'AddUserDeletedAt1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasDeletedAt = await queryRunner.hasColumn('users', 'deleted_at');
    if (!hasDeletedAt) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD deleted_at timestamp NULL
      `);
      await queryRunner.query('CREATE INDEX ix_users_deleted_at ON users (deleted_at)');
    }

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_balance AS
      SELECT u.id AS user_id, u.username, u.balance
      FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.balance DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_level AS
      SELECT id AS user_id, username, level, xp
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY level DESC, xp DESC
    `);

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_balance AS
      SELECT u.id AS user_id, u.username, u.balance
      FROM users u
      ORDER BY u.balance DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_level AS
      SELECT id AS user_id, username, level, xp
      FROM users
      ORDER BY level DESC, xp DESC
    `);

    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=MERGE VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY wt.user_id, u.username
      ORDER BY net_winnings_7d DESC
    `);

    const hasDeletedAt = await queryRunner.hasColumn('users', 'deleted_at');
    if (hasDeletedAt) {
      await queryRunner.query('DROP INDEX ix_users_deleted_at ON users');
      await queryRunner.query('ALTER TABLE users DROP COLUMN deleted_at');
    }
  }
}
