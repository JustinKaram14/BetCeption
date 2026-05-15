import { TestBed } from '@angular/core/testing';
import { CrateNotifications } from './crate-notifications';
import { UserCrateItem } from '../../api/api.types';

describe('CrateNotifications', () => {
  let service: CrateNotifications;

  const unopenedCrate: UserCrateItem = {
    id: 'crate-1',
    tier: 1,
    tierLabel: 'Common',
    acquiredLevel: 2,
    acquiredAt: '2026-01-01T00:00:00Z',
    opened: false,
    openedAt: null,
    reward: null,
  };

  const openedCrate: UserCrateItem = {
    ...unopenedCrate,
    id: 'crate-2',
    opened: true,
    openedAt: '2026-01-02T00:00:00Z',
  };

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrateNotifications);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('counts only unseen unopened crates per user', () => {
    expect(service.unseenUnopenedCount('u1', [unopenedCrate, openedCrate])).toBe(1);
    expect(service.unseenUnopenedCount('u2', [unopenedCrate, openedCrate])).toBe(1);
  });

  it('marks unopened crates as seen without opening or removing them', () => {
    const crates = [unopenedCrate, openedCrate];

    const remaining = service.markUnopenedAsSeen('u1', crates);

    expect(remaining).toBe(0);
    expect(service.unseenUnopenedCount('u1', crates)).toBe(0);
    expect(crates[0].opened).toBeFalse();
  });

  it('keeps seen state isolated by user id', () => {
    service.markUnopenedAsSeen('u1', [unopenedCrate]);

    expect(service.unseenUnopenedCount('u1', [unopenedCrate])).toBe(0);
    expect(service.unseenUnopenedCount('u2', [unopenedCrate])).toBe(1);
  });
});
