import { describe, it, expect } from 'vitest';
import { getTopCurvePixelYAtX, topCurvePeak } from '../labelGeometry';
import type { CurveData, DataPoint } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

const curves: Record<string, CurveData> = {
  top: { name: 'top', data: [[0, 0], [10, 100], [20, 50]] },
};
const offsets: Record<string, CurveOffsets> = { top: { xOffset: 0, yOffset: 0 } };

describe('topCurvePeak', () => {
  it('returns rawDataMin + yRangeForLayer', () => {
    expect(topCurvePeak(5, 25)).toBe(30);
  });
});

describe('getTopCurvePixelYAtX', () => {
  const ctx = {
    visibleIds: ['top'],
    curves,
    offsets,
    layerSpacing: 0,
    yRangeForLayer: 100,
  };
  // identity converter: pixel y == data y (for test clarity we invert to match
  // screen-down convention by negating)
  const yToPixel = (y: number) => -y;

  it('returns exact sample at a data point', () => {
    // at x=10, y=100 → -100
    expect(getTopCurvePixelYAtX(10, ctx, yToPixel)).toBe(-100);
  });

  it('linearly interpolates between samples', () => {
    // at x=5, halfway between (0,0) and (10,100) → y=50 → -50
    expect(getTopCurvePixelYAtX(5, ctx, yToPixel)).toBe(-50);
  });

  it('clamps to first sample before range', () => {
    expect(getTopCurvePixelYAtX(-5, ctx, yToPixel)).toBe(0);
  });

  it('clamps to last sample after range', () => {
    expect(getTopCurvePixelYAtX(30, ctx, yToPixel)).toBe(-50);
  });

  it('returns yToPixel(0) when no visible curves', () => {
    expect(getTopCurvePixelYAtX(5, { ...ctx, visibleIds: [] }, yToPixel)).toBe(0);
  });

  it('applies layer offset for the top curve', () => {
    // 2 visible → top curve layerIndex = 1, layerYOffset = 1*0.1*100 = 10
    const ctx2 = {
      visibleIds: ['top', 'bot'],
      curves: { ...curves, bot: { name: 'bot', data: [[0, 0], [10, 100]] as DataPoint[] } },
      offsets: { ...offsets, bot: { xOffset: 0, yOffset: 0 } },
      layerSpacing: 0.1,
      yRangeForLayer: 100,
    };
    // at x=10, y=100 + layerYOffset 10 = 110 → -110
    expect(getTopCurvePixelYAtX(10, ctx2, yToPixel)).toBe(-110);
  });
});