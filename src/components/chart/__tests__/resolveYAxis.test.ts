import { describe, it, expect } from 'vitest';
import { resolveYAxis } from '../resolveYAxis';

const full = {
  yAxisMin: -1, yAxisMax: 115, rawDataMin: 5, rawDataMax: 100, dataSpan: 95,
};

describe('resolveYAxis', () => {
  it('returns full range when yZoomRange is null', () => {
    const r = resolveYAxis(full, null);
    expect(r).toEqual({ yMin: -1, yMax: 115, isZoomed: false });
  });

  it('applies zoom range clamped to data region (not label padding)', () => {
    const r = resolveYAxis(full, [20, 80]);
    expect(r).toEqual({ yMin: 20, yMax: 80, isZoomed: true });
  });

  it('clamps zoom ends to [rawDataMin, rawDataMax]', () => {
    // yAxisMax=115 includes label padding; zoom must not enter it.
    const r = resolveYAxis(full, [0, 200]);
    expect(r.yMin).toBe(5);
    expect(r.yMax).toBe(100);
    expect(r.isZoomed).toBe(true);
  });

  it('enforces minimum segment = 5% of dataSpan', () => {
    const r = resolveYAxis(full, [50, 51]); // span 1 < 0.05*95=4.75
    expect(r.yMax - r.yMin).toBeGreaterThanOrEqual(4.75);
    expect(r.isZoomed).toBe(true);
  });

  it('normalizes inverted range', () => {
    const r = resolveYAxis(full, [80, 20]);
    expect(r.yMin).toBeLessThanOrEqual(r.yMax);
  });

  it('handles degenerate data (dataSpan default 1)', () => {
    const deg = { yAxisMin: -1, yAxisMax: 2, rawDataMin: 5, rawDataMax: 5, dataSpan: 1 };
    const r = resolveYAxis(deg, [5, 5]);
    expect(r.yMax - r.yMin).toBeGreaterThanOrEqual(0.05);
  });
});