import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPowerupTypes1700000000007 implements MigrationInterface {
  name = 'SeedPowerupTypes1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO powerup_types (code, title, description, min_level, price, effect_json) VALUES
        ('MULTI_PLUS',     'Multiplikator-Pille',   'Erhöht Sidebet-Multiplikatoren um +20%',                                          3, 500,
         JSON_OBJECT('multiplier_bonus', 0.2)),
        ('JOKER_CARD',     'Joker-Pille',            'Einmaliger Schutz: Bust wird zu Push',                                            5, 1000,
         JSON_OBJECT('joker', 1)),
        ('NO_LOSS',        'Schutz-Pille',           '10% Chance, Einsatz zurückzubekommen, wenn verloren',                            7, 1500,
         JSON_OBJECT('no_loss_chance', 0.1)),
        ('BET_BOOST_30',   'Wett-Boost +30%',        'Erhöht deinen Gewinn um +30% bei einem Sieg',                                    4, 750,
         JSON_OBJECT('main_multiplier', 0.3)),
        ('BET_BOOST_100',  'Wett-Dobler',            'Verdoppelt deinen Gewinn bei einem Sieg',                                        9, 2000,
         JSON_OBJECT('main_multiplier', 1.0)),
        ('PEEK_CARD',      'Blick-Pille',            'Zeigt die nächste Deck-Karte vor deinem Zug an',                                 2, 300,
         JSON_OBJECT('peek', 1)),
        ('CARD_SWAP',      'Tausch-Pille',           'Tausche eine Handkarte gegen eine neue aus dem Deck',                            4, 800,
         JSON_OBJECT('card_swap', 1)),
        ('UNDO_HIT',       'Rückgängig-Pille',       'Nimm die zuletzt gezogene Karte zurück',                                        3, 600,
         JSON_OBJECT('undo_hit', 1)),
        ('XP_BOOST',       'XP-Pille',               'Verdoppelt dein XP für die nächsten 10 Minuten',                                 1, 800,
         JSON_OBJECT('xp_multiplier', 2, 'timed', TRUE, 'duration_minutes', 10)),
        ('DAILY_BOOST',    'Daily-Dobler',           'Verdoppelt deinen nächsten Daily Reward',                                        1, 150,
         JSON_OBJECT('daily_multiplier', 2)),
        ('COIN_RUSH',      'Coin-Rush',              '+25% Coin-Gewinn bei einem Sieg in dieser Runde',                                2, 400,
         JSON_OBJECT('coin_rush', 0.25)),
        ('INSURANCE_FREE', 'Versicherungs-Pille',    'Kostenlose Versicherung: Dealer-Blackjack gibt deinen Einsatz zurück',           5, 900,
         JSON_OBJECT('insurance', 1)),
        ('SIDEBET_MEGA',   'Mega-Sidebet',           'Erhöht alle Sidebet-Multiplikatoren um +50%',                                   6, 1200,
         JSON_OBJECT('sidebet_multiplier_bonus', 0.5))
      ON DUPLICATE KEY UPDATE
        title        = VALUES(title),
        description  = VALUES(description),
        min_level    = VALUES(min_level),
        price        = VALUES(price),
        effect_json  = VALUES(effect_json);
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Seeding migrations are intentionally not reversed
  }
}
