import {
  clearEmailValidationCache,
  isDisposableEmailDomain,
  setEmailMxResolverForTests,
  validateRegistrableEmail,
} from '../../../modules/auth/email-validation.js';

describe('email validation', () => {
  afterEach(() => {
    setEmailMxResolverForTests(null);
    clearEmailValidationCache();
  });

  it('rejects malformed or reserved domains without an MX lookup', async () => {
    const resolver = jest.fn();
    setEmailMxResolverForTests(resolver);

    await expect(validateRegistrableEmail('user@example.com')).resolves.toEqual({
      valid: false,
      code: 'EMAIL_DOMAIN_INVALID',
      message: 'This email domain cannot receive email.',
    });
    await expect(validateRegistrableEmail('user@foo')).resolves.toEqual({
      valid: false,
      code: 'EMAIL_DOMAIN_INVALID',
      message: 'This email domain cannot receive email.',
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('rejects disposable email domains without an MX lookup', async () => {
    const resolver = jest.fn();
    setEmailMxResolverForTests(resolver);

    expect(isDisposableEmailDomain('Mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('inbox.mailinator.com')).toBe(true);
    await expect(validateRegistrableEmail('user@mailinator.com')).resolves.toEqual({
      valid: false,
      code: 'EMAIL_DISPOSABLE',
      message: 'Disposable email addresses are not allowed.',
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('accepts domains with usable MX records', async () => {
    const resolver = jest.fn().mockResolvedValue([{ exchange: 'mx.valid-domain.test', priority: 10 }]);
    setEmailMxResolverForTests(resolver);

    await expect(validateRegistrableEmail('User@Valid-Domain.test')).resolves.toEqual({ valid: true });
    expect(resolver).toHaveBeenCalledWith('valid-domain.test');
  });

  it('rejects domains without MX records', async () => {
    const error = Object.assign(new Error('queryMx ENOTFOUND'), { code: 'ENOTFOUND' });
    const resolver = jest.fn().mockRejectedValue(error);
    setEmailMxResolverForTests(resolver);

    await expect(validateRegistrableEmail('user@missing-domain.test')).resolves.toEqual({
      valid: false,
      code: 'EMAIL_DOMAIN_INVALID',
      message: 'This email domain cannot receive email.',
    });
  });

  it('returns a retryable error when DNS verification is temporarily unavailable', async () => {
    const error = Object.assign(new Error('timeout'), { code: 'ETIMEOUT' });
    const resolver = jest.fn().mockRejectedValue(error);
    setEmailMxResolverForTests(resolver);

    await expect(validateRegistrableEmail('user@valid-domain.test')).resolves.toEqual({
      valid: false,
      code: 'EMAIL_DOMAIN_UNAVAILABLE',
      message: 'Email domain could not be verified. Please try again.',
    });
  });
});
