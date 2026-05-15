import request from 'supertest';
import { app } from '../../app.js';
import { signAccess } from '../../utils/jwt.js';
import { User } from '../../entity/User.js';
import { createMockRepository, mockAppDataSourceRepositories } from '../test-utils.js';

describe('app integration', () => {
  it('responds to /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns structured 404 for unknown routes', async () => {
    const response = await request(app).get('/__missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Route GET /__missing-route not found',
    });
  });

  it('rejects GET /users/me/profile without login', async () => {
    const response = await request(app).get('/users/me/profile');

    expect(response.status).toBe(401);
  });

  it('rejects PATCH /users/me/profile without login', async () => {
    const response = await request(app)
      .patch('/users/me/profile')
      .send({ username: 'player' });

    expect(response.status).toBe(401);
  });

  it('rejects PATCH /users/me/password without login', async () => {
    const response = await request(app)
      .patch('/users/me/password')
      .send({
        currentPassword: 'current-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      });

    expect(response.status).toBe(401);
  });

  it('rejects GET /wallet/transactions/summary without login', async () => {
    const response = await request(app).get('/wallet/transactions/summary');

    expect(response.status).toBe(401);
  });

  it('validates invalid profile email before updating', async () => {
    const token = await signAccess({ sub: '1', email: 'player@example.com', username: 'player' });

    const response = await request(app)
      .patch('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  it('updates profile avatar fields through the authenticated profile route', async () => {
    const user = {
      id: '1',
      username: 'player',
      email: 'player@example.com',
      balance: '99.50',
      xp: 25,
      level: 2,
      avatarIcon: 'chip',
      avatarColor: 'cyan',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      passwordHash: 'hidden',
    } as User;
    const userRepo = createMockRepository<User>({
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    });
    mockAppDataSourceRepositories(new Map([[User, userRepo]]));
    const token = await signAccess({ sub: '1', email: 'player@example.com', username: 'player' });

    const response = await request(app)
      .patch('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarIcon: 'star', avatarColor: 'gold' });

    expect(response.status).toBe(200);
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      avatarIcon: 'star',
      avatarColor: 'gold',
    }));
    expect(response.body.user).toEqual(expect.objectContaining({
      id: '1',
      avatarIcon: 'star',
      avatarColor: 'gold',
      balance: 99.5,
      levelProgress: expect.objectContaining({ level: 2, xp: 25 }),
    }));
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects unsupported profile avatar values before updating', async () => {
    const token = await signAccess({ sub: '1', email: 'player@example.com', username: 'player' });

    const response = await request(app)
      .patch('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarIcon: 'dragon', avatarColor: 'gold' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  it('validates non-matching password confirmation before updating', async () => {
    const token = await signAccess({ sub: '1', email: 'player@example.com', username: 'player' });

    const response = await request(app)
      .patch('/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'current-password',
        newPassword: 'new-password',
        confirmPassword: 'other-password',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});
