import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStreakToUsersAndClaims1700000000005 implements MigrationInterface {
  name = 'AddStreakToUsersAndClaims1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN login_streak      INT UNSIGNED NOT NULL DEFAULT 0
          AFTER last_daily_reward_at,
        ADD COLUMN streak_expires_at DATE NULL
          AFTER login_streak;
    `);

    await queryRunner.query(`
      ALTER TABLE daily_reward_claims
        ADD COLUMN streak_day INT UNSIGNED NOT NULL DEFAULT 1
          AFTER claim_date;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE daily_reward_claims DROP COLUMN streak_day;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN streak_expires_at;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN login_streak;`);
  }
}
