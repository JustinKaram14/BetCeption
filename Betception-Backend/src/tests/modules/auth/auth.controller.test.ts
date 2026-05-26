import { register, login, refresh, logout, requestPasswordChange, confirmPasswordChange, forgotPassword, resetPassword } from '../../../modules/auth/auth.controller.js';
import { RegisterSchema } from '../../../modules/auth/auth.schema.js';
import { User } from '../../../entity/User.js';
import { Session } from '../../../entity/Session.js';
import {
  createMockRepository,
  mockAppDataSourceRepositories,
  createMockRequest,
  createMockResponse,
} from '../../test-utils.js';
import * as mailer from '../../../utils/mailer.js';
import * as passwordUtils from '../../../utils/passwords.js';
import * as jwtUtils from '../../../utils/jwt.js';
import { hashToken } from '../../../utils/tokenHash.js';
import { env } from '../../../config/env.js';
import * as emailValidation from '../../../modules/auth/email-validation.js';

const invalidCredentialsResponse = { message: 'Invalid email or password' };
const registrationConflictResponse = { message: 'Registration could not be completed' };

describe('auth.controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      jest.spyOn(emailValidation, 'validateRegistrableEmail').mockResolvedValue({ valid: true });
    });

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

      expect(emailValidation.validateRegistrableEmail).toHaveBeenCalledWith('user@example.com');
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('secret123');
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@example.com',
        username: 'player',
        balance: env.users.initialBalance.toFixed(2),
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Registered' });
    });

    it('rejects disposable email domains before creating a user', async () => {
      jest.spyOn(emailValidation, 'validateRegistrableEmail').mockResolvedValueOnce({
        valid: false,
        code: 'EMAIL_DISPOSABLE',
        message: 'Disposable email addresses are not allowed.',
      });
      const req = createMockRequest({
        body: { email: 'user@mailinator.com', password: 'secret123', username: 'player' },
      });
      const res = createMockResponse();

      await register(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Disposable email addresses are not allowed.',
        code: 'EMAIL_DISPOSABLE',
      });
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
      expect(res.json).toHaveBeenCalledWith(registrationConflictResponse);
    });

    it('rejects duplicate usernames', async () => {
      const userRepo = createMockRepository<User>({
        exist: jest.fn()
          .mockResolvedValueOnce(false) // email check passes
          .mockResolvedValueOnce(true), // username check fails
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));
      const req = createMockRequest({
        body: { email: 'user@example.com', password: 'secret123', username: 'takenuser' },
      });
      const res = createMockResponse();

      await register(req as any, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(registrationConflictResponse);
    });

    it('uses the same public response for duplicate email and username conflicts', async () => {
      const repoMap = new Map<any, any>();
      const emailRepo = createMockRepository<User>({
        exist: jest.fn().mockResolvedValue(true),
      });
      repoMap.set(User, emailRepo);
      mockAppDataSourceRepositories(repoMap);

      const emailReq = createMockRequest({
        body: { email: 'user@example.com', password: 'secret123', username: 'player' },
      });
      const emailRes = createMockResponse();

      await register(emailReq as any, emailRes);

      const usernameRepo = createMockRepository<User>({
        exist: jest.fn()
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true),
      });
      repoMap.set(User, usernameRepo);

      const usernameReq = createMockRequest({
        body: { email: 'new@example.com', password: 'secret123', username: 'player' },
      });
      const usernameRes = createMockResponse();

      await register(usernameReq as any, usernameRes);

      expect(emailRes.status).toHaveBeenCalledWith(409);
      expect(usernameRes.status).toHaveBeenCalledWith(409);
      expect(emailRes.json).toHaveBeenCalledWith(registrationConflictResponse);
      expect(usernameRes.json).toHaveBeenCalledWith(registrationConflictResponse);
    });
  });

  describe('login', () => {
    it('verifies credentials, updates login timestamp, and returns tokens', async () => {
      const user = { id: '1', email: 'user@example.com', username: 'player', passwordHash: 'hash', emailVerified: true } as User;
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
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('refresh_token=refresh-token'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('HttpOnly'),
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
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const req = createMockRequest({
        body: { email: 'missing@example.com', password: 'secret123' },
      });
      const res = createMockResponse();

      await login(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(invalidCredentialsResponse);
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('secret123', expect.any(String));
    });

    it('rejects wrong passwords', async () => {
      const user = { id: '1', email: 'user@example.com', username: 'player', passwordHash: 'hash' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sessionRepo = createMockRepository<Session>();
      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      repoMap.set(Session, sessionRepo);
      mockAppDataSourceRepositories(repoMap);

      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const req = createMockRequest({
        body: { email: 'user@example.com', password: 'wrongpassword' },
      });
      const res = createMockResponse();

      await login(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(invalidCredentialsResponse);
    });

    it('uses the same public response for unknown users and wrong passwords', async () => {
      const repoMap = new Map<any, any>();
      const missingUserRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      const missingSessionRepo = createMockRepository<Session>();
      repoMap.set(User, missingUserRepo);
      repoMap.set(Session, missingSessionRepo);
      mockAppDataSourceRepositories(repoMap);
      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const missingReq = createMockRequest({
        body: { email: 'missing@example.com', password: 'secret123' },
      });
      const missingRes = createMockResponse();

      await login(missingReq as any, missingRes);

      const user = { id: '1', email: 'user@example.com', username: 'player', passwordHash: 'hash' } as User;
      const wrongPasswordRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const wrongPasswordSessionRepo = createMockRepository<Session>();
      repoMap.set(User, wrongPasswordRepo);
      repoMap.set(Session, wrongPasswordSessionRepo);

      const wrongPasswordReq = createMockRequest({
        body: { email: 'user@example.com', password: 'wrongpassword' },
      });
      const wrongPasswordRes = createMockResponse();

      await login(wrongPasswordReq as any, wrongPasswordRes);

      expect(missingRes.status).toHaveBeenCalledWith(401);
      expect(wrongPasswordRes.status).toHaveBeenCalledWith(401);
      expect(missingRes.json).toHaveBeenCalledWith(invalidCredentialsResponse);
      expect(wrongPasswordRes.json).toHaveBeenCalledWith(invalidCredentialsResponse);
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
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('refresh_token=new-refresh-token'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('HttpOnly'),
      );
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'access-token' });
    });

    it('keeps the previous refresh session briefly for concurrent browser refreshes', async () => {
      const token = 'refresh-token';
      const hashed = hashToken(token);
      const user = { id: '1', email: 'user@example.com', username: 'player' } as User;
      const session = {
        id: '10',
        user,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        refreshToken: hashed,
        userAgent: 'old-agent',
        ip: '127.0.0.1',
      } as unknown as Session;

      const sessionRepo = createMockRepository<Session>({
        findOne: jest.fn().mockResolvedValue(session),
        save: jest.fn().mockImplementation(async (value) => value),
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

      const before = Date.now();
      const req = createMockRequest({
        cookies: { refresh_token: token },
        headers: { 'user-agent': 'new-agent' },
        ip: '127.0.0.2',
      });
      const res = createMockResponse();

      await refresh(req as any, res);

      expect(sessionRepo.save).toHaveBeenCalledTimes(2);
      const [oldSession] = sessionRepo.save.mock.calls[0];
      const [newSession] = sessionRepo.save.mock.calls[1];
      expect(oldSession).toEqual(expect.objectContaining({
        refreshToken: hashed,
      }));
      expect((oldSession as Session).expiresAt.getTime()).toBeGreaterThanOrEqual(before);
      expect((oldSession as Session).expiresAt.getTime()).toBeLessThanOrEqual(before + 31_000);
      expect(newSession).toEqual(expect.objectContaining({
        refreshToken: hashToken('new-refresh-token'),
        userAgent: 'new-agent',
        ip: '127.0.0.2',
      }));
    });

    it('does not extend an already shortened previous refresh session', async () => {
      const token = 'refresh-token';
      const hashed = hashToken(token);
      const user = { id: '1', email: 'user@example.com', username: 'player' } as User;
      const existingGraceExpiresAt = new Date(Date.now() + 5_000);
      const session = {
        id: '10',
        user,
        expiresAt: existingGraceExpiresAt,
        refreshToken: hashed,
        userAgent: 'old-agent',
        ip: '127.0.0.1',
      } as unknown as Session;

      const sessionRepo = createMockRepository<Session>({
        findOne: jest.fn().mockResolvedValue(session),
        save: jest.fn().mockImplementation(async (value) => value),
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
        headers: { 'user-agent': 'new-agent' },
        ip: '127.0.0.2',
      });
      const res = createMockResponse();

      await refresh(req as any, res);

      const [oldSession] = sessionRepo.save.mock.calls[0];
      expect((oldSession as Session).expiresAt).toBe(existingGraceExpiresAt);
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
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('Max-Age=0'),
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('requestPasswordChange', () => {
    beforeEach(() => {
      jest.spyOn(mailer, 'sendPasswordChangeEmail').mockResolvedValue(undefined);
    });

    it('saves a hashed token and sends the password-change email', async () => {
      const user = { id: '1', email: 'user@example.com', username: 'player' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ user: { sub: '1' } as any });
      const res = createMockResponse();

      await requestPasswordChange(req as any, res);

      expect(userRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        passwordChangeToken: expect.any(String),
        passwordChangeTokenExpiresAt: expect.any(Date),
      }));
      expect(mailer.sendPasswordChangeEmail).toHaveBeenCalledWith('user@example.com', 'player', expect.any(String));
      expect(res.json).toHaveBeenCalledWith({ message: 'Password change email sent' });
    });

    it('returns 401 when the user from the token cannot be found', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ user: { sub: 'unknown' } as any });
      const res = createMockResponse();

      await requestPasswordChange(req as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mailer.sendPasswordChangeEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordChange', () => {
    beforeEach(() => {
      jest.spyOn(mailer, 'sendPasswordChangeEmail').mockResolvedValue(undefined);
    });

    it('changes the password, clears all sessions, and returns success', async () => {
      const user = {
        id: '1',
        passwordHash: 'oldhash',
        passwordChangeToken: 'sometoken',
        passwordChangeTokenExpiresAt: new Date(Date.now() + 60_000),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sessionRepo = {
        ...createMockRepository<Session>(),
        createQueryBuilder: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue(undefined),
        }),
      };
      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      repoMap.set(Session, sessionRepo);
      mockAppDataSourceRepositories(repoMap);

      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('newhash');

      const req = createMockRequest({
        body: { token: 'validtoken', oldPassword: 'oldpass', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await confirmPasswordChange(req as any, res);

      expect(userRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        passwordHash: 'newhash',
        passwordChangeToken: null,
        passwordChangedAt: expect.any(Date),
      }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });

    it('returns TOKEN_INVALID when the token does not match any user', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        body: { token: 'badtoken', oldPassword: 'old', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await confirmPasswordChange(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_INVALID' }));
    });

    it('returns TOKEN_EXPIRED when the token has passed its expiry', async () => {
      const user = {
        id: '1',
        passwordHash: 'hash',
        passwordChangeToken: 'token',
        passwordChangeTokenExpiresAt: new Date(Date.now() - 1000),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        body: { token: 'expiredtoken', oldPassword: 'old', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await confirmPasswordChange(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
    });

    it('returns INVALID_OLD_PASSWORD when the old password does not match', async () => {
      const user = {
        id: '1',
        passwordHash: 'hash',
        passwordChangeToken: 'token',
        passwordChangeTokenExpiresAt: new Date(Date.now() + 60_000),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false);

      const req = createMockRequest({
        body: { token: 'validtoken', oldPassword: 'wrongpass', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await confirmPasswordChange(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_OLD_PASSWORD' }));
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      jest.spyOn(mailer, 'sendPasswordResetEmail').mockResolvedValue(undefined);
    });

    it('always returns the generic response for an unknown email (anti-enumeration)', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ body: { email: 'ghost@example.com' } });
      const res = createMockResponse();

      await forgotPassword(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Falls ein Account existiert, wurde eine Mail gesendet' });
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('saves a reset token and sends the reset email for a known email', async () => {
      const user = { id: '2', email: 'user@example.com', username: 'player' } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({ body: { email: 'user@example.com' } });
      const res = createMockResponse();

      await forgotPassword(req as any, res);

      expect(userRepo.update).toHaveBeenCalledWith('2', expect.objectContaining({
        passwordResetToken: expect.any(String),
        passwordResetTokenExpiresAt: expect.any(Date),
      }));
      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', 'player', expect.any(String));
      expect(res.json).toHaveBeenCalledWith({ message: 'Falls ein Account existiert, wurde eine Mail gesendet' });
    });

    it('returns the generic response when no email body is provided', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await forgotPassword(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Falls ein Account existiert, wurde eine Mail gesendet' });
    });
  });

  describe('resetPassword', () => {
    it('resets the password, invalidates all sessions, and returns success', async () => {
      const user = {
        id: '3',
        passwordResetToken: 'resettoken',
        passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      const sessionRepo = {
        ...createMockRepository<Session>(),
        createQueryBuilder: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue(undefined),
        }),
      };
      const repoMap = new Map<any, any>();
      repoMap.set(User, userRepo);
      repoMap.set(Session, sessionRepo);
      mockAppDataSourceRepositories(repoMap);

      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('newhash');

      const req = createMockRequest({
        body: { token: 'validreset', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await resetPassword(req as any, res);

      expect(userRepo.update).toHaveBeenCalledWith('3', expect.objectContaining({
        passwordHash: 'newhash',
        passwordResetToken: null,
        passwordChangedAt: expect.any(Date),
      }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('returns TOKEN_INVALID when the token does not match any user', async () => {
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(null),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        body: { token: 'badtoken', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await resetPassword(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_INVALID' }));
    });

    it('returns TOKEN_EXPIRED when the reset token has passed its expiry', async () => {
      const user = {
        id: '3',
        passwordResetToken: 'expiredtoken',
        passwordResetTokenExpiresAt: new Date(Date.now() - 1000),
      } as User;
      const userRepo = createMockRepository<User>({
        findOne: jest.fn().mockResolvedValue(user),
      });
      mockAppDataSourceRepositories(new Map([[User, userRepo]]));

      const req = createMockRequest({
        body: { token: 'expiredtoken', newPassword: 'newpass1' },
      });
      const res = createMockResponse();

      await resetPassword(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
    });
  });
});

describe('auth schemas', () => {
  it('rejects passwords longer than 128 characters', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(129),
      username: 'player',
    });
    expect(result.success).toBe(false);
  });

  it('accepts passwords of exactly 128 characters', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(128),
      username: 'player',
    });
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      username: 'player',
    });
    expect(result.success).toBe(false);
  });

  it('rejects glitch usernames with combining marks', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
      username: 'T̵e̷s̶',
    });
    expect(result.success).toBe(false);
  });

  it('trims and normalizes accepted usernames', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
      username: '  player_1  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('player_1');
    }
  });
});
