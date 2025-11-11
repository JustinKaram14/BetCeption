import express from 'express';
import request from 'supertest';
import { notFoundHandler } from './notFoundHandler';

describe('notFoundHandler middleware', () => {
  const buildApp = () => {
    const app = express();
    app.get('/known', (_req, res) => res.sendStatus(200));
    app.use(notFoundHandler);
    return app;
  };

  it('responds with 404 and descriptive message for unknown routes', async () => {
    const response = await request(buildApp()).get('/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Route GET /unknown not found',
    });
  });

  it('does not interfere with existing routes', async () => {
    const response = await request(buildApp()).get('/known');

    expect(response.status).toBe(200);
  });
});
