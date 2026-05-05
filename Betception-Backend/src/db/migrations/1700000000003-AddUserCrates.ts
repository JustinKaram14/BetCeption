import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCrates1700000000003 implements MigrationInterface {
  name = 'AddUserCrates1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_crates (
        id                      BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id                 BIGINT UNSIGNED NOT NULL,
        tier                    TINYINT UNSIGNED NOT NULL,
        acquired_level          INT NOT NULL,
        acquired_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        opened                  BOOLEAN NOT NULL DEFAULT FALSE,
        opened_at               TIMESTAMP NULL,
        reward_kind             ENUM('coins','powerup') NULL,
        reward_coins            DECIMAL(18,2) NULL,
        reward_powerup_type_id  TINYINT UNSIGNED NULL,
        CONSTRAINT fk_crates_user    FOREIGN KEY (user_id)                REFERENCES users(id)         ON DELETE CASCADE,
        CONSTRAINT fk_crates_powerup FOREIGN KEY (reward_powerup_type_id) REFERENCES powerup_types(id) ON DELETE SET NULL,
        INDEX ix_crates_user (user_id, opened)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_crates;`);
  }
}
