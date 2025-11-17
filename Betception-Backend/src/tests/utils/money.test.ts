import { decimalToCents, centsToDecimal, centsToNumber } from '../../utils/money.js';

describe('money utils', () => {
  describe('decimalToCents', () => {
    it('converts numeric values to bigint cents', () => {
      expect(decimalToCents(12.34)).toBe(1234n);
      expect(decimalToCents(0)).toBe(0n);
    });

    it('handles string inputs with varying precision', () => {
      expect(decimalToCents('99.9')).toBe(9990n);
      expect(decimalToCents('10')).toBe(1000n);
      expect(decimalToCents('-1.23')).toBe(-123n);
    });
  });

  describe('centsToDecimal', () => {
    it('formats bigint cents into decimal strings', () => {
      expect(centsToDecimal(1234n)).toBe('12.34');
      expect(centsToDecimal(-501n)).toBe('-5.01');
      expect(centsToDecimal(0n)).toBe('0.00');
    });
  });

  describe('centsToNumber', () => {
    it('converts bigint cents into floating point numbers', () => {
      expect(centsToNumber(1234n)).toBeCloseTo(12.34);
      expect(centsToNumber(-50n)).toBeCloseTo(-0.5);
    });
  });
});
