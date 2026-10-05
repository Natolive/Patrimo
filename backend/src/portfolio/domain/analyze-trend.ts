import type { TrendDto, TrendPeriod, TrendSignal } from '@pea/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import { movingAverage } from './moving-average.js';
import { shiftMonths } from './shift-months.js';

const TRADING_DAYS = 252;

// Lecture technique d'un historique non vide, à la date de sa dernière clôture.
export function analyzeTrend(points: PricePoint[]): TrendDto {
  const last = points.at(-1)!;
  const closes = points.map((p) => p.close);
  const changeSince = (date: string) => {
    const ref = points.findLast((p) => p.date <= date);
    return ref ? last.close / ref.close - 1 : null;
  };
  const performance: Record<TrendPeriod, number | null> = {
    '1m': changeSince(shiftMonths(last.date, -1)),
    '3m': changeSince(shiftMonths(last.date, -3)),
    '6m': changeSince(shiftMonths(last.date, -6)),
    '1y': changeSince(shiftMonths(last.date, -12)),
    ytd: changeSince(`${Number(last.date.slice(0, 4)) - 1}-12-31`),
  };

  const sma50 = movingAverage(closes, 50).at(-1)!;
  const sma200 = movingAverage(closes, 200).at(-1)!;

  const yearAgo = shiftMonths(last.date, -12);
  const year = closes.slice(points.findIndex((p) => p.date > yearAgo));
  const high52 = Math.max(...year);
  const returns = year.slice(1).map((close, i) => Math.log(close / year[i]));

  return {
    performance,
    sma50,
    sma200,
    signal: signal(last.close, sma50, sma200),
    high52,
    low52: Math.min(...year),
    fromHigh52: last.close / high52 - 1,
    volatility: returns.length < 20 ? null : standardDeviation(returns) * Math.sqrt(TRADING_DAYS),
  };
}

// Haussière : cours et MM50 au-dessus de la MM200 ; baissière : les deux en dessous.
function signal(close: number, sma50: number | null, sma200: number | null): TrendSignal | null {
  if (sma50 === null || sma200 === null) return null;
  if (close > sma200 && sma50 > sma200) return 'up';
  if (close < sma200 && sma50 < sma200) return 'down';
  return 'neutral';
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1));
}
