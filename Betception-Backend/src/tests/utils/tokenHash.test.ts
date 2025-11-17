import { hashToken } from '../../utils/tokenHash.js';

describe('hashToken', () => {
  it('produces deterministic sha256 hashes', () => {
    const token = 'sample-token';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('distinguishes different tokens', () => {
    const a = hashToken('token-a');
    const b = hashToken('token-b');
    expect(a).not.toEqual(b);
    expect(a).toHaveLength(64);
  });
});
