import { z } from 'zod';
import { CardRank, CardSuit } from '../../entity/enums.js';
import { BetceptionSideBetCodeSchema } from '../round/round.schema.js';

const presetMoneySchema = z
  .number()
  .positive()
  .max(100_000)
  .refine((value) => Number.isFinite(value), { message: 'Invalid number' })
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Amount must have at most two decimal places',
  });

const percentSchema = z
  .number()
  .positive()
  .max(200)
  .refine((value) => Number.isFinite(value), { message: 'Invalid percent' })
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Percent must have at most two decimal places',
  });

export const BetceptionPresetStakeModeSchema = z.enum(['fixed', 'percentage']);

export const BetceptionPresetItemSchema = z.object({
  typeCode: BetceptionSideBetCodeSchema,
  amount: presetMoneySchema.optional(),
  percent: percentSchema.optional(),
  predictedSuit: z.nativeEnum(CardSuit).optional(),
  predictedRank: z.nativeEnum(CardRank).optional(),
  selection: z.record(z.unknown()).optional(),
});

const MAX_PRESET_ITEMS = 64;
const PERCENT_TOTAL_CAP = 200;
const PERCENT_CATEGORY_CAPS: Record<string, number> = {
  CARD: 100,
  DEALER_BUST: 60,
  PILL_TRIGGER: 50,
  PLAYER_BLACKJACK: 50,
  SPLIT_COUNT: 50,
};

export const UpsertBetceptionPresetSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(48).default('Preset'),
    stakeMode: BetceptionPresetStakeModeSchema,
    items: z.array(BetceptionPresetItemSchema).max(MAX_PRESET_ITEMS).default([]),
    activate: z.boolean().optional(),
  })
  .superRefine((preset, ctx) => {
    let totalPercent = 0;
    const categoryPercent = new Map<string, number>();

    for (const [index, item] of preset.items.entries()) {
      if (preset.stakeMode === 'fixed' && item.amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'amount'],
          message: 'Amount is required for fixed presets',
        });
      }

      if (preset.stakeMode === 'percentage' && item.percent === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'percent'],
          message: 'Percent is required for percentage presets',
        });
      }

      validateSelection(item, index, ctx);

      if (preset.stakeMode === 'percentage' && item.percent !== undefined) {
        totalPercent += item.percent;
        const category = categoryForPresetItem(item.typeCode);
        categoryPercent.set(category, (categoryPercent.get(category) ?? 0) + item.percent);
      }
    }

    if (totalPercent > PERCENT_TOTAL_CAP) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Preset percent total exceeds side bet cap',
      });
    }

    for (const [category, percent] of categoryPercent.entries()) {
      const cap = PERCENT_CATEGORY_CAPS[category];
      if (cap !== undefined && percent > cap) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: `${category} percent exceeds category cap`,
        });
      }
    }
  });

function validateSelection(
  item: z.infer<typeof BetceptionPresetItemSchema>,
  index: number,
  ctx: z.RefinementCtx,
) {
  if (item.typeCode === 'CARD_EXACT') {
    if (!item.predictedSuit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items', index, 'predictedSuit'],
        message: 'predictedSuit is required for CARD_EXACT',
      });
    }
    if (!item.predictedRank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items', index, 'predictedRank'],
        message: 'predictedRank is required for CARD_EXACT',
      });
    }
  }

  if (item.typeCode === 'CARD_SUIT' && !item.predictedSuit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['items', index, 'predictedSuit'],
      message: 'predictedSuit is required for CARD_SUIT',
    });
  }

  if (item.typeCode === 'SPLIT_COUNT') {
    const splitCount = Number(item.selection?.['splitCount']);
    if (![1, 2, 3].includes(splitCount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items', index, 'selection', 'splitCount'],
        message: 'splitCount must be 1, 2, or 3',
      });
    }
  }
}

function categoryForPresetItem(typeCode: string) {
  if (typeCode === 'CARD_EXACT' || typeCode === 'CARD_SUIT') return 'CARD';
  return typeCode;
}

export type UpsertBetceptionPresetInput = z.infer<typeof UpsertBetceptionPresetSchema>;
