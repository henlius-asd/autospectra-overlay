import { describe, it, expect } from 'vitest';
import { scaleByWheel, offsetByDrag, clampScale, computePeakNormalizeFactor } from '../curveScaleMath';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

describe('clampScale', () => {
  it('clamps to [0.1, 10]', () => {
    expect(clampScale(0)).toBe(0.1);
    expect(clampScale(100)).toBe(10);
    expect(clampScale(2)).toBe(2);
  });
});

describe('scaleByWheel', () => {
  it('scroll up (deltaY<0) enlarges by ~1.1', () => {
    expect(scaleByWheel(1, -100)).toBeCloseTo(1.1, 5);
  });
  it('scroll down (deltaY>0) shrinks by ~1/1.1', () => {
    expect(scaleByWheel(1, 100)).toBeCloseTo(1 / 1.1, 5);
  });
  it('clamps the result', () => {
    expect(scaleByWheel(10, -100)).toBe(10);
  });
});

describe('offsetByDrag', () => {
  const frame = { yMin: 0, yMax: 100, gridTop: 0, gridBottom: 0, chartHeight: 100 };
  it('drag up (currentPy<startPy) increases offset (curve moves up)', () => {
    const off = offsetByDrag(0, 50, 40, frame);
    expect(off).toBeGreaterThan(0);
  });
  it('drag down decreases offset', () => {
    const off = offsetByDrag(0, 40, 50, frame);
    expect(off).toBeLessThan(0);
  });
  it('preserves start offset base', () => {
    const off = offsetByDrag(5, 50, 50, frame);
    expect(off).toBeCloseTo(5, 7);
  });
});

describe('computePeakNormalizeFactor', () => {
  const curve: CurveData = { name: 'test', color: '#000', data: [[0, 10], [1, 50], [2, 30], [3, 100], [5, 20]] };
  const offset: CurveOffsets = { xOffset: 0, yOffset: 0 };

  it('returns targetPeak / peakY when peak > 0', () => {
    expect(computePeakNormalizeFactor(curve, offset, [0, 5], 200)).toBeCloseTo(2.0, 5);
  });

  it('returns 1 when peak <= 0', () => {
    const flatCurve: CurveData = { name: 'flat', color: '#000', data: [[0, 0], [1, 0]] };
    expect(computePeakNormalizeFactor(flatCurve, offset, [0, 1], 100)).toBe(1);
  });

  it('filters by xRange', () => {
    expect(computePeakNormalizeFactor(curve, offset, [0, 2], 100)).toBeCloseTo(2.0, 5);
  });

  it('returns 1 when no data points in xRange', () => {
    expect(computePeakNormalizeFactor(curve, offset, [10, 20], 100)).toBe(1);
  });

  it('accounts for xOffset', () => {
    const shiftedCurve: CurveData = { name: 'shifted', color: '#000', data: [[100, 50]] };
    const shiftedOffset: CurveOffsets = { xOffset: -100, yOffset: 0 };
    expect(computePeakNormalizeFactor(shiftedCurve, shiftedOffset, [0, 10], 100)).toBeCloseTo(2.0);
  });
});
