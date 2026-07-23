import { describe, it, expect } from 'vitest';
import { migrateLegacyPixelOffset } from '../annotationMigration';

describe('migrateLegacyPixelOffset', () => {
  // Inverted linear axis: pixel 0 = data 100, pixel 100 = data 0 (1px = 1 unit).
  const convertPixelToY = (py: number) => 100 - py;

  it('converts basePixel + yOffset to absolute data Y', () => {
    // baseline pixel 30 + offset 10 => pixel 40 => data 60
    expect(migrateLegacyPixelOffset(30, 10, convertPixelToY)).toBe(60);
  });

  it('treats yOffset=0 as the baseline data Y', () => {
    expect(migrateLegacyPixelOffset(30, 0, convertPixelToY)).toBe(70);
  });

  it('handles negative yOffset (upward offset)', () => {
    // baseline pixel 30 + offset -10 => pixel 20 => data 80
    expect(migrateLegacyPixelOffset(30, -10, convertPixelToY)).toBe(80);
  });

  it('round-trips through a symmetric identity axis', () => {
    const ident = (py: number) => py;
    expect(migrateLegacyPixelOffset(42, 5, ident)).toBe(47);
  });

  it('preserves a brace baseline + free drag offset under a scaled axis', () => {
    // 2px per data unit, inverted: data = 50 - py/2
    const scaled = (py: number) => 50 - py / 2;
    // braceY pixel 20 + yOffset 6 => pixel 26 => data 50 - 13 = 37
    expect(migrateLegacyPixelOffset(20, 6, scaled)).toBe(37);
  });
});
