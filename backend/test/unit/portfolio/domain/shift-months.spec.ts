import { shiftMonths } from '@src/portfolio/domain/shift-months.js';

describe('shiftMonths', () => {
  it('moves by months and years, clamping to the end of the month', () => {
    expect(shiftMonths('2026-05-15', -1)).toBe('2026-04-15');
    expect(shiftMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(shiftMonths('2024-03-31', -1)).toBe('2024-02-29');
    expect(shiftMonths('2026-01-10', -12)).toBe('2025-01-10');
  });
});
