import { register, login, refresh, logout } from '../../../modules/auth/auth.controller.js';
import { User } from '../../../entity/User.js';
import { Session } from '../../../entity/Session.js';
import {
  createMockRepository,
  mockAppDataSourceRepositories,
  createMockRequest,
  createMockResponse,
} from '../../test-utils.js';
import * as passwordUtils from '../../../utils/passwords.js';
import * as jwtUtils from '../../../utils/jwt.js';
import { hashToken } from '../../../utils/tokenHash.js';
import { env } from '../../../config/env.js';

describe('auth.controller', () => {
  describe('register', () => {
    it('creates a new user when email and username are available', async () => {
      const userRepo = createMockRepository<User>({
        exist: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(false),
        create: jest.fn().mockImplementation((data) => ({ id: '1', ...data })),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('hashed');

      const req = createMockRequest({
        body: { email: 'user@example.com', password: 'secret123', username: 'player' },
      });
      const res = createMockResponse();

      await register(req as any, res);

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('secret123');
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@example.com',
        username: 'player',
        balance: env.users.initialBalance.toFixed(2),
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Registered' });
    });

    it('rejects duplicate emails', async () => {
      const userRepo = createMockRepository<User>({
        exist: jest.fn().mockResolvedValue(true),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      const req = createMockRequest({
        body: { email: 'user@example.com', password: 'secret123', username: 'player' },
      });
      const res = createMockResponse();

      await register(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    });
  });

  describe('login', () => {
    it('verifies credentials, updates login timestamp, and returns tokens', async () => {
      const user = { id: '1', email: 'user@example.com', username: 'player', passwordHash: 'hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sessionRepo = createMockRepository<Session>();
      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      repoMap.set(Session, sessionRepo);
      mockAppDataSourceRepositories(repoMap);

      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(jwtUtils, 'signAccess').mockResolvedValue('access-token');
      jest.spyOn(jwtUtils, 'signRefresh').mockResolvedValue('refresh-token');

      const req = createMockRequest({
        body: { email: 'user@example.com', password: 'secret123' },
        headers: { 'user-agent': 'jest' },
      });
      const res = createMockResponse();

      await login(req as any, res);

      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('secret123', 'hash');
      expect(userRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({ lastLoginAt: expect.any(Date) }));
      expect(sessionRepo.save).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'access-token' });
    });

    it('rejects unknown users', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      const sessionRepo = createMockRepository<Session>();
      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      repoMap.set(Session, sessionRepo);
      mockAppDataSourceRepositories(repoMap);

      const req = createMockRequest({
        body: { email: 'missing@example.com', password: 'secret123' },
      });
      const res = createMockResponse();

      await login(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('refresh', () => {
    it('issues new tokens when session exists and is valid', async () => {
      const token = 'refresh-token';
      const hashed = hashToken(token);
      const user = { id: '1', email: 'user@example.com', username: 'player' } as User;
      const session = {
        id: '10',
        user,
        expiresAt: new Date(Date.now() + 1000),
        refreshToken: hashed,
        userAgent: null,
        ip: null,
      } as unknown as Session;

      const sessionRepo = createMockRepository<Session>({
        findOne: jest.fn().mockResolvedValue(session),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const repoMap = new Map<any, any>();
      repoMap.set(Session, sessionRepo);
      repoMap.set(User, userRepo);
      mockAppDataSourceRepositories(repoMap);

      jest.spyOn(jwtUtils, 'verifyRefresh').mockResolvedValue({ sub: '1' } as any);
      jest.spyOn(jwtUtils, 'signAccess').mockResolvedValue('access-token');
      jest.spyOn(jwtUtils, 'signRefresh').mockResolvedValue('new-refresh-token');

      const req = createMockRequest({
        cookies: { refresh_token: token },
        headers: { 'user-agent': 'jest' },
        ip: '127.0.0.1',
      });
      const res = createMockResponse();

      await refresh(req as any, res);

      expect(sessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        refreshToken: hashToken('new-refresh-token'),
      }));
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'access-token' });
    });

    it('rejects missing refresh tokens', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await refresh(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing refresh token' });
    });
  });

  describe('logout', () => {
    it('deletes session when refresh token cookie exists', async () => {
      const sessionRepo = createMockRepository<Session>();
      mockAppDataSourceRepositories(new Map([[Session, sessionRepo]]));

      const req = createMockRequest({
        cookies: { refresh_token: 'refresh-token' },
      });
      const res = createMockResponse();

      await logout(req as any, res);

      expect(sessionRepo.delete).toHaveBeenCalledWith({ refreshToken: hashToken('refresh-token') });
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/auth/refresh' });
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
