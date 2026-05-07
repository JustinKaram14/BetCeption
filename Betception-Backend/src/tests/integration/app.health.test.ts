import request from 'supertest';
import { app } from '../../app.js';
import { signAccess } from '../../utils/jwt.js';

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
