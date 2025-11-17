console.log('Executing health.test.ts');
import request from 'supertest';
import { app } from './app';
describe('GET /health', () => {
    it('should return 200 OK', async () => {
        console.log('Running health test');
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });
});
