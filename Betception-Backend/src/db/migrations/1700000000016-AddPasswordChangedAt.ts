import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordChangedAt1700000000016 implements MigrationInterface {
  name = 'AddPasswordChangedAt1700000000016';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`password_changed_at\` TIMESTAMP NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP COLUMN \`password_changed_at\`
    `);
  }
}
