import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { BetceptionApi } from './betception-api.service';

describe('BetceptionApi', () => {
  let service: BetceptionApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BetceptionApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calls GET /users/me for getCurrentUser()', () => {
    service.getCurrentUser().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/me'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'user-1' });
  });

  it('calls GET /wallet for getWalletSummary()', () => {
    service.getWalletSummary().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/wallet'));
    expect(req.request.method).toBe('GET');
    req.flush({ balance: '100.00' });
  });

  it('calls GET /round/active for getActiveRound()', () => {
    service.getActiveRound().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/active'));
    expect(req.request.method).toBe('GET');
    req.flush({ round: null });
  });

  it('calls POST /round/start for startRound()', () => {
    service.startRound({ betAmount: 10 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/start'));
    expect(req.request.method).toBe('POST');
    req.flush({ round: {} });
  });

  it('calls GET /users/:id for getUserById()', () => {
    service.getUserById('user-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/user-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ user: {} });
  });

  it('calls GET /users/me/profile for getOwnProfile()', () => {
    service.getOwnProfile().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/me/profile'));
    expect(req.request.method).toBe('GET');
    req.flush({ user: {} });
  });

  it('calls PATCH /users/me/profile for updateOwnProfile()', () => {
    service.updateOwnProfile({ username: 'neo', email: 'neo@example.com' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/me/profile'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ username: 'neo', email: 'neo@example.com' });
    req.flush({ user: {} });
  });

  it('calls PATCH /users/me/password for changeOwnPassword()', () => {
    const payload = {
      currentPassword: 'current-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    };
    service.changeOwnPassword(payload).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/me/password'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });

  it('calls DELETE /users/me for deleteOwnAccount()', () => {
    const payload = { password: 'current-password', confirm: true };
    service.deleteOwnAccount(payload).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/users/me'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });

  it('calls GET /wallet/transactions for getWalletTransactions()', () => {
    service.getWalletTransactions().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/wallet/transactions'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('passes query params for getWalletTransactions({ page, limit })', () => {
    service.getWalletTransactions({ page: 2, limit: 10 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/wallet/transactions'));
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [] });
  });

  it('passes date query params for getWalletTransactions()', () => {
    service
      .getWalletTransactions({
        page: 1,
        limit: 12,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      })
      .subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/wallet/transactions'));
    expect(req.request.params.get('from')).toBe('2026-01-01T00:00:00.000Z');
    expect(req.request.params.get('to')).toBe('2026-01-31T23:59:59.999Z');
    req.flush({ items: [] });
  });

  it('calls GET /wallet/transactions/summary for getWalletTransactionsSummary()', () => {
    service.getWalletTransactionsSummary().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/wallet/transactions/summary'));
    expect(req.request.method).toBe('GET');
    req.flush({ totalWins: 0, totalLossesOrBets: 0, netTotal: 0, transactionCount: 0 });
  });

  it('passes date query params for getWalletTransactionsSummary()', () => {
    service
      .getWalletTransactionsSummary({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      })
      .subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/wallet/transactions/summary'));
    expect(req.request.params.get('from')).toBe('2026-01-01T00:00:00.000Z');
    expect(req.request.params.get('to')).toBe('2026-01-31T23:59:59.999Z');
    req.flush({ totalWins: 0, totalLossesOrBets: 0, netTotal: 0, transactionCount: 0 });
  });

  it('calls POST /wallet/deposit for depositFunds()', () => {
    service.depositFunds({ amount: 50 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/wallet/deposit'));
    expect(req.request.method).toBe('POST');
    req.flush({ balance: 150 });
  });

  it('calls POST /wallet/withdraw for withdrawFunds()', () => {
    service.withdrawFunds({ amount: 20 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/wallet/withdraw'));
    expect(req.request.method).toBe('POST');
    req.flush({ balance: 80 });
  });

  it('calls POST /rewards/daily/claim for claimDailyReward()', () => {
    service.claimDailyReward().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/rewards/daily/claim'));
    expect(req.request.method).toBe('POST');
    req.flush({ claimedAmount: 100 });
  });

  it('calls GET /shop/powerups for listPowerups()', () => {
    service.listPowerups().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/shop/powerups'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('calls POST /shop/powerups/purchase for purchasePowerup()', () => {
    service.purchasePowerup({ typeId: 1, quantity: 1 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/shop/powerups/purchase'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('calls GET /inventory/powerups for listInventory()', () => {
    service.listInventory().subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/inventory/powerups'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('calls GET /leaderboard/balance for getBalanceLeaderboard()', () => {
    service.getBalanceLeaderboard().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/leaderboard/balance'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('calls GET /leaderboard/level for getLevelLeaderboard()', () => {
    service.getLevelLeaderboard().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/leaderboard/level'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('calls GET /leaderboard/winnings for getWinningsLeaderboard()', () => {
    service.getWinningsLeaderboard().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/leaderboard/winnings'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('calls POST /round/hit/:id for hitRound()', () => {
    service.hitRound('round-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/hit/round-1'));
    expect(req.request.method).toBe('POST');
    req.flush({ round: {} });
  });

  it('calls POST /round/stand/:id for standRound()', () => {
    service.standRound('round-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/stand/round-1'));
    expect(req.request.method).toBe('POST');
    req.flush({ round: {} });
  });

  it('calls GET /round/:id for getRound()', () => {
    service.getRound('round-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/round-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ round: {} });
  });

  it('calls POST /round/settle/:id for settleRound()', () => {
    service.settleRound('round-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/round/settle/round-1'));
    expect(req.request.method).toBe('POST');
    req.flush({ round: {} });
  });

  it('calls POST /powerups/consume for consumePowerup()', () => {
    service.consumePowerup({ typeId: 1, quantity: 1 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/powerups/consume'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('calls GET /fairness/rounds/:id for getFairnessRound()', () => {
    service.getFairnessRound('round-1').subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/fairness/rounds/round-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ round: {} });
  });

  it('calls GET /fairness/rounds/history for listFairnessHistory()', () => {
    service.listFairnessHistory().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/fairness/rounds/history'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('passes query params for listFairnessHistory({ page, limit })', () => {
    service.listFairnessHistory({ page: 1, limit: 5 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/fairness/rounds/history'));
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({ items: [] });
  });
});
