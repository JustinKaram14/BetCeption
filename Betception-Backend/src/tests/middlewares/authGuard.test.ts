import { authGuard } from '../../middlewares/authGuard.js';
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
});
