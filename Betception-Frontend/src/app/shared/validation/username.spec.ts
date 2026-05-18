import { isValidUsername, normalizeUsername } from './username';

describe('username validation', () => {
  it('accepts simple names with letters, numbers, underscore and hyphen', () => {
    expect(isValidUsername('player_01')).toBeTrue();
    expect(isValidUsername('Äon-7')).toBeTrue();
  });

  it('rejects glitch usernames with combining marks', () => {
    expect(isValidUsername('T̵e̷s̶')).toBeFalse();
  });

  it('normalizes leading and trailing whitespace before validation', () => {
    expect(normalizeUsername('  trinity  ')).toBe('trinity');
    expect(isValidUsername('  trinity  ')).toBeTrue();
  });
});
