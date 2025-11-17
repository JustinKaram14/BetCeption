import { ZodError, z } from 'zod';
import { errorHandler } from '../../middlewares/errorHandler.js';
import { createMockRequest, createMockResponse, createMockNext } from '../test-utils.js';

describe('errorHandler middleware', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns 400 when encountering a ZodError', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
    const error = result.error;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: (error as ZodError).flatten() });
  });

  it('falls back to status/message on generic errors', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    const err = Object.assign(new Error('Boom'), { status: 418 });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ message: 'Boom' });
  });
});
