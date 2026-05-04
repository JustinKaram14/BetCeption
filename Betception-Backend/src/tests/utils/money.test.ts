import { decimalToCents, centsToDecimal, centsToNumber, multiplyMoney } from '../../utils/money.js';

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

  describe('multiplyMoney', () => {
    it('multiplies an amount by an exact integer multiplier', () => {
      expect(multiplyMoney('10.00', 2)).toBe('20.00');
      expect(multiplyMoney('5.00', '3')).toBe('15.00');
    });

    it('rounds the result up when remainder * 2 >= scaleFactor', () => {
      // 0.01 * 1.5 = 0.015 → rounds up to 0.02
      expect(multiplyMoney('0.01', 1.5)).toBe('0.02');
    });

    it('rounds the result down when remainder * 2 < scaleFactor', () => {
      // 0.01 * 1.4 = 0.014 → rounds down to 0.01
      expect(multiplyMoney('0.01', 1.4)).toBe('0.01');
    });

    it('rounds negative results correctly (rounds away from zero)', () => {
      // -0.01 * 1.5 = -0.015 → rounds to -0.02
      expect(multiplyMoney('-0.01', 1.5)).toBe('-0.02');
    });

    it('handles a string multiplier with custom scale', () => {
      expect(multiplyMoney('100.00', '0.5', 1)).toBe('50.00');
    });

    it('returns zero for a zero amount', () => {
      expect(multiplyMoney('0.00', 5)).toBe('0.00');
    });
  });
});
