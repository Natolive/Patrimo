import { MARKETS, marketStatus } from '@pea/shared';

// Heures attendues écrites en UTC : Paris = UTC+2 l'été, UTC+1 l'hiver ; New York = UTC-4 l'été, UTC-5 l'hiver.
const at = (iso: string) => new Date(iso);
const status = (market: keyof typeof MARKETS, now: string) => {
  const { open, nextChange } = marketStatus(MARKETS[market], at(now));
  return { open, nextChange: nextChange.toISOString() };
};

describe('marketStatus', () => {
  it('follows the Paris session in local time, summer and winter', () => {
    // Lundi 5 octobre 2026.
    expect(status('paris', '2026-10-05T06:59:00Z')).toEqual({ open: false, nextChange: '2026-10-05T07:00:00.000Z' });
    expect(status('paris', '2026-10-05T12:00:00Z')).toEqual({ open: true, nextChange: '2026-10-05T15:30:00.000Z' });
    // Après la clôture : mardi 9 h.
    expect(status('paris', '2026-10-05T15:30:00Z')).toEqual({ open: false, nextChange: '2026-10-06T07:00:00.000Z' });
    // Hiver : 9 h à Paris = 8 h UTC.
    expect(status('paris', '2026-12-01T07:30:00Z')).toEqual({ open: false, nextChange: '2026-12-01T08:00:00.000Z' });
  });

  it('skips weekends and Euronext holidays, Easter included', () => {
    // Vendredi soir → lundi.
    expect(status('paris', '2026-10-09T18:00:00Z').nextChange).toBe('2026-10-12T07:00:00.000Z');
    // Pâques 2027 le 28 mars : vendredi 26 et lundi 29 fermés, réouverture mardi 30 (heure d'été depuis le 28).
    expect(status('paris', '2027-03-25T17:00:00Z').nextChange).toBe('2027-03-30T07:00:00.000Z');
    // Noël 2026 un vendredi, 26 un samedi : réouverture lundi 28.
    expect(status('paris', '2026-12-24T17:00:00Z').nextChange).toBe('2026-12-28T08:00:00.000Z');
    // 1er mai 2026 un vendredi.
    expect(status('paris', '2026-04-30T16:00:00Z').nextChange).toBe('2026-05-04T07:00:00.000Z');
  });

  it('follows Wall Street, across the DST weeks when Paris and New York disagree', () => {
    expect(status('newYork', '2026-10-05T13:29:00Z')).toEqual({ open: false, nextChange: '2026-10-05T13:30:00.000Z' });
    expect(status('newYork', '2026-10-05T19:00:00Z')).toEqual({ open: true, nextChange: '2026-10-05T20:00:00.000Z' });
    // 2 novembre 2026 : New York est passé à l'heure d'hiver le 1er (ouverture 14 h 30 UTC).
    expect(status('newYork', '2026-11-02T14:00:00Z').nextChange).toBe('2026-11-02T14:30:00.000Z');
  });

  it('skips US holidays, observed on Friday or Monday', () => {
    // Thanksgiving 2026 : jeudi 26 novembre.
    expect(status('newYork', '2026-11-25T22:00:00Z').nextChange).toBe('2026-11-27T14:30:00.000Z');
    // Independence Day 2026 un samedi : fermé le vendredi 3 juillet.
    expect(status('newYork', '2026-07-02T21:00:00Z').nextChange).toBe('2026-07-06T13:30:00.000Z');
    // Juneteenth 2027 un samedi : fermé vendredi 18 juin.
    expect(status('newYork', '2027-06-17T21:00:00Z').nextChange).toBe('2027-06-21T13:30:00.000Z');
    // MLK 2027 : lundi 18 janvier ; Memorial Day 2026 : lundi 25 mai ; Labor Day 2026 : lundi 7 septembre.
    expect(status('newYork', '2027-01-15T22:00:00Z').nextChange).toBe('2027-01-19T14:30:00.000Z');
    expect(status('newYork', '2026-05-22T21:00:00Z').nextChange).toBe('2026-05-26T13:30:00.000Z');
    expect(status('newYork', '2026-09-04T21:00:00Z').nextChange).toBe('2026-09-08T13:30:00.000Z');
  });

  it('closes on New Year in New York, but not on the Friday before when it falls on Saturday', () => {
    // 1er janvier 2028 un samedi : le vendredi 31 décembre 2027 est ouvert.
    expect(status('newYork', '2027-12-31T15:00:00Z').open).toBe(true);
    // 1er janvier 2027 un vendredi : fermé.
    expect(status('newYork', '2026-12-31T22:00:00Z').nextChange).toBe('2027-01-04T14:30:00.000Z');
  });
});
