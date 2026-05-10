import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpandedBetceptionSidebets1700000000012 implements MigrationInterface {
  name = 'AddExpandedBetceptionSidebets1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO sidebet_types (code, title, description, base_odds, config_json) VALUES
        (
          'CARD_SUIT',
          'Card Suit',
          'Predict whether any player card of a selected suit appears this round',
          2.000,
          JSON_OBJECT('fields', JSON_ARRAY('predicted_suit'), 'context', JSON_ARRAY('PLAYER_HAND'))
        ),
        (
          'SPLIT_COUNT',
          'Split Count',
          'Predict exactly how many split hands are created this round',
          4.000,
          JSON_OBJECT('fields', JSON_ARRAY('split_count'), 'dynamicOdds', true)
        )
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        base_odds = VALUES(base_odds),
        config_json = VALUES(config_json);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM sidebet_types
      WHERE code IN ('CARD_SUIT','SPLIT_COUNT')
    `);
  }
}
