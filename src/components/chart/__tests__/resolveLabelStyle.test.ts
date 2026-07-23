import { describe, it, expect } from 'vitest';
import { resolveLabelStyle } from '../resolveLabelStyle';
import { DEFAULT_LABEL_STYLE } from '@/types';
import type { LabelStyle } from '@/types';

const defaultStyle: LabelStyle = { ...DEFAULT_LABEL_STYLE };

describe('resolveLabelStyle', () => {
  it('returns the default style when override is undefined', () => {
    expect(resolveLabelStyle(undefined, defaultStyle)).toEqual(defaultStyle);
  });

  it('returns a new object with default values when override is an empty object', () => {
    expect(resolveLabelStyle({}, defaultStyle)).toEqual(defaultStyle);
    expect(resolveLabelStyle({}, defaultStyle)).not.toBe(defaultStyle);
  });

  it('applies a color-only override and keeps the rest from default', () => {
    const resolved = resolveLabelStyle({ color: '#1f77b4' }, defaultStyle);
    expect(resolved.color).toBe('#1f77b4');
    expect(resolved.fontSize).toBe(defaultStyle.fontSize);
  });

  // Regression: an explicit null in the override must NOT clobber the default.
  // Braces/point-labels can carry a null style field via JSON import; without
  // this guard, `resolved.color` becomes null and exportPptx/exportImage
  // crash at `style.color.replace('#','')`.
  it('falls back to the default when an override field is explicitly null', () => {
    const resolved = resolveLabelStyle({ color: null }, defaultStyle);
    expect(resolved.color).toBe(defaultStyle.color);
    expect(resolved.fontSize).toBe(defaultStyle.fontSize);
    expect(resolved.fontFamily).toBe(defaultStyle.fontFamily);

    const resolvedAll = resolveLabelStyle(
      { fontSize: null, fontFamily: null, fontWeight: null, color: null, backgroundColor: null },
      defaultStyle,
    );
    expect(resolvedAll).toEqual(defaultStyle);
  });

  it('keeps a falsy-but-defined fontSize 0 instead of dropping it', () => {
    const resolved = resolveLabelStyle({ fontSize: 0 }, defaultStyle);
    expect(resolved.fontSize).toBe(0);
  });
});
