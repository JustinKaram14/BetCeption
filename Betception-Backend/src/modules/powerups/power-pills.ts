import crypto from 'crypto';
import { In } from 'typeorm';
import { PowerupType } from '../../entity/PowerupType.js';
import { User } from '../../entity/User.js';

export const POWER_PILL_CODES = ['RED_PILL', 'BLUE_PILL'] as const;
export type PowerPillCode = (typeof POWER_PILL_CODES)[number];
export type PowerPillColor = 'red' | 'blue';

export const POWER_PILL_USES = 3;
export const RED_PILL_TRIGGER_DENOMINATOR = 5;
export const BLUE_PILL_TRIGGER_DENOMINATOR = 8;

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

export function serializePowerupType(type: PowerupType) {
  return {
    id: type.id,
    code: type.code,
    title: type.title,
    description: type.description,
    minLevel: type.minLevel,
    price: Number(type.price),
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
