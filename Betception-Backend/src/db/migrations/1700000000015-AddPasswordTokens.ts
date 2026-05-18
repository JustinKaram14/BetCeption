import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordTokens1700000000015 implements MigrationInterface {
  name = 'AddPasswordTokens1700000000015';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`password_change_token\` VARCHAR(64) NULL,
        ADD COLUMN \`password_change_token_expires_at\` TIMESTAMP NULL,
        ADD COLUMN \`password_reset_token\` VARCHAR(64) NULL,
        ADD COLUMN \`password_reset_token_expires_at\` TIMESTAMP NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`password_reset_token_expires_at\`,
        DROP COLUMN \`password_reset_token\`,
        DROP COLUMN \`password_change_token_expires_at\`,
        DROP COLUMN \`password_change_token\`
    `);
  }
}
