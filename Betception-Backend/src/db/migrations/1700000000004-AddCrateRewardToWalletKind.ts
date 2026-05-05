import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCrateRewardToWalletKind1700000000004 implements MigrationInterface {
  name = 'AddCrateRewardToWalletKind1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallet_transactions
        MODIFY COLUMN kind
          ENUM('deposit','withdraw','bet_place','bet_win','bet_refund','adjustment','reward','crate_reward')
          NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallet_transactions
        MODIFY COLUMN kind
          ENUM('deposit','withdraw','bet_place','bet_win','bet_refund','adjustment','reward')
          NOT NULL;
    `);
  }
}
