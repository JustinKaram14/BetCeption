import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBetceptionSidebets1700000000009 implements MigrationInterface {
  name = 'AddBetceptionSidebets1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasSelectionJson = await queryRunner.hasColumn('side_bets', 'selection_json');
    if (!hasSelectionJson) {
      await queryRunner.query(`
        ALTER TABLE side_bets
        ADD COLUMN selection_json JSON NULL AFTER target_context
      `);
    }

    await queryRunner.query(`
      INSERT INTO sidebet_types (code, title, description, base_odds, config_json) VALUES
        (
          'CARD_EXACT',
          'Exact Card',
          'Predict one exact card that appears in the player hand this round',
          12.000,
          JSON_OBJECT('fields', JSON_ARRAY('predicted_suit','predicted_rank'), 'context', JSON_ARRAY('PLAYER_HAND'))
        ),
        (
          'DEALER_BUST',
          'Dealer Bust',
          'Predict whether the dealer busts this round',
          3.000,
          JSON_OBJECT('fields', JSON_ARRAY('dealer_bust'))
        ),
        (
          'PILL_TRIGGER',
          'Pill Trigger',
          'Predict whether the active pill effect triggers this round',
          5.000,
          JSON_OBJECT('fields', JSON_ARRAY('powerup_code'), 'dynamicOdds', true)
        ),
        (
          'PLAYER_BLACKJACK',
          'Player Blackjack',
          'Predict whether the player hits blackjack',
          12.000,
          JSON_OBJECT('fields', JSON_ARRAY())
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
      WHERE code IN ('CARD_EXACT','DEALER_BUST','PILL_TRIGGER','PLAYER_BLACKJACK')
    `);

    const hasSelectionJson = await queryRunner.hasColumn('side_bets', 'selection_json');
    if (hasSelectionJson) {
      await queryRunner.query(`
        ALTER TABLE side_bets
        DROP COLUMN selection_json
      `);
    }
  }
}
