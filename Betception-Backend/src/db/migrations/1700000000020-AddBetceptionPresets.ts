import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBetceptionPresets1700000000020 implements MigrationInterface {
  name = 'AddBetceptionPresets1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS betception_presets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(48) NOT NULL DEFAULT 'Preset',
        stake_mode VARCHAR(16) NOT NULL DEFAULT 'fixed',
        config_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY IDX_betception_presets_user_unique (user_id),
        CONSTRAINT FK_betception_presets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS betception_presets');
  }
}
