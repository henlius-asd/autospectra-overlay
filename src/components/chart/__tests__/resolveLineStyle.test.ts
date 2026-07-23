import { describe, it, expect } from 'vitest';
import { resolveLineStyle, mapLineTypeToPptxDash } from '../resolveLineStyle';
import { DEFAULT_LINE_STYLE } from '@/types';
import type { LineStyle } from '@/types';

const defaultStyle: LineStyle = { ...DEFAULT_LINE_STYLE };

describe('resolveLineStyle', () => {
  it('returns the default style when override is undefined', () => {
    expect(resolveLineStyle(undefined, defaultStyle)).toEqual(defaultStyle);
  });

  it('returns a new object with default values when override is an empty object', () => {
    expect(resolveLineStyle({}, defaultStyle)).toEqual(defaultStyle);
    expect(resolveLineStyle({}, defaultStyle)).not.toBe(defaultStyle);
  });

  it('applies a single-field override and keeps the rest from default', () => {
    const resolved = resolveLineStyle({ width: 3 }, defaultStyle);
    expect(resolved.width).toBe(3);
    expect(resolved.type).toBe(defaultStyle.type);
    expect(resolved.color).toBe(defaultStyle.color);
  });

  it('applies a full override replacing all default fields', () => {
    const override: Partial<LineStyle> = { width: 4, type: 'dashed', color: '#ff0000' };
    expect(resolveLineStyle(override, defaultStyle)).toEqual(override);
  });

  it('applies a color-only override', () => {
    const resolved = resolveLineStyle({ color: '#1f77b4' }, defaultStyle);
    expect(resolved.color).toBe('#1f77b4');
    expect(resolved.width).toBe(defaultStyle.width);
    expect(resolved.type).toBe(defaultStyle.type);
  });

  it('applies a type-only override', () => {
    const resolved = resolveLineStyle({ type: 'dotted' }, defaultStyle);
    expect(resolved.type).toBe('dotted');
    expect(resolved.width).toBe(defaultStyle.width);
    expect(resolved.color).toBe(defaultStyle.color);
  });

  // Regression: an explicit null in the override must NOT clobber the default.
  // A null color reaches the store via JSON workspace import (unsanitized) or
  // v2->v3 migration of a null top-level color. Without this guard,
  // `{ ...defaultStyle, color: null }` yields color: null, and the PPTX export
  // crashes at `resolved.color.replace('#','')` with "Cannot read properties
  // of null (reading 'replace')" -> swallowed by Toolbar catch -> toast.
  it('falls back to the default when an override field is explicitly null', () => {
    const resolved = resolveLineStyle({ color: null }, defaultStyle);
    expect(resolved.color).toBe(defaultStyle.color);
    expect(resolved.width).toBe(defaultStyle.width);
    expect(resolved.type).toBe(defaultStyle.type);

    const resolvedAll = resolveLineStyle({ width: null, type: null, color: null }, defaultStyle);
    expect(resolvedAll).toEqual(defaultStyle);
  });

  it('keeps a falsy-but-defined width 0 instead of dropping it', () => {
    const resolved = resolveLineStyle({ width: 0 }, defaultStyle);
    expect(resolved.width).toBe(0);
  });
});

describe('mapLineTypeToPptxDash', () => {
  it('maps solid to undefined (omitted dashType)', () => {
    expect(mapLineTypeToPptxDash('solid')).toBeUndefined();
  });

  it('maps dashed to "dash"', () => {
    expect(mapLineTypeToPptxDash('dashed')).toBe('dash');
  });

  it('maps dotted to "dot"', () => {
    expect(mapLineTypeToPptxDash('dotted')).toBe('dot');
  });
});
