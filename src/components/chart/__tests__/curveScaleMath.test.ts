import { describe, it, expect } from 'vitest';
import { scaleByWheel, scaleByDrag, offsetByDrag, clampScale } from '../curveScaleMath';

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

describe('scaleByDrag', () => {
  it('drag up (deltaPx<0) enlarges scale', () => {
    expect(scaleByDrag(1, -100)).toBeGreaterThan(1);
  });
  it('drag down (deltaPx>0) shrinks scale', () => {
    expect(scaleByDrag(1, 100)).toBeLessThan(1);
  });
  it('clamps the result', () => {
    expect(scaleByDrag(10, -1000)).toBe(10);
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