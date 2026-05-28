import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleBetceptionPresets1700000000021 implements MigrationInterface {
  name = 'AllowMultipleBetceptionPresets1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE betception_presets
        ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0 AFTER config_json
    `);

    await queryRunner.query(`
      ALTER TABLE betception_presets
        DROP INDEX IDX_betception_presets_user_unique,
        ADD INDEX IDX_betception_presets_user (user_id)
    `);

    await queryRunner.query(`
      UPDATE betception_presets preset
      JOIN (
        SELECT user_id, MIN(id) AS active_id
        FROM betception_presets
        GROUP BY user_id
      ) first_preset ON first_preset.active_id = preset.id
      SET preset.is_active = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE preset FROM betception_presets preset
      JOIN (
        SELECT user_id, MIN(id) AS keep_id
        FROM betception_presets
        GROUP BY user_id
      ) kept ON kept.user_id = preset.user_id AND kept.keep_id <> preset.id
    `);

    await queryRunner.query(`
      ALTER TABLE betception_presets
        DROP INDEX IDX_betception_presets_user,
        ADD UNIQUE KEY IDX_betception_presets_user_unique (user_id),
        DROP COLUMN is_active
    `);
  }
}
