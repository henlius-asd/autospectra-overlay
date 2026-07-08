// src/components/chart/__tests__/labelClamp.test.ts
import { describe, it, expect } from 'vitest';
import { estimateTextWidth, clampLabelX, clampLabelY } from '../labelClamp';

describe('estimateTextWidth', () => {
  it('estimates width from length and font size', () => {
    expect(estimateTextWidth('abc', 10)).toBeCloseTo(10 * 3 * 0.55, 5);
  });
  it('returns 0 for empty label', () => {
    expect(estimateTextWidth('', 10)).toBe(0);
  });
});

describe('clampLabelX', () => {
  it('leaves px unchanged when within bounds', () => {
    // textW=20 → halfW=10; bounds [60+10, 800-48-10] = [70, 742]
    expect(clampLabelX(400, 20, 60, 48, 800)).toBe(400);
  });
  it('clamps to left bound', () => {
    expect(clampLabelX(50, 20, 60, 48, 800)).toBe(70);
  });
  it('clamps to right bound', () => {
    expect(clampLabelX(800, 20, 60, 48, 800)).toBe(742);
  });
  it('centers when bounds collapse', () => {
    // gridLeft+halfW > chartWidth-gridRight-halfW
    expect(clampLabelX(100, 2000, 60, 48, 800)).toBeCloseTo((70 + 742) / 2, 5);
  });
});

describe('clampLabelY', () => {
  it('leaves py unchanged when within bounds', () => {
    // halfH=6; bounds [50+6, 540-6] = [56, 534]
    expect(clampLabelY(200, 6, 50, 540)).toBe(200);
  });
  it('clamps to top bound', () => {
    expect(clampLabelY(10, 6, 50, 540)).toBe(56);
  });
  it('clamps to bottom bound', () => {
    expect(clampLabelY(600, 6, 50, 540)).toBe(534);
  });
});
