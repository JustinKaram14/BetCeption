import { FormatCoinsPipe } from './format-coins-pipe';

describe('FormatCoinsPipe', () => {
  let pipe: FormatCoinsPipe;

  beforeEach(() => {
    pipe = new FormatCoinsPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('transform returns null for any input (stub implementation)', () => {
    expect(pipe.transform(1000)).toBeNull();
    expect(pipe.transform(0)).toBeNull();
    expect(pipe.transform(null)).toBeNull();
  });
});
