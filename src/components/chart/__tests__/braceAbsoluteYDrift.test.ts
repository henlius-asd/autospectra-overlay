import { describe, it, expect } from 'vitest';
import type { CurveData } from '@/types';
import { computeYAxisRange } from '../computeYAxisRange';
import { topCurvePeak } from '../labelGeometry';
import { yToPixel } from '../yPixelMath';

/**
 * Regression context for the brace absolute-Y reference-frame change.
 *
 * Pre-fix, the brace baseline was `peak = topCurvePeak(rawDataMin, yRangeForLayer)`
 * rendered via `convertYToPixel(peak) - BRACE_HEIGHT/2 + yOffset`. Because
 * `computeYAxisRange` derives `rawDataMin`/`yRangeForLayer` from offset-ADJUSTED
 * data, `peak` is NOT a fixed data coordinate — it shifts when curves are
 * translated. That is the reference-frame mismatch with point labels (which use
 * a fixed absolute data Y).
 *
 * Note: the literal "brace↔curve pixel gap stays invariant under translation"
 * framing is NOT mathematically clean (the offset-derived axis rescales, so an
 * absolute-Y label's gap to a translated curve is not strictly constant). This
 * test pins the load-bearing invariant instead: the pre-fix peak baseline is
 * offset-dependent (drift source), while a post-fix absolute-Y brace is a fixed
 * data coordinate whose pixel is governed solely by the shared axis transform.
 */
describe('brace absolute-Y reference frame (drift regression)', () => {
  const gridTop = 40;
  const gridBottom = 40;
  const chartHeight = 600;

  const curves: Record<string, CurveData> = {
    top: { name: 'top', data: [[0, 100], [10, 100]] },
    bot: { name: 'bot', data: [[0, 0], [10, 0]] },
  };
  const visibleIds = ['top', 'bot'];
  const layerSpacing = 0.3;

  const axisFor = (topYOffset: number) =>
    computeYAxisRange(
      visibleIds,
      curves,
      { top: { xOffset: 0, yOffset: topYOffset }, bot: { xOffset: 0, yOffset: 0 } },
      layerSpacing,
    );
  const peakOf = (axis: ReturnType<typeof axisFor>) =>
    topCurvePeak(axis.rawDataMin, axis.yRangeForLayer);
  const pix = (y: number, axis: ReturnType<typeof axisFor>) =>
    yToPixel(y, { yMin: axis.yAxisMin, yMax: axis.yAxisMax, gridTop, gridBottom, chartHeight });

  it('pre-fix peak baseline is offset-dependent (the drift source)', () => {
    // Translating the top curve rescales the offset-derived axis, so `peak`
    // shifts — i.e. the old brace baseline was NOT a fixed data coordinate and
    // rode the curve. If this invariant ever breaks (axis stops being
    // offset-derived), the reference-frame rationale changes.
    expect(peakOf(axisFor(0))).not.toBe(peakOf(axisFor(20)));
  });

  it('an absolute-Y brace is a fixed data coordinate whose pixel is governed by the axis', () => {
    // brace.y is a stored absolute data Y; its pixel = convertYToPixel(brace.y),
    // identical to a point label at the same Y. Under translation the axis moves,
    // so the pixel moves — but the DATA coordinate stays fixed (unlike peak).
    const braceY = 70;
    expect(pix(braceY, axisFor(0))).not.toBe(pix(braceY, axisFor(20)));
  });
});
