const POWERS_OF_TEN: Record<number, bigint> = {};

const getScaleFactor = (scale: number): bigint => {
  if (!POWERS_OF_TEN[scale]) {
    POWERS_OF_TEN[scale] = BigInt(10) ** BigInt(scale);
  }
  return POWERS_OF_TEN[scale];
};

const toScaledInteger = (value: string | number, scale: number): bigint => {
  if (scale === 0) return BigInt(typeof value === 'number' ? Math.trunc(value) : value.trim() || '0');

  if (typeof value === 'number') {
    return toScaledInteger(value.toFixed(scale), scale);
  }

  const trimmed = value.trim();
  if (!trimmed) return 0n;

  const sign = trimmed.startsWith('-') ? -1n : 1n;
  const unsigned = sign === -1n ? trimmed.slice(1) : trimmed;
  const [intPartRaw, fracRaw = ''] = unsigned.split('.');
  const intPart = intPartRaw === '' ? '0' : intPartRaw;
  const fracPart = (fracRaw + '0'.repeat(scale)).slice(0, scale);
  const scaleFactor = getScaleFactor(scale);
  const scaled =
    BigInt(intPart) * scaleFactor + BigInt(fracPart === '' ? '0' : fracPart);
  return sign * scaled;
};

const fromScaledInteger = (value: bigint, scale: number): string => {
  if (scale === 0) return value.toString();
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  const scaleFactor = getScaleFactor(scale);
  const integer = abs / scaleFactor;
  const fractional = (abs % scaleFactor).toString().padStart(scale, '0');
  return `${sign}${integer.toString()}.${fractional}`;
};

const divideAndRound = (value: bigint, divisor: bigint): bigint => {
  if (divisor === 0n) {
    throw new Error('Cannot divide by zero when rounding decimal value.');
  }
  const quotient = value / divisor;
  const remainder = value % divisor;
  if (remainder === 0n) return quotient;

  const shouldRoundUp = (remainder < 0n ? -remainder : remainder) * 2n >= (divisor < 0n ? -divisor : divisor);
  if (!shouldRoundUp) return quotient;
  return value >= 0n ? quotient + 1n : quotient - 1n;
};

export function decimalToCents(value: string | number): bigint {
  return toScaledInteger(value, 2);
}

export function centsToDecimal(cents: bigint): string {
  return fromScaledInteger(cents, 2);
}

export function centsToNumber(cents: bigint): number {
  const sign = cents < 0n ? -1 : 1;
  const abs = cents < 0n ? -cents : cents;
  return sign * Number(abs) / 100;
}

export function multiplyMoney(amount: string, multiplier: number | string, multiplierScale = 3): string {
  const amountScaled = decimalToCents(amount);
  const multiplierScaled = toScaledInteger(
    typeof multiplier === 'number' ? multiplier.toFixed(multiplierScale) : multiplier,
    multiplierScale,
  );
  const scaleFactor = getScaleFactor(multiplierScale);
  const resultScaled = divideAndRound(amountScaled * multiplierScaled, scaleFactor);
  return centsToDecimal(resultScaled);
}

