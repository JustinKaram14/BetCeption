import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateRequest } from './validateRequest';
describe('validateRequest middleware', () => {
    const bodySchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
    });
    const paramsSchema = z.object({
        id: z.coerce.number().int().positive(),
    });
    const buildBodyApp = () => {
        const app = express();
        app.use(express.json());
        app.post('/test', validateRequest(bodySchema), (req, res) => {
            res.json(req.body);
        });
        return app;
    };
    const buildParamsApp = () => {
        const app = express();
        app.get('/users/:id', validateRequest(paramsSchema, 'params'), (req, res) => {
            res.json(req.params);
        });
        return app;
    };
    it('rejects invalid body payloads with a 400', async () => {
        const response = await request(buildBodyApp())
            .post('/test')
            .send({ email: 'bad-email', password: 'short' });
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });
    it('allows valid body payloads and exposes sanitized data downstream', async () => {
        const response = await request(buildBodyApp())
            .post('/test')
            .send({ email: 'user@example.com', password: 'supersecret' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            email: 'user@example.com',
            password: 'supersecret',
        });
    });
    it('validates params when requested and coerces values', async () => {
        const response = await request(buildParamsApp()).get('/users/42');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: 42 });
    });
    it('returns 400 when params validation fails', async () => {
        const response = await request(buildParamsApp()).get('/users/abc');
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });
});
