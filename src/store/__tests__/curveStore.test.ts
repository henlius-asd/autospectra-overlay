import { describe, it, expect } from 'vitest';
import { deriveBaseline } from '../curveStore';

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
