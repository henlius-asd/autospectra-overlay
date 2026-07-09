import { describe, it, expect } from 'vitest';
import { yToPixel, pixelToY } from '../yPixelMath';

const frame = { yMin: 0, yMax: 100, gridTop: 20, gridBottom: 60, chartHeight: 400 };

describe('yToPixel', () => {
  it('maps yMax to gridTop', () => {
    expect(yToPixel(100, frame)).toBe(20);
  });
  it('maps yMin to plot bottom', () => {
    expect(yToPixel(0, frame)).toBe(400 - 60);
  });
  it('maps midpoint to middle of plot', () => {
    const mid = yToPixel(50, frame);
    const plotMid = (20 + (400 - 60)) / 2;
    expect(mid).toBeCloseTo(plotMid, 5);
  });
});

describe('pixelToY inverse', () => {
  it('is the inverse of yToPixel across the range', () => {
    for (const y of [0, 25, 50, 75, 100]) {
      expect(pixelToY(yToPixel(y, frame), frame)).toBeCloseTo(y, 7);
    }
  });
  it('recovers yMax at gridTop', () => {
    expect(pixelToY(20, frame)).toBeCloseTo(100, 7);
  });
  it('recovers yMin at plot bottom', () => {
    expect(pixelToY(400 - 60, frame)).toBeCloseTo(0, 7);
  });
  it('handles degenerate range without divide-by-zero', () => {
    const deg = { yMin: 5, yMax: 5, gridTop: 0, gridBottom: 0, chartHeight: 10 };
    expect(yToPixel(5, deg)).toBe(0);
    expect(pixelToY(3, deg)).toBe(5);
  });
});