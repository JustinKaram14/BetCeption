import { PurchasePowerupSchema } from '../../modules/shop/shop.schema.js';
import {
  WalletAdjustmentSchema,
  WalletTransactionsDateRangeQuerySchema,
  WalletTransactionsQuerySchema,
} from '../../modules/wallet/wallet.schema.js';

describe('request schemas', () => {
  it('accepts one-at-a-time power pill purchases and rejects bulk purchases', () => {
    expect(PurchasePowerupSchema.parse({ typeId: '3' })).toEqual({ typeId: 3, quantity: 1 });
    expect(PurchasePowerupSchema.safeParse({ typeId: '3', quantity: 2 }).success).toBe(false);
  });

  it('coerces wallet transaction query pagination and date ranges', () => {
    const parsed = WalletTransactionsQuerySchema.parse({
      page: '2',
      limit: '10',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.from).toBeInstanceOf(Date);
    expect(parsed.to).toBeInstanceOf(Date);
  });

  it('rejects wallet transaction ranges where from is after to', () => {
    expect(
      WalletTransactionsDateRangeQuerySchema.safeParse({
        from: '2026-02-01T00:00:00.000Z',
        to: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('validates wallet adjustment amounts and trims optional references', () => {
    expect(WalletAdjustmentSchema.parse({ amount: '25.50', reference: ' topup ' })).toEqual({
      amount: 25.5,
      reference: 'topup',
    });
    expect(WalletAdjustmentSchema.safeParse({ amount: '25.555' }).success).toBe(false);
    expect(WalletAdjustmentSchema.safeParse({ amount: '1000000.01' }).success).toBe(false);
  });
});
