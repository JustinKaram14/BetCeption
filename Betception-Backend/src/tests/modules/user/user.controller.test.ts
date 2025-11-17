import { getCurrentUser, getUserById } from '../../../modules/user/user.controller.js';
import { User } from '../../../entity/User.js';
import { createMockRequest, createMockResponse, createMockRepository, mockAppDataSourceRepositories } from '../../test-utils.js';

describe('user.controller', () => {
  describe('getCurrentUser', () => {
    it('returns the authenticated user payload', () => {
      const req = createMockRequest({
        user: { sub: '1', email: 'user@example.com', username: 'player' } as any,
      });
      const res = createMockResponse();

      getCurrentUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: req.user });
    });

    it('rejects unauthenticated requests', () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthenticated' });
    });
  });

  describe('getUserById', () => {
    it('returns a user when found', async () => {
      const user = { id: '1', username: 'player' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        params: { id: '1' },
      });
      const res = createMockResponse();

      await getUserById(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it('returns 404 when the user is missing', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        params: { id: '42' },
      });
      const res = createMockResponse();

      await getUserById(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
});
