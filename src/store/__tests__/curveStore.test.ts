import { describe, it, expect } from 'vitest';
import { deriveBaseline, useCurveStore } from '../curveStore';
import type { BraceAnnotation } from '@/types';

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
