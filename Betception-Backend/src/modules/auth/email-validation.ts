import * as dns from 'node:dns/promises';

type MxRecord = {
  exchange: string;
  priority: number;
};

export type EmailValidationCode =
  | 'EMAIL_DISPOSABLE'
  | 'EMAIL_DOMAIN_INVALID'
  | 'EMAIL_DOMAIN_UNAVAILABLE';

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; code: EmailValidationCode; message: string };

type MxResolver = (domain: string) => Promise<MxRecord[]>;

const defaultMxResolver: MxResolver = (domain) => dns.resolveMx(domain);
let mxResolver: MxResolver = defaultMxResolver;

const mxCache = new Map<string, boolean>();

const disposableEmailDomains = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'anonaddy.com',
  'burnermail.io',
  'dispostable.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'moakt.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]);

const reservedEmailDomains = new Set([
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'test',
]);

export async function validateRegistrableEmail(email: string): Promise<EmailValidationResult> {
  const domain = extractEmailDomain(email);

  if (!domain || !isValidDomainName(domain) || reservedEmailDomains.has(domain)) {
    return invalidDomainResult();
  }

  if (isDisposableEmailDomain(domain)) {
    return {
      valid: false,
      code: 'EMAIL_DISPOSABLE',
      message: 'Disposable email addresses are not allowed.',
    };
  }

  try {
    const hasMx = await hasMailExchange(domain);
    if (!hasMx) {
      return invalidDomainResult();
    }
  } catch {
    return {
      valid: false,
      code: 'EMAIL_DOMAIN_UNAVAILABLE',
      message: 'Email domain could not be verified. Please try again.',
    };
  }

  return { valid: true };
}

export function isDisposableEmailDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  return [...disposableEmailDomains].some(
    (blockedDomain) => normalized === blockedDomain || normalized.endsWith(`.${blockedDomain}`),
  );
}

export function clearEmailValidationCache() {
  mxCache.clear();
}

export function setEmailMxResolverForTests(resolver: MxResolver | null) {
  mxResolver = resolver ?? defaultMxResolver;
  clearEmailValidationCache();
}

function extractEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) return null;
  return normalizeDomain(normalized.slice(atIndex + 1));
}

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/\.$/, '');
}

function isValidDomainName(domain: string) {
  if (domain.length < 4 || domain.length > 253 || !domain.includes('.') || domain.includes('..')) {
    return false;
  }

  const labels = domain.split('.');
  const tld = labels.at(-1);
  if (!tld || !/^[a-z]{2,63}$/.test(tld)) {
    return false;
  }

  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
  );
}

async function hasMailExchange(domain: string) {
  const cached = mxCache.get(domain);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const records = await mxResolver(domain);
    const hasMx = records.some((record) => record.exchange.length > 0 && record.exchange !== '.');
    mxCache.set(domain, hasMx);
    return hasMx;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ENOTIMP') {
      mxCache.set(domain, false);
      return false;
    }
    throw error;
  }
}

function invalidDomainResult(): EmailValidationResult {
  return {
    valid: false,
    code: 'EMAIL_DOMAIN_INVALID',
    message: 'This email domain cannot receive email.',
  };
}
