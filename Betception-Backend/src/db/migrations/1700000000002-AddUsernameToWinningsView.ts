import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameToWinningsView1700000000002 implements MigrationInterface {
  name = 'AddUsernameToWinningsView1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=TEMPTABLE VIEW leaderboard_weekly_winnings AS
      SELECT
        wt.user_id,
        u.username,
        SUM(wt.amount) AS net_winnings_7d
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      WHERE wt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY wt.user_id, u.username
      ORDER BY net_winnings_7d DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE ALGORITHM=TEMPTABLE VIEW leaderboard_weekly_winnings AS
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
