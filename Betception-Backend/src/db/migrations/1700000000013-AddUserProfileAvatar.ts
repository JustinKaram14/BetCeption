import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAvatar1700000000013 implements MigrationInterface {
  name = 'AddUserProfileAvatar1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAvatarIcon = await queryRunner.hasColumn('users', 'avatar_icon');
    if (!hasAvatarIcon) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD avatar_icon varchar(32) NOT NULL DEFAULT 'chip'
      `);
    }

    const hasAvatarColor = await queryRunner.hasColumn('users', 'avatar_color');
    if (!hasAvatarColor) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD avatar_color varchar(32) NOT NULL DEFAULT 'cyan'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAvatarColor = await queryRunner.hasColumn('users', 'avatar_color');
    if (hasAvatarColor) {
      await queryRunner.query('ALTER TABLE users DROP COLUMN avatar_color');
    }

    const hasAvatarIcon = await queryRunner.hasColumn('users', 'avatar_icon');
    if (hasAvatarIcon) {
      await queryRunner.query('ALTER TABLE users DROP COLUMN avatar_icon');
    }
  }
}
