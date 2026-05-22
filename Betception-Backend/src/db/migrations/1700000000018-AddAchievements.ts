import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAchievements1700000000018 implements MigrationInterface {
  name = 'AddAchievements1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallet_transactions
        MODIFY COLUMN kind
          ENUM('deposit','withdraw','bet_place','bet_win','bet_refund','adjustment','reward','crate_reward','achievement_reward')
          NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id           BIGINT UNSIGNED NOT NULL,
        achievement_code  VARCHAR(64) NOT NULL,
        progress          INT UNSIGNED NOT NULL DEFAULT 0,
        unlocked          BOOLEAN NOT NULL DEFAULT FALSE,
        unlocked_at       TIMESTAMP NULL,
        seen_at           TIMESTAMP NULL,
        rewarded_at       TIMESTAMP NULL,
        created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY ux_user_achievement_code (user_id, achievement_code),
        INDEX ix_user_achievements_user_unseen (user_id, unlocked, seen_at)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_achievements;`);

    await queryRunner.query(`
      ALTER TABLE wallet_transactions
        MODIFY COLUMN kind
          ENUM('deposit','withdraw','bet_place','bet_win','bet_refund','adjustment','reward','crate_reward')
          NOT NULL;
    `);
  }
}
