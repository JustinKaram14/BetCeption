import { logger } from '../../utils/logger.js';

describe('logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  describe('info()', () => {
    it('writes a JSON line to console.log', () => {
      logger.info('test.event', { userId: 'u-1' });
      const [arg] = (console.log as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(arg);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test.event');
      expect(parsed.userId).toBe('u-1');
    });

    it('works without a payload', () => {
      logger.info('no.payload');
      const [arg] = (console.log as jest.Mock).mock.calls[0];
      expect(JSON.parse(arg).message).toBe('no.payload');
    });
  });

  describe('warn()', () => {
    it('writes a JSON line to console.warn', () => {
      logger.warn('warn.event', { code: 42 });
      const [arg] = (console.warn as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(arg);
      expect(parsed.level).toBe('warn');
      expect(parsed.code).toBe(42);
    });
  });

  describe('error()', () => {
    it('writes a JSON line to console.error', () => {
      logger.error('error.event', { reason: 'boom' });
      const [arg] = (console.error as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(arg);
      expect(parsed.level).toBe('error');
      expect(parsed.reason).toBe('boom');
    });

    it('serializes Error objects inside the payload', () => {
      const err = new Error('something went wrong');
      logger.error('unhandled', { err });
      const [arg] = (console.error as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(arg);
      expect(parsed.err.message).toBe('something went wrong');
      expect(parsed.err.name).toBe('Error');
      expect(typeof parsed.err.stack).toBe('string');
    });
  });

  describe('debug()', () => {
    it('writes to console.debug in non-production environments', () => {
      const original = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'test';
      logger.debug('debug.event', { x: 1 });
      const [arg] = (console.debug as jest.Mock).mock.calls[0];
      expect(JSON.parse(arg).level).toBe('debug');
      process.env['NODE_ENV'] = original;
    });

    it('suppresses output when NODE_ENV is "production"', () => {
      const original = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      logger.debug('should.be.suppressed');
      expect(console.debug).not.toHaveBeenCalled();
      process.env['NODE_ENV'] = original;
    });
  });
});
