import { hashPassword, verifyPassword } from '../../utils/passwords.js';

describe('password utilities', () => {
  it('hashes and verifies passwords correctly', async () => {
    const hash = await hashPassword('super-secret');
    expect(hash).not.toEqual('super-secret');
    await expect(verifyPassword('super-secret', hash)).resolves.toBe(true);
  });

  it('fails verification for incorrect passwords', async () => {
    const hash = await hashPassword('another-secret');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
