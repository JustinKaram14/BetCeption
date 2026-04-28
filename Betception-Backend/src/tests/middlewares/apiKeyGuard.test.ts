import { apiKeyGuard } from '../../middlewares/apiKeyGuard.js';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test-utils.js';

describe('apiKeyGuard middleware', () => {
  it('calls next when the expected key is present in the header', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      header: ((name: string) => (name === 'x-api-key' ? 'secret-key' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('accepts the api key from the query string when the header is missing', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      query: { api_key: 'secret-key' } as any,
      header: (() => undefined) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('supports a custom header name', () => {
    const guard = apiKeyGuard('secret-key', { headerName: 'x-docs-key' });
    const req = createMockRequest({
      header: ((name: string) => (name === 'x-docs-key' ? 'secret-key' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no api key is provided', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      header: (() => undefined) as any,
      query: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('returns 401 when the provided key is invalid', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      header: ((name: string) => (name === 'x-api-key' ? 'wrong-key' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('rejects a key shorter than the expected key without throwing', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      header: ((name: string) => (name === 'x-api-key' ? 'secret' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('rejects a key longer than the expected key without throwing', () => {
    const guard = apiKeyGuard('secret-key');
    const req = createMockRequest({
      header: ((name: string) => (name === 'x-api-key' ? 'secret-key-extra' : undefined)) as any,
    });
    const res = createMockResponse();
    const next = createMockNext();

    guard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });
});
