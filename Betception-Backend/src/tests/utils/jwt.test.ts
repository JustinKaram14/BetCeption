import * as jose from 'jose';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../../utils/jwt.js';

const subject = { sub: 'user-1', email: 'player@example.com', username: 'player' };

describe('jwt utils', () => {
  it('creates access tokens that verify to the same payload', async () => {
    const token = await signAccess(subject);
    await expect(verifyAccess(token)).resolves.toMatchObject(subject);
  });

  it('creates refresh tokens that verify to the same payload', async () => {
    const token = await signRefresh(subject);
    await expect(verifyRefresh(token)).resolves.toMatchObject(subject);
  });

  it('rejects tokens missing auth claims', async () => {
    const invalid = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET));

    await expect(verifyAccess(invalid)).rejects.toThrow('Invalid auth payload');
  });
});
