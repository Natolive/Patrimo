import { ASIAN_MARKETS, sessionStatus } from '@patrimo/shared';

const market = (key: string) => ASIAN_MARKETS.find((m) => m.key === key)!;
const status = (key: string, session: { start: string; end: string; lastSession: string }, now: string) => {
  const s = sessionStatus(market(key), { key, ...session }, new Date(now));
  return { state: s.state, nextChange: s.nextChange?.toISOString() ?? null, guess: s.guess?.toISOString() ?? null, lastSession: s.lastSession };
};

// Hong Kong : 9 h 30 – 16 h 10 (UTC+8), pause 12 h – 13 h ; séance du mardi 6 octobre 2026 = 01:30 → 08:10 UTC.
const hk = { start: '2026-10-06T01:30:00Z', end: '2026-10-06T08:10:00Z', lastSession: '2026-10-05' };

describe('sessionStatus', () => {
  it('waits for the next session Yahoo already knows', () => {
    expect(status('hongKong', hk, '2026-10-05T18:00:00Z')).toMatchObject({ state: 'closed', nextChange: '2026-10-06T01:30:00.000Z', guess: null });
  });

  it('is open until the lunch break, paused during it, then open until the close', () => {
    expect(status('hongKong', hk, '2026-10-06T02:00:00Z')).toMatchObject({ state: 'open', nextChange: '2026-10-06T04:00:00.000Z' });
    expect(status('hongKong', hk, '2026-10-06T04:30:00Z')).toMatchObject({ state: 'lunch', nextChange: '2026-10-06T05:00:00.000Z' });
    expect(status('hongKong', hk, '2026-10-06T06:00:00Z')).toMatchObject({ state: 'open', nextChange: '2026-10-06T08:10:00.000Z' });
  });

  it('has no lunch break in Mumbai', () => {
    // 9 h 15 – 15 h 30 (UTC+5:30) = 03:45 → 10:00 UTC.
    const mumbai = { start: '2026-10-05T03:45:00Z', end: '2026-10-05T10:00:00Z', lastSession: '2026-10-05' };
    expect(status('mumbai', mumbai, '2026-10-05T06:45:00Z')).toMatchObject({ state: 'open', nextChange: '2026-10-05T10:00:00.000Z' });
  });

  it('guesses the usual next opening once the session is over, skipping the weekend', () => {
    const mumbai = { start: '2026-10-05T03:45:00Z', end: '2026-10-05T10:00:00Z', lastSession: '2026-10-05' };
    // Lundi soir → mardi 9 h 15 à Bombay.
    expect(status('mumbai', mumbai, '2026-10-05T18:00:00Z')).toMatchObject({ state: 'closed', nextChange: null, guess: '2026-10-06T03:45:00.000Z' });
    // Vendredi 9 octobre après la séance → lundi 12.
    const friday = { start: '2026-10-09T03:45:00Z', end: '2026-10-09T10:00:00Z', lastSession: '2026-10-09' };
    expect(status('mumbai', friday, '2026-10-09T12:00:00Z').guess).toBe('2026-10-12T03:45:00.000Z');
  });

  it('keeps the last session during a holiday week', () => {
    // Golden Week : Yahoo renvoie encore la séance du 30 septembre le lundi 5 octobre.
    const shanghai = { start: '2026-09-30T01:30:00Z', end: '2026-09-30T07:00:00Z', lastSession: '2026-09-30' };
    expect(status('shanghai', shanghai, '2026-10-05T02:00:00Z')).toEqual({
      state: 'closed',
      nextChange: null,
      guess: '2026-10-06T01:30:00.000Z',
      lastSession: '2026-09-30',
    });
  });
});
