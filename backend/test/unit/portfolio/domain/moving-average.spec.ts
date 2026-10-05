import { movingAverage } from '@src/portfolio/domain/moving-average.js';

describe('movingAverage', () => {
  it('averages the last values once the window is full', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });
});
