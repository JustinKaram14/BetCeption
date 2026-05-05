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

const pillReward = (day: number, isMilestone = false): DayReward => ({
  day,
  kind: 'powerup',
  powerupLabel: 'Rote/Blaue Pille',
  isMilestone,
  label: 'Rote/Blaue Pille',
  icon: 'PILL',
});

export const DAILY_STREAK_REWARDS: DayReward[] = [
  { day: 1, kind: 'coins', coins: 150, isMilestone: false, label: '150 Coins', icon: 'COIN' },
  { day: 2, kind: 'coins', coins: 200, isMilestone: false, label: '200 Coins', icon: 'COIN' },
  pillReward(3),
  { day: 4, kind: 'coins', coins: 300, isMilestone: false, label: '300 Coins', icon: 'COIN' },
  pillReward(5),
  { day: 6, kind: 'coins', coins: 400, isMilestone: false, label: '400 Coins', icon: 'COIN' },
  pillReward(7, true),
  { day: 8, kind: 'coins', coins: 500, isMilestone: false, label: '500 Coins', icon: 'COIN' },
  pillReward(9),
  { day: 10, kind: 'coins', coins: 700, isMilestone: false, label: '700 Coins', icon: 'COIN' },
  pillReward(11),
  { day: 12, kind: 'coins', coins: 900, isMilestone: false, label: '900 Coins', icon: 'COIN' },
  { day: 13, kind: 'coins', coins: 1000, isMilestone: false, label: '1 000 Coins', icon: 'COIN' },
  pillReward(14, true),
  { day: 15, kind: 'coins', coins: 1100, isMilestone: false, label: '1 100 Coins', icon: 'COIN' },
  pillReward(16),
  { day: 17, kind: 'coins', coins: 1300, isMilestone: false, label: '1 300 Coins', icon: 'COIN' },
  pillReward(18),
  { day: 19, kind: 'coins', coins: 1500, isMilestone: false, label: '1 500 Coins', icon: 'COIN' },
  { day: 20, kind: 'coins', coins: 1600, isMilestone: false, label: '1 600 Coins', icon: 'COIN' },
  pillReward(21, true),
  { day: 22, kind: 'coins', coins: 1800, isMilestone: false, label: '1 800 Coins', icon: 'COIN' },
  pillReward(23),
  { day: 24, kind: 'coins', coins: 2200, isMilestone: false, label: '2 200 Coins', icon: 'COIN' },
  pillReward(25),
  { day: 26, kind: 'coins', coins: 2600, isMilestone: false, label: '2 600 Coins', icon: 'COIN' },
  { day: 27, kind: 'coins', coins: 2800, isMilestone: false, label: '2 800 Coins', icon: 'COIN' },
  pillReward(28, true),
  { day: 29, kind: 'coins', coins: 5000, isMilestone: false, label: '5 000 Coins', icon: 'COIN' },
  { day: 30, kind: 'coins', coins: 10000, isMilestone: true, label: '10 000 Coins!', icon: 'COIN' },
];
