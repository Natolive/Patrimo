// Moyenne mobile simple sur `window` valeurs ; null tant que l'historique est trop court.
export function movingAverage(values: number[], window: number): (number | null)[] {
  let sum = 0;
  return values.map((value, i) => {
    sum += value - (i >= window ? values[i - window] : 0);
    return i >= window - 1 ? sum / window : null;
  });
}
