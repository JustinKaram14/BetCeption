import crypto from 'crypto';
import { In } from 'typeorm';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';
import { centsToNumber, decimalToCents } from '../../utils/money.js';

export const POWER_PILL_CODES = ['RED_PILL', 'BLUE_PILL'] as const;
export type PowerPillCode = (typeof POWER_PILL_CODES)[number];
export type PowerPillColor = 'red' | 'blue';

export const POWER_PILL_USES = 3;
export const RED_PILL_TRIGGER_DENOMINATOR = 5;
export const BLUE_PILL_TRIGGER_DENOMINATOR = 8;
export const POWER_PILL_BANKROLL_PRICE_PERCENT = 5n;
export const POWER_PILL_LEVEL_PRICE_STEP_CENTS = 2500n;
export const POWER_PILL_PRICE_ROUNDING_CENTS = 2500n;

export const POWER_PILL_META: Record<
  PowerPillCode,
  { title: string; description: string; color: PowerPillColor }
> = {
  RED_PILL: {
    title: 'Red Pill',
    description: '1:5 chance to trigger x3 payout on main wins.',
    color: 'red',
  },
  BLUE_PILL: {
    title: 'Blue Pill',
    description: '1:8 chance to trigger safe-round protection (no loss).',
    color: 'blue',
  },
};

export const POWER_PILL_WHERE = {
  code: In([...POWER_PILL_CODES]),
};

export function isPowerPillCode(code: string | null | undefined): code is PowerPillCode {
  return POWER_PILL_CODES.includes(code as PowerPillCode);
}

export function getPowerPillColor(code: PowerPillCode): PowerPillColor {
  return POWER_PILL_META[code].color;
}

export function pickRandomPowerPillCode(): PowerPillCode {
  return POWER_PILL_CODES[crypto.randomInt(POWER_PILL_CODES.length)];
}

export function shouldTriggerPowerPill(denominator: number): boolean {
  return crypto.randomInt(denominator) === 0;
}

const roundUpToCents = (value: bigint, step: bigint): bigint => {
  if (step <= 0n) return value;
  const remainder = value % step;
  return remainder === 0n ? value : value + (step - remainder);
};

export function calculatePowerPillPriceCents(type: PowerupType, user: Pick<User, 'balance' | 'level'>): bigint {
  const basePriceCents = decimalToCents(type.price);
  const balanceCents = decimalToCents(user.balance);
  const bankrollPriceCents = (balanceCents * POWER_PILL_BANKROLL_PRICE_PERCENT) / 100n;
  const levelPriceCents =
    basePriceCents + BigInt(Math.max(0, user.level - 1)) * POWER_PILL_LEVEL_PRICE_STEP_CENTS;
  const rawPriceCents = [basePriceCents, bankrollPriceCents, levelPriceCents]
    .reduce((highest, current) => current > highest ? current : highest, 0n);
  return roundUpToCents(rawPriceCents, POWER_PILL_PRICE_ROUNDING_CENTS);
}

export function serializePowerupType(type: PowerupType, priceOverrideCents?: bigint) {
  return {
    id: type.id,
    code: type.code,
    title: type.title,
    description: type.description,
    minLevel: type.minLevel,
    price: priceOverrideCents === undefined ? Number(type.price) : centsToNumber(priceOverrideCents),
    effect: type.effectJson,
  };
}

export function serializeActivePowerup(user: User) {
  const type = user.activePowerupType;
  if (!type || !isPowerPillCode(type.code) || user.activePowerupUsesRemaining <= 0) {
    return null;
  }

  return {
    type: serializePowerupType(type),
    usesRemaining: user.activePowerupUsesRemaining,
  };
}
