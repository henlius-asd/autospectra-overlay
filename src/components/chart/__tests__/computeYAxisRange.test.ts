import { describe, it, expect } from 'vitest';
import { computeYAxisRange } from '../computeYAxisRange';
import type { CurveData } from '@/types';

describe('computeYAxisRange', () => {
  it('should handle all-positive data (backward compatibility)', () => {
    const curves: Record<string, CurveData> = {
      c1: { name: 'curve1', data: [[0, 10], [1, 20], [2, 30]] },
      c2: { name: 'curve2', data: [[0, 5], [1, 15], [2, 25]] },
    };
    const offsets = {
      c1: { xOffset: 0, yOffset: 0 },
      c2: { xOffset: 0, yOffset: 0 },
    };
    const result = computeYAxisRange(
      ['c1', 'c2'],
      curves,
      offsets,
      [0, 2],
      0.15,
    );

    expect(result.rawDataMin).toBe(5);
    expect(result.rawDataMax).toBe(30);
    expect(result.dataSpan).toBe(25);
    expect(result.yAxisMin).toBeLessThan(5);
    expect(result.yAxisMax).toBeGreaterThan(30);
    expect(result.yRangeForLayer).toBeGreaterThan(25);
  });

  it('should handle data with negative values', () => {
    const curves: Record<string, CurveData> = {
      c1: { name: 'curve1', data: [[0, -10], [1, 20], [2, 30]] },
    };
    const offsets = { c1: { xOffset: 0, yOffset: 0 } };
    const result = computeYAxisRange(['c1'], curves, offsets, [0, 2], 0);

    expect(result.rawDataMin).toBe(-10);
    expect(result.rawDataMax).toBe(30);
    expect(result.dataSpan).toBe(40);
    expect(result.yAxisMin).toBeLessThan(0);
    expect(result.yAxisMin).toBeLessThanOrEqual(-10);
    expect(result.yAxisMax).toBeGreaterThan(30);
  });

  it('should handle all-negative data', () => {
    const curves: Record<string, CurveData> = {
      c1: { name: 'curve1', data: [[0, -30], [1, -20], [2, -10]] },
    };
    const offsets = { c1: { xOffset: 0, yOffset: 0 } };
    const result = computeYAxisRange(['c1'], curves, offsets, [0, 2], 0);

    expect(result.rawDataMin).toBe(-30);
    expect(result.rawDataMax).toBe(-10);
    expect(result.dataSpan).toBe(20);
    expect(result.yAxisMin).toBeLessThan(-30);
    expect(result.yAxisMax).toBeGreaterThan(-10);
  });

  it('should handle degenerate case where all values are the same', () => {
    const curves: Record<string, CurveData> = {
      c1: { name: 'curve1', data: [[0, 5], [1, 5], [2, 5]] },
    };
    const offsets = { c1: { xOffset: 0, yOffset: 0 } };
    const result = computeYAxisRange(['c1'], curves, offsets, [0, 2], 0);

    expect(result.dataSpan).toBe(1); // default span when dataSpan === 0
    expect(result.yAxisMin).toBeLessThan(5);
    expect(result.yAxisMax).toBeGreaterThan(5);
  });

  it('should compute correct yRangeForLayer with layer spacing', () => {
    const curves: Record<string, CurveData> = {
      c1: { name: 'curve1', data: [[0, 0], [1, 100]] },
      c2: { name: 'curve2', data: [[0, 0], [1, 100]] },
      c3: { name: 'curve3', data: [[0, 0], [1, 100]] },
    };
    const offsets = {
      c1: { xOffset: 0, yOffset: 0 },
      c2: { xOffset: 0, yOffset: 0 },
      c3: { xOffset: 0, yOffset: 0 },
    };
    const result = computeYAxisRange(
      ['c1', 'c2', 'c3'],
      curves,
      offsets,
      [0, 1],
      0.15,
    );

    // dataSpan = 100, spacingBudget = 2 * 0.15 = 0.3
    // yRangeForLayer = 100 / (1 - 0.3) = 142.857...
    expect(result.yRangeForLayer).toBeCloseTo(142.857, 2);
  });
});