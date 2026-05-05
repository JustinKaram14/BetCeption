import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivePowerPills1700000000008 implements MigrationInterface {
  name = 'AddActivePowerPills1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN active_powerup_type_id TINYINT UNSIGNED NULL AFTER xp_boost_expires_at,
        ADD COLUMN active_powerup_uses_remaining INT UNSIGNED NOT NULL DEFAULT 0 AFTER active_powerup_type_id
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT FK_users_active_powerup_type
        FOREIGN KEY (active_powerup_type_id) REFERENCES powerup_types(id)
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      INSERT INTO powerup_types (code, title, description, min_level, price, effect_json) VALUES
        ('RED_PILL', 'Red Pill', '1:5 chance to trigger x3 payout on main wins.', 1, 300.00,
          JSON_OBJECT('color', 'red', 'chance_denominator', 5, 'payout_multiplier', 3, 'uses', 3)),
        ('BLUE_PILL', 'Blue Pill', '1:8 chance to trigger safe-round protection (no loss).', 1, 300.00,
          JSON_OBJECT('color', 'blue', 'chance_denominator', 8, 'safe_round', TRUE, 'uses', 3))
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        min_level = VALUES(min_level),
        price = VALUES(price),
        effect_json = VALUES(effect_json)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP FOREIGN KEY FK_users_active_powerup_type');
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN active_powerup_uses_remaining,
        DROP COLUMN active_powerup_type_id
    `);
  }
}
