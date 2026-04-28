import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';

import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { LeaderboardComponent } from './leaderboard';

describe('LeaderboardComponent', () => {
  let component: LeaderboardComponent;
  let fixture: ComponentFixture<LeaderboardComponent>;

  const apiMock = jasmine.createSpyObj<BetceptionApi>(
    'BetceptionApi',
    ['getBalanceLeaderboard', 'getLevelLeaderboard', 'getWinningsLeaderboard'],
  );

  beforeEach(async () => {
    apiMock.getBalanceLeaderboard.calls.reset();
    apiMock.getLevelLeaderboard.calls.reset();
    apiMock.getWinningsLeaderboard.calls.reset();

    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent],
      providers: [{ provide: BetceptionApi, useValue: apiMock }],
    }).compileComponents();
  });

  it('loads the balance leaderboard on init and maps rows', () => {
    const balance$ = new Subject<any>();
    apiMock.getBalanceLeaderboard.and.returnValue(balance$.asObservable());

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;

    expect(component.loading).toBeTrue();
    expect(apiMock.getBalanceLeaderboard).toHaveBeenCalledWith({ limit: 10 });

    balance$.next({
      total: 1,
      limit: 10,
      offset: 0,
      currentUserRank: 4,
      items: [{ rank: 1, userId: 'u1', username: 'neo', balance: 1500 }],
    });
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.currentUserRank).toBe(4);
    expect(component.rows).toEqual([{ rank: 1, username: 'neo', metrics: { balance: 1500 } }]);
  });

  it('switches to the level leaderboard and updates the active category', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(new Subject<any>().asObservable());
    apiMock.getLevelLeaderboard.and.returnValue(new Subject<any>().asObservable());

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;

    component.selectCategory('level');

    expect(component.activeCategory.id).toBe('level');
    expect(apiMock.getLevelLeaderboard).toHaveBeenCalledWith({ limit: 10 });
  });

  it('does not refetch when the active category is selected again', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(new Subject<any>().asObservable());

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;

    expect(apiMock.getBalanceLeaderboard).toHaveBeenCalledTimes(1);

    component.selectCategory('balance');

    expect(apiMock.getBalanceLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('shows a fallback error message when the request fails without a payload message', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      throwError(() => new Error('network down')),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.rows).toEqual([]);
    expect(component.currentUserRank).toBeNull();
    expect(component.error).toBe('network down');
  });

  it('shows an API error payload message when the request fails', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      throwError(() => ({ error: { message: 'Leaderboard offline' } })),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('Leaderboard offline');
  });
});
