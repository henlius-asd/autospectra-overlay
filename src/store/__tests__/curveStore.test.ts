import { describe, it, expect } from 'vitest';
import { deriveBaseline, useCurveStore } from '../curveStore';
import type { BraceAnnotation } from '@/types';

describe('globalScale', () => {
  it('defaults to 1', () => {
    expect(useCurveStore.getState().globalScale).toBe(1);
  });

  it('setGlobalScale updates and clamps to [0.1, 10]', () => {
    useCurveStore.getState().setGlobalScale(2.5);
    expect(useCurveStore.getState().globalScale).toBe(2.5);
    useCurveStore.getState().setGlobalScale(0.05);
    expect(useCurveStore.getState().globalScale).toBe(0.1);
    useCurveStore.getState().setGlobalScale(20);
    expect(useCurveStore.getState().globalScale).toBe(10);
  });

  it('resetGlobalScale sets to 1', () => {
    useCurveStore.getState().setGlobalScale(3);
    useCurveStore.getState().resetGlobalScale();
    expect(useCurveStore.getState().globalScale).toBe(1);
  });
});

describe('normalizeFactors', () => {
  it('defaults to empty object', () => {
    expect(useCurveStore.getState().normalizeFactors).toEqual({});
  });

  it('setNormalizeFactor sets a factor for a curve', () => {
    useCurveStore.getState().setNormalizeFactor('curveA', 2.0);
    expect(useCurveStore.getState().normalizeFactors['curveA']).toBe(2.0);
  });

  it('clearNormalizeFactors resets all to empty', () => {
    useCurveStore.getState().setNormalizeFactor('curveA', 2.0);
    useCurveStore.getState().setNormalizeFactor('curveB', 0.5);
    useCurveStore.getState().clearNormalizeFactors();
    expect(useCurveStore.getState().normalizeFactors).toEqual({});
  });

  it('normalizeAllPeak sets factors relative to baseline peak', () => {
    const curveA = { name: 'A', color: '#000', data: [[0, 50], [1, 100], [2, 80]] };
    const curveB = { name: 'B', color: '#111', data: [[0, 200], [1, 150], [2, 180]] };
    useCurveStore.getState().addCurves([curveA, curveB]);
    const state = useCurveStore.getState();
    const ids = Object.keys(state.curves);
    const idA = ids[0];
    const idB = ids[1];
    useCurveStore.getState().toggleCurveVisibility(idA);
    useCurveStore.getState().toggleCurveVisibility(idB);
    // idB is last in stagingOrder → baseline
    useCurveStore.getState().normalizeAllPeak([0, 2]);
    const factors = useCurveStore.getState().normalizeFactors;
    // baselinePeak = 200, curveA peak = 100, factor = 200/100 = 2
    expect(factors[idA]).toBeCloseTo(2.0, 5);
    // curveB peak = 200, factor = 200/200 = 1
    expect(factors[idB]).toBeCloseTo(1.0, 5);
  });

  it('removeCurve cleans up normalizeFactors', () => {
    const curve = { name: 'C', color: '#000', data: [[0, 10]] };
    useCurveStore.getState().addCurves([curve]);
    const id = Object.keys(useCurveStore.getState().curves)[0];
    useCurveStore.getState().setNormalizeFactor(id, 3.0);
    useCurveStore.getState().removeCurve(id);
    expect(useCurveStore.getState().normalizeFactors[id]).toBeUndefined();
  });
});

describe('deriveBaseline', () => {
  it('returns null for empty stagingOrder', () => {
    expect(deriveBaseline([], {})).toBeNull();
  });

  it('returns null when no curves are visible', () => {
    expect(deriveBaseline(['a', 'b', 'c'], {})).toBeNull();
  });

  it('returns the last visible curve in stagingOrder (bottom of list = baseline)', () => {
    // visibleIds[0]=top, visibleIds[2]=bottom=baseline
    expect(deriveBaseline(['a', 'b', 'c'], { a: true, b: true, c: true })).toBe('c');
  });

  it('skips invisible curves when finding the last visible', () => {
    // c is invisible → baseline is b (the last visible)
    expect(deriveBaseline(['a', 'b', 'c'], { a: true, b: true })).toBe('b');
  });

  it('returns the only visible curve when only one is visible', () => {
    expect(deriveBaseline(['a', 'b', 'c'], { b: true })).toBe('b');
  });

  it('returns the first element when it is the only visible', () => {
    expect(deriveBaseline(['a', 'b', 'c'], { a: true })).toBe('a');
  });
});

describe('setCurveScale', () => {
  it('sets scale for a curve', () => {
    useCurveStore.setState({ curveScales: {} });
    useCurveStore.getState().setCurveScale('c1', 2.0);
    expect(useCurveStore.getState().curveScales).toEqual({ c1: 2.0 });
  });

  it('cleans up scale when curve is removed', () => {
    useCurveStore.setState({
      curves: { c1: { name: 'c1', data: [] } },
      curveScales: { c1: 2.0 },
      visibleCurves: { c1: true },
      stagingOrder: ['c1'],
    });
    useCurveStore.getState().removeCurve('c1');
    expect(useCurveStore.getState().curveScales).toEqual({});
  });
});

describe('setCurveColor', () => {
  it('sets color for a curve', () => {
    useCurveStore.setState({
      curves: { c1: { name: 'c1', data: [], color: '#000000' } },
    });
    useCurveStore.getState().setCurveColor('c1', '#FF0000');
    expect(useCurveStore.getState().curves.c1.color).toBe('#FF0000');
  });
});

describe('updateBrace', () => {
  it('updates the matching brace and leaves others untouched', () => {
    useCurveStore.setState({
      braces: [
        { id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 'a' },
        { id: 'b2', type: 'horizontal', startX: 20, endX: 30, label: 'b' },
      ] as BraceAnnotation[],
    });
    useCurveStore.getState().updateBrace('b1', { startX: 5, endX: 15 });
    const braces = useCurveStore.getState().braces;
    expect(braces[0]).toEqual({ id: 'b1', type: 'horizontal', startX: 5, endX: 15, label: 'a' });
    expect(braces[1]).toEqual({ id: 'b2', type: 'horizontal', startX: 20, endX: 30, label: 'b' });
  });

  it('is a no-op when the id is not found', () => {
    useCurveStore.setState({
      braces: [{ id: 'b1', type: 'horizontal', startX: 0, endX: 10, label: 'a' }] as BraceAnnotation[],
    });
    useCurveStore.getState().updateBrace('missing', { label: 'x' });
    expect(useCurveStore.getState().braces).toHaveLength(1);
    expect(useCurveStore.getState().braces[0].label).toBe('a');
  });
});
