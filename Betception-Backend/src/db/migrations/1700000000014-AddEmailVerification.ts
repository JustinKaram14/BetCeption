import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1700000000014 implements MigrationInterface {
  name = 'AddEmailVerification1700000000014';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`email_verified\` TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN \`email_verification_token\` VARCHAR(64) NULL,
        ADD COLUMN \`email_verification_token_expires_at\` TIMESTAMP NULL
    `);
    // Mark all existing users as already verified so they don't lose access
    await queryRunner.query(`UPDATE \`users\` SET \`email_verified\` = 1`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`email_verification_token_expires_at\`,
        DROP COLUMN \`email_verification_token\`,
        DROP COLUMN \`email_verified\`
    `);
  }
}
