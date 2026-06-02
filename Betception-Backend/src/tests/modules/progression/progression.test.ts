import { HandStatus, MainBetStatus } from '../../../entity/enums.js';
import { calculateRoundXp } from '../../../modules/progression/progression.js';

describe('progression', () => {
  it('keeps normal round XP readable while rewarding profitable wins', () => {
    expect(calculateRoundXp({
      mainBetStatus: MainBetStatus.WON,
      playerHandStatus: HandStatus.STOOD,
      wonSideBets: 0,
      totalStake: '100.00',
      totalPayout: '200.00',
    })).toBe(125);
  });

  it('rewards rare split, dealer-bust and sidebet moments more strongly', () => {
    expect(calculateRoundXp({
      mainBetStatus: MainBetStatus.WON,
      playerHandStatus: HandStatus.STOOD,
      wonSideBets: 2,
      splitHandCount: 3,
      wonSplitHands: 3,
      dealerBust: true,
      totalStake: '400.00',
      totalPayout: '1200.00',
    })).toBe(565);
  });

  it('adds event XP when a power pill triggers', () => {
    expect(calculateRoundXp({
      mainBetStatus: MainBetStatus.REFUNDED,
      playerHandStatus: HandStatus.STOOD,
      wonSideBets: 0,
      triggeredPowerup: true,
      totalStake: '100.00',
      totalPayout: '100.00',
    })).toBe(75);
  });
});
