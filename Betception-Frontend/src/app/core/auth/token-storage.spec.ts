import { TestBed } from '@angular/core/testing';

import { TokenStorage } from './token-storage';

/** Creates a minimal base64url-encoded fake JWT with the given payload. */
function makeJwt(payload: object): string {
  const b64url = (str: string) =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `eyJhbGciOiJIUzI1NiJ9.${b64url(JSON.stringify(payload))}.fakesig`;
}

describe('TokenStorage', () => {
  let service: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with a null token', () => {
    expect(service.token).toBeNull();
  });

  describe('setToken', () => {
    it('stores a valid token', () => {
      service.setToken('abc');
      expect(service.token).toBe('abc');
    });

    it('trims surrounding whitespace', () => {
      service.setToken('  trimmed  ');
      expect(service.token).toBe('trimmed');
    });

    it('sets token to null when given null', () => {
      service.setToken('abc');
      service.setToken(null);
      expect(service.token).toBeNull();
    });

    it('sets token to null when given an empty/whitespace string', () => {
      service.setToken('abc');
      service.setToken('   ');
      expect(service.token).toBeNull();
    });
  });

  describe('clear', () => {
    it('resets the token to null', () => {
      service.setToken('something');
      service.clear();
      expect(service.token).toBeNull();
    });
  });

  describe('token$', () => {
    it('emits the current token and subsequent changes', () => {
      const emitted: (string | null)[] = [];
      service.token$.subscribe((t) => emitted.push(t));

      service.setToken('first');
      service.setToken('second');
      service.clear();

      expect(emitted).toEqual([null, 'first', 'second', null]);
    });
  });

  describe('getUser / decodeToken', () => {
    it('returns null when there is no token', () => {
      expect(service.getUser()).toBeNull();
    });

    it('decodes a valid JWT and returns the user payload', () => {
      const payload = { sub: 'u1', email: 'a@b.com', username: 'tester' };
      const jwt = makeJwt(payload);
      service.setToken(jwt);

      const user = service.getUser();
      expect(user?.sub).toBe('u1');
      expect(user?.email).toBe('a@b.com');
      expect(user?.username).toBe('tester');
    });

    it('decodeToken decodes an arbitrary JWT string without touching stored token', () => {
      const payload = { sub: 'u2', email: 'b@c.com', username: 'other' };
      const jwt = makeJwt(payload);

      const user = service.decodeToken(jwt);
      expect(user?.sub).toBe('u2');
      expect(service.token).toBeNull();
    });

    it('returns null for a malformed token string', () => {
      service.setToken('not.a.jwt');
      expect(service.getUser()).toBeNull();
    });

    it('returns null for a token with only one segment', () => {
      service.setToken('onepart');
      expect(service.getUser()).toBeNull();
    });
  });
});
