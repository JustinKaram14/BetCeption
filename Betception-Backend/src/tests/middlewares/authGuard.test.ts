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
    jest.mocked(verifyAccess).mockRejectedValue(new Error('bad token'));

    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
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
