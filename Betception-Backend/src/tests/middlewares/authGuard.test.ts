import { authGuard } from '../../middlewares/authGuard.js';
import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { verifyAccess } from '../../utils/jwt.js';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from '../test-utils.js';

jest.mock('../../utils/jwt.js', () => ({
  verifyAccess: jest.fn(),
}));

describe('authGuard middleware', () => {
  beforeEach(() => {
    jest.mocked(verifyAccess).mockReset();
  });

  it('rejects requests without bearer token', async () => {
    const req = createMockRequest({
      header: ((name: string) => undefined) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    const req = createMockRequest({
      header: ((name: string) => (name === 'Authorization' ? 'Bearer invalid' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();
    jest.mocked(verifyAccess).mockRejectedValue(new Error('Invalid or expired token'));

    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('calls next immediately when req.user is already populated', async () => {
    const existing = { sub: 'user-1', email: 'u@test.com', username: 'u' };
    const req = createMockRequest({
      user: existing as any,
      header: (() => undefined) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(verifyAccess).not.toHaveBeenCalled();
  });

  it('allows guest access to leaderboard GET endpoints without a token', async () => {
    const req = createMockRequest({
      method: 'GET',
      baseUrl: '/leaderboard/balance',
      header: (() => undefined) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('attaches decoded payload and calls next on success', async () => {
    const payload = { sub: '1', email: 'user@example.com', username: 'user' };
    const req = createMockRequest({
      header: ((name: string) => (name === 'Authorization' ? 'Bearer valid' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();
    jest.mocked(verifyAccess).mockResolvedValue(payload as any);

    await authGuard(req, res, next);

    expect(req.user).toBe(payload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  describe('passwordChangedAt session invalidation', () => {
    const validPayload = { sub: '42', iat: 1_000_000, exp: 9_999_999 };

    function makeAuthedRequest() {
      return createMockRequest({
        header: ((name: string) =>
          name === 'Authorization' ? 'Bearer valid.token' : undefined) as any,
      });
    }

    beforeEach(() => {
      jest.mocked(verifyAccess).mockResolvedValue(validPayload as any);
      Object.defineProperty(AppDataSource, 'isInitialized', {
        value: true,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(AppDataSource, 'isInitialized', {
        value: false,
        configurable: true,
        writable: true,
      });
      jest.restoreAllMocks();
    });

    it('allows a valid token when the user has no passwordChangedAt set', async () => {
      jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: '42', passwordChangedAt: null }),
      } as any);

      const req = makeAuthedRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authGuard(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('allows a token issued after passwordChangedAt', async () => {
      // iat = 1_000_000 s → 1_000_000_000 ms; passwordChangedAt is 1 second earlier
      const passwordChangedAt = new Date((validPayload.iat - 1) * 1000);
      jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: '42', passwordChangedAt }),
      } as any);

      const req = makeAuthedRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authGuard(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects a token issued before passwordChangedAt with SESSION_INVALIDATED', async () => {
      // iat = 1_000_000 s → 1_000_000_000 ms; passwordChangedAt is 1 second later
      const passwordChangedAt = new Date((validPayload.iat + 1) * 1000);
      jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: '42', passwordChangedAt }),
      } as any);

      const req = makeAuthedRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SESSION_INVALIDATED' }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
