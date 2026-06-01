import {
  sendPasswordChangeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../utils/mailer.js';

describe('mailer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('logs verification emails in test/dev mode when no Resend client is configured', async () => {
    await sendVerificationEmail('player@example.com', 'Philipp', 'verify-token');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[DEV] Mail to player@example.com'),
    );
  });

  it('builds and logs password change emails', async () => {
    await sendPasswordChangeEmail('player@example.com', 'Philipp', 'change-token');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[DEV] Mail to player@example.com'),
    );
  });

  it('builds and logs password reset emails', async () => {
    await sendPasswordResetEmail('player@example.com', 'Philipp', 'reset-token');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[DEV] Mail to player@example.com'),
    );
  });
});
