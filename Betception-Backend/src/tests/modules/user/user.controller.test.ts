import {
  changeOwnPassword,
  deleteOwnAccount,
  getCurrentUser,
  getOwnProfile,
  getUserById,
  updateOwnProfile,
} from '../../../modules/user/user.controller.js';
import { User } from '../../../entity/User.js';
import { Session } from '../../../entity/Session.js';
import { createMockRequest, createMockResponse, createMockRepository, mockAppDataSourceRepositories, mockAppDataSourceTransaction } from '../../test-utils.js';
import * as passwordUtils from '../../../utils/passwords.js';

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
    it('returns a public user profile without sensitive fields', async () => {
      const user = {
        id: '1',
        username: 'player',
        email: 'player@example.com',
        passwordHash: 'hash',
        balance: '120.00',
        xp: 40,
        level: 2,
        avatarIcon: 'crown',
        avatarColor: 'gold',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        params: { id: '1' },
      });
      const res = createMockResponse();

      await getUserById(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: '1',
          username: 'player',
          balance: 120,
          avatarIcon: 'crown',
          avatarColor: 'gold',
          levelProgress: expect.objectContaining({
            level: 2,
            xp: 40,
          }),
        }),
      });
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty('email');
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
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

  describe('getOwnProfile', () => {
    it('returns the authenticated user profile without passwordHash', async () => {
      const user = {
        id: '1',
        username: 'player',
        email: 'player@example.com',
        balance: '99.50',
        xp: 25,
        level: 2,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        passwordHash: 'hash',
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await getOwnProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: '1',
          username: 'player',
          email: 'player@example.com',
          balance: 99.5,
          xp: 25,
          level: 2,
          createdAt: new Date('2025-01-01T00:00:00Z'),
        }),
      });
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateOwnProfile', () => {
    it('updates username and email and returns a safe profile', async () => {
      const user = {
        id: '1',
        username: 'oldname',
        email: 'old@example.com',
        balance: '50.00',
        xp: 0,
        level: 1,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest
          .fn()
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { username: 'newname', email: 'new@example.com' } as any,
      });
      const res = createMockResponse();

      await updateOwnProfile(req as any, res);

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        username: 'newname',
        email: 'new@example.com',
      }));
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
    });

    it('prevents duplicate email', async () => {
      const user = {
        id: '1',
        username: 'player',
        email: 'player@example.com',
        balance: '0.00',
        xp: 0,
        level: 1,
        createdAt: new Date(),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValueOnce(user).mockResolvedValueOnce({ id: '2' }),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { email: 'taken@example.com' } as any,
      });
      const res = createMockResponse();

      await updateOwnProfile(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile update could not be completed' });
    });

    it('prevents duplicate username', async () => {
      const user = {
        id: '1',
        username: 'player',
        email: 'player@example.com',
        balance: '0.00',
        xp: 0,
        level: 1,
        createdAt: new Date(),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValueOnce(user).mockResolvedValueOnce({ id: '2' }),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { username: 'taken' } as any,
      });
      const res = createMockResponse();

      await updateOwnProfile(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile update could not be completed' });
    });
  });

  describe('changeOwnPassword', () => {
    it('rejects an incorrect current password', async () => {
      const user = { id: '1', passwordHash: 'existing-hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: {
          currentPassword: 'wrong-password',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        } as any,
      });
      const res = createMockResponse();

      await changeOwnPassword(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    });

    it('stores a hash and never stores the cleartext password', async () => {
      const user = { id: '1', passwordHash: 'existing-hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('new-hash');

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: {
          currentPassword: 'current-password',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        } as any,
      });
      const res = createMockResponse();

      await changeOwnPassword(req as any, res);

      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('current-password', 'existing-hash');
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('new-password');
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new-hash' }));
      expect(userRepo.save).not.toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new-password' }));
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('deleteOwnAccount', () => {
    it('rejects an incorrect password', async () => {
      const user = { id: '1', passwordHash: 'existing-hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { password: 'wrong-password', confirm: true } as any,
      });
      const res = createMockResponse();

      await deleteOwnAccount(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password is incorrect',
        code: 'INVALID_PASSWORD',
      });
    });

    it('anonymizes the current user, marks it deleted, removes sessions, and returns no sensitive data', async () => {
      const user = { id: '1', passwordHash: 'existing-hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const transactionalUserRepo = createMockRepository<User>();
      const sessionRepo = createMockRepository<Session>();
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      const transactionRepos = new Map<any, any>([
        [User, transactionalUserRepo],
        [Session, sessionRepo],
      ]);
      mockAppDataSourceTransaction(transactionRepos);
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true);

      const req = createMockRequest({
        user: { sub: '1' } as any,
        body: { password: 'current-password', confirm: true } as any,
      });
      const res = createMockResponse();

      await deleteOwnAccount(req as any, res);

      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('current-password', 'existing-hash');
      expect(sessionRepo.delete).toHaveBeenCalledWith({ user: { id: '1' } });
      expect(transactionalUserRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        username: 'deleted-user-1',
        email: 'deleted-user-1@deleted.betception.local',
        deletedAt: expect.any(Date),
        activePowerupUsesRemaining: 0,
      }));
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('passwordHash');
    });
  });
});
