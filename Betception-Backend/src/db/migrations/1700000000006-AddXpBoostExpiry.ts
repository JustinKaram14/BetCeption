import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddXpBoostExpiry1700000000006 implements MigrationInterface {
  name = 'AddXpBoostExpiry1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN xp_boost_expires_at TIMESTAMP NULL DEFAULT NULL
          AFTER streak_expires_at;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN xp_boost_expires_at;`);
  }
}
