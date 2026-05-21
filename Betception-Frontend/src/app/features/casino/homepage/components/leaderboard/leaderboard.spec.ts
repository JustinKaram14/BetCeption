import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

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
    localStorage.removeItem('betception-language');

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
    expect(apiMock.getBalanceLeaderboard).toHaveBeenCalledWith({ limit: 100 });

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
    expect(component.rows).toEqual([{ rank: 1, userId: 'u1', username: 'neo', metrics: { balance: 1500 } }]);
  });

  it('renders the leaderboard player search field', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 0,
        limit: 100,
        offset: 0,
        currentUserRank: null,
        items: [],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('#leaderboard-player-search');
    expect(searchInput).toBeTruthy();
    expect(searchInput.placeholder).toBe('Spieler suchen...');
  });

  it('filters players by username without changing their original ranks', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 3,
        limit: 100,
        offset: 0,
        currentUserRank: 5,
        items: [
          { rank: 1, userId: 'u1', username: 'Sebastian', balance: 2000 },
          { rank: 2, userId: 'u2', username: 'neo', balance: 1500 },
          { rank: 5, userId: 'u3', username: 'seb1', balance: 900 },
        ],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('#leaderboard-player-search');
    searchInput.value = ' seb ';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredRows.map((row) => row.username)).toEqual(['Sebastian', 'seb1']);
    expect(component.filteredRows.map((row) => row.rank)).toEqual([1, 5]);
    expect(fixture.nativeElement.textContent).toContain('#5');
  });

  it('filters case-insensitively and shows all players again after clearing the search', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 2,
        limit: 100,
        offset: 0,
        currentUserRank: 2,
        items: [
          { rank: 1, userId: 'u1', username: 'Trinity', balance: 1800 },
          { rank: 2, userId: 'u2', username: 'neo', balance: 1500 },
        ],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.updateSearch('TRIN');
    expect(component.filteredRows.map((row) => row.username)).toEqual(['Trinity']);

    component.updateSearch('');
    expect(component.filteredRows.map((row) => row.username)).toEqual(['Trinity', 'neo']);
  });

  it('shows an empty state when no players match the search', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 1,
        limit: 100,
        offset: 0,
        currentUserRank: null,
        items: [{ rank: 1, userId: 'u1', username: 'neo', balance: 1500 }],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.updateSearch('seb');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.leaderboard-empty-state').textContent).toContain('Keine Spieler gefunden');
    expect(fixture.nativeElement.querySelector('.leaderboard-table')).toBeNull();
  });

  it('emits the selected user id on row click', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      new Subject<any>().asObservable(),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    component.canViewProfiles = true;
    const emitSpy = spyOn(component.userProfileRequested, 'emit');

    component.openPublicProfile({ rank: 1, userId: 'u2', username: 'trinity', metrics: { balance: 900 } });

    expect(emitSpy).toHaveBeenCalledWith('u2');
  });

  it('switches to the level leaderboard and updates the active category', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(new Subject<any>().asObservable());
    apiMock.getLevelLeaderboard.and.returnValue(new Subject<any>().asObservable());

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;

    component.selectCategory('level');

    expect(component.activeCategory.id).toBe('level');
    expect(apiMock.getLevelLeaderboard).toHaveBeenCalledWith({ limit: 100 });
  });

  it('keeps the search term when switching tabs and applies it to the new leaderboard', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 1,
        limit: 100,
        offset: 0,
        currentUserRank: null,
        items: [{ rank: 1, userId: 'u1', username: 'Sebastian', balance: 2000 }],
      }),
    );
    apiMock.getLevelLeaderboard.and.returnValue(
      of({
        total: 2,
        limit: 100,
        offset: 0,
        currentUserRank: null,
        items: [
          { rank: 1, userId: 'u2', username: 'trinity', level: 7, xp: 1200 },
          { rank: 4, userId: 'u3', username: 'seb1', level: 4, xp: 700 },
        ],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;

    component.updateSearch('seb');
    component.selectCategory('level');

    expect(component.activeCategory.id).toBe('level');
    expect(component.searchTerm).toBe('seb');
    expect(component.filteredRows.map((row) => row.username)).toEqual(['seb1']);
    expect(component.filteredRows[0].rank).toBe(4);
  });

  it('emits the selected user id when a filtered row is clicked', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(
      of({
        total: 2,
        limit: 100,
        offset: 0,
        currentUserRank: null,
        items: [
          { rank: 1, userId: 'u1', username: 'neo', balance: 1500 },
          { rank: 2, userId: 'u2', username: 'trinity', balance: 900 },
        ],
      }),
    );

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    component.canViewProfiles = true;
    const emitSpy = spyOn(component.userProfileRequested, 'emit');

    component.updateSearch('trin');
    fixture.detectChanges();

    const filteredRow: HTMLTableRowElement = fixture.nativeElement.querySelector('.leaderboard-player-row');
    filteredRow.dispatchEvent(new MouseEvent('click'));

    expect(emitSpy).toHaveBeenCalledWith('u2');
  });

  it('does not emit a user profile when canViewProfiles is false', () => {
    apiMock.getBalanceLeaderboard.and.returnValue(new Subject<any>().asObservable());

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    const emitSpy = spyOn(component.userProfileRequested, 'emit');

    component.openPublicProfile({ rank: 1, userId: 'u1', username: 'neo', metrics: {} });

    expect(emitSpy).not.toHaveBeenCalled();
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
