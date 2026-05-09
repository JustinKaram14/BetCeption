import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceWinnerWithDealerBustSidebet1700000000010 implements MigrationInterface {
  name = 'ReplaceWinnerWithDealerBustSidebet1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE sidebet_types
      SET
        code = 'DEALER_BUST',
        title = 'Dealer Bust',
        description = 'Predict whether the dealer busts this round',
        base_odds = 3.000,
        config_json = JSON_OBJECT('fields', JSON_ARRAY('dealer_bust'))
      WHERE code = 'WINNER'
    `);

    await queryRunner.query(`
      INSERT INTO sidebet_types (code, title, description, base_odds, config_json) VALUES
        (
          'DEALER_BUST',
          'Dealer Bust',
          'Predict whether the dealer busts this round',
          3.000,
          JSON_OBJECT('fields', JSON_ARRAY('dealer_bust'))
        )
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        base_odds = VALUES(base_odds),
        config_json = VALUES(config_json)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE sidebet_types
      SET
        code = 'WINNER',
        title = 'Winner',
        description = 'Predict whether player or dealer wins the round',
        base_odds = 2.000,
        config_json = JSON_OBJECT('fields', JSON_ARRAY('winner'))
      WHERE code = 'DEALER_BUST'
    `);
  }
}
