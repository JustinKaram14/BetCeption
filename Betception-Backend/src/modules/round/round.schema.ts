import { z } from 'zod';
import {
  CardRank,
  CardSuit,
  SideBetColor,
  SideBetTargetContext,
} from '../../entity/enums.js';

const moneySchema = z
  .number()
  .positive()
  .max(100_000)
  .refine((value) => Number.isFinite(value), { message: 'Invalid number' })
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Amount must have at most two decimal places',
  });

export const BetceptionSideBetCodeSchema = z.enum([
  'CARD_EXACT',
  'WINNER',
  'PILL_TRIGGER',
  'PLAYER_BLACKJACK',
]);

const sideBetSelectionSchema = z.record(z.unknown()).optional();

export const StartRoundSchema = z.object({
  betAmount: moneySchema,
  sideBets: z
    .array(
      z
        .object({
          typeId: z.number().int().positive().optional(),
          typeCode: BetceptionSideBetCodeSchema.optional(),
          amount: moneySchema,
          predictedColor: z.nativeEnum(SideBetColor).optional(),
          predictedSuit: z.nativeEnum(CardSuit).optional(),
          predictedRank: z.nativeEnum(CardRank).optional(),
          targetContext: z.nativeEnum(SideBetTargetContext).optional(),
          selection: sideBetSelectionSchema,
        })
        .refine((value) => value.typeId || value.typeCode, {
          message: 'typeId or typeCode is required',
        }),
    )
    .max(24)
    .default([]),
});

export const RoundIdParamsSchema = z.object({
  roundId: z
    .string()
    .regex(/^\d+$/, { message: 'roundId must be a numeric identifier' }),
});

export const SwapCardBodySchema = z.object({
  cardId: z.string().regex(/^\d+$/, { message: 'cardId must be a numeric identifier' }),
});

export type StartRoundInput = z.infer<typeof StartRoundSchema>;
export type BetceptionSideBetCode = z.infer<typeof BetceptionSideBetCodeSchema>;
export type RoundIdParams = z.infer<typeof RoundIdParamsSchema>;
export type SwapCardBody = z.infer<typeof SwapCardBodySchema>;
