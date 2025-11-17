import request from 'supertest';
import { app } from '../../app.js';

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
});
