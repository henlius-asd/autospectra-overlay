import { describe, it, expect } from 'vitest';
import { normalizeYZoomRange } from '../yZoomRange';

describe('normalizeYZoomRange', () => {
  it('returns same values when already ordered', () => {
    const r = normalizeYZoomRange(20, 80);
    expect(r).toEqual([20, 80]);
  });

  it('normalizes inverted range', () => {
    const r = normalizeYZoomRange(80, 20);
    expect(r[0]).toBeLessThanOrEqual(r[1]);
    expect(r[0]).toBe(20);
    expect(r[1]).toBe(80);
  });
});