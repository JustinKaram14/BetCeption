import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRateLimitCounters1700000000001 implements MigrationInterface {
  name = 'AddRateLimitCounters1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_counters (
        \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
        points INT UNSIGNED NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        INDEX ix_rate_limit_expires (expires_at)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS rate_limit_counters;`);
  }
}
