const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{3,32}$/u;

export function normalizeUsername(value: string): string {
  return value.trim().normalize('NFC');
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}
