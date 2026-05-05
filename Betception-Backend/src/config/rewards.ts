export interface DayReward {
  day: number;
  kind: 'coins' | 'powerup';
  coins?: number;
  powerupCode?: string;
  powerupLabel?: string;
  isMilestone: boolean;
  label: string;
  icon: string;
}

export const DAILY_STREAK_REWARDS: DayReward[] = [
  { day: 1,  kind: 'coins',   coins: 150,   isMilestone: false, label: '150 Coins',         icon: '🪙' },
  { day: 2,  kind: 'coins',   coins: 200,   isMilestone: false, label: '200 Coins',         icon: '🪙' },
  { day: 3,  kind: 'powerup', powerupCode: 'XP_BOOST',       powerupLabel: 'XP-Pille',          isMilestone: false, label: '× XP-Pille',        icon: '✨' },
  { day: 4,  kind: 'coins',   coins: 300,   isMilestone: false, label: '300 Coins',         icon: '🪙' },
  { day: 5,  kind: 'powerup', powerupCode: 'COIN_RUSH',      powerupLabel: 'Coin-Rush',         isMilestone: false, label: '× Coin-Rush',       icon: '💸' },
  { day: 6,  kind: 'coins',   coins: 400,   isMilestone: false, label: '400 Coins',         icon: '🪙' },
  { day: 7,  kind: 'powerup', powerupCode: 'BET_BOOST_30',   powerupLabel: 'Bet Boost 30%',     isMilestone: true,  label: '× Bet Boost 30%',   icon: '⚡' },
  { day: 8,  kind: 'coins',   coins: 500,   isMilestone: false, label: '500 Coins',         icon: '🪙' },
  { day: 9,  kind: 'powerup', powerupCode: 'PEEK_CARD',      powerupLabel: 'Blick-Pille',       isMilestone: false, label: '× Blick-Pille',     icon: '👁️' },
  { day: 10, kind: 'coins',   coins: 700,   isMilestone: false, label: '700 Coins',         icon: '🪙' },
  { day: 11, kind: 'powerup', powerupCode: 'UNDO_HIT',       powerupLabel: 'Rückgängig-Pille',  isMilestone: false, label: '× Rückgängig-Pille', icon: '↩️' },
  { day: 12, kind: 'coins',   coins: 900,   isMilestone: false, label: '900 Coins',         icon: '🪙' },
  { day: 13, kind: 'coins',   coins: 1000,  isMilestone: false, label: '1 000 Coins',       icon: '🪙' },
  { day: 14, kind: 'powerup', powerupCode: 'BET_BOOST_100',  powerupLabel: 'Bet Boost 100%',    isMilestone: true,  label: '× Bet Boost 100%',  icon: '🔥' },
  { day: 15, kind: 'coins',   coins: 1100,  isMilestone: false, label: '1 100 Coins',       icon: '🪙' },
  { day: 16, kind: 'powerup', powerupCode: 'CARD_SWAP',      powerupLabel: 'Tausch-Pille',      isMilestone: false, label: '× Tausch-Pille',    icon: '🔄' },
  { day: 17, kind: 'coins',   coins: 1300,  isMilestone: false, label: '1 300 Coins',       icon: '🪙' },
  { day: 18, kind: 'powerup', powerupCode: 'XP_BOOST',       powerupLabel: 'XP-Pille',          isMilestone: false, label: '× XP-Pille',        icon: '✨' },
  { day: 19, kind: 'coins',   coins: 1500,  isMilestone: false, label: '1 500 Coins',       icon: '🪙' },
  { day: 20, kind: 'coins',   coins: 1600,  isMilestone: false, label: '1 600 Coins',       icon: '🪙' },
  { day: 21, kind: 'powerup', powerupCode: 'DAILY_BOOST',    powerupLabel: 'Daily Boost',       isMilestone: true,  label: '× Daily Boost',     icon: '💊' },
  { day: 22, kind: 'coins',   coins: 1800,  isMilestone: false, label: '1 800 Coins',       icon: '🪙' },
  { day: 23, kind: 'powerup', powerupCode: 'INSURANCE_FREE', powerupLabel: 'Versicherungs-Pille', isMilestone: false, label: '× Versicherungs-Pille', icon: '🛡️' },
  { day: 24, kind: 'coins',   coins: 2200,  isMilestone: false, label: '2 200 Coins',       icon: '🪙' },
  { day: 25, kind: 'powerup', powerupCode: 'SIDEBET_MEGA',   powerupLabel: 'Mega-Sidebet',      isMilestone: false, label: '× Mega-Sidebet',    icon: '🎰' },
  { day: 26, kind: 'coins',   coins: 2600,  isMilestone: false, label: '2 600 Coins',       icon: '🪙' },
  { day: 27, kind: 'coins',   coins: 2800,  isMilestone: false, label: '2 800 Coins',       icon: '🪙' },
  { day: 28, kind: 'powerup', powerupCode: 'BET_BOOST_100',  powerupLabel: 'Bet Boost 100%',    isMilestone: true,  label: '× Bet Boost 100%',  icon: '🔥' },
  { day: 29, kind: 'coins',   coins: 5000,  isMilestone: false, label: '5 000 Coins',       icon: '💰' },
  { day: 30, kind: 'coins',   coins: 10000, isMilestone: true,  label: '10 000 Coins!',     icon: '👑' },
];

