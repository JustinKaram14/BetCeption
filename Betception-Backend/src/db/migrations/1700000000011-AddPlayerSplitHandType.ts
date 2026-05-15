import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerSplitHandType1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`hands\` MODIFY COLUMN \`owner_type\` ENUM('dealer','player','player_split') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`hands\` MODIFY COLUMN \`owner_type\` ENUM('dealer','player') NOT NULL`,
    );
  }
}
