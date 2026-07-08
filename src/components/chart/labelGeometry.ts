// src/components/chart/labelGeometry.ts
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

export interface TopCurveContext {
  visibleIds: string[];
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  layerSpacing: number;
  yRangeForLayer: number;
}

/**
 * Data-space peak of the topmost curve layer = rawDataMin + yRangeForLayer.
 * Equals the highest point on the chart (the "100% line").
 */
export function topCurvePeak(rawDataMin: number, yRangeForLayer: number): number {
  return rawDataMin + yRangeForLayer;
}

/**
 * Pixel Y of the topmost visible curve (visibleIds[0]) at xVal.
 * `yToPixel` is supplied by the caller so the screen renderer
 * (convertYToPixel) and the export compositor (local y-pixel formula)
 * share one implementation.
 */
export function getTopCurvePixelYAtX(
  xVal: number,
  ctx: TopCurveContext,
  yToPixel: (y: number) => number,
): number {
  const { visibleIds, curves, offsets, layerSpacing, yRangeForLayer } = ctx;
  if (visibleIds.length === 0) return 0 + yToPixel(0);

  const topId = visibleIds[0];
  const curve = curves[topId];
  if (!curve || curve.data.length === 0) return 0 + yToPixel(0);

  const offset = offsets[topId] ?? { xOffset: 0, yOffset: 0 };
  const visibleCount = visibleIds.length;
  const layerIndex = visibleCount - 1; // top curve sits on the highest layer
  const layerYOffset = layerIndex * layerSpacing * yRangeForLayer;

  const data = curve.data;
  const target = xVal - offset.xOffset;

  // data is sorted ascending by x; binary search the bracketing pair
  if (target <= data[0][0]) {
    return 0 + yToPixel(data[0][1] + layerYOffset + offset.yOffset);
  }
  const last = data.length - 1;
  if (target >= data[last][0]) {
    return 0 + yToPixel(data[last][1] + layerYOffset + offset.yOffset);
  }
  let lo = 0;
  let hi = last;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (data[mid][0] <= target) lo = mid;
    else hi = mid;
  }
  const [x0, y0] = data[lo];
  const [x1, y1] = data[hi];
  const t = (target - x0) / (x1 - x0 || 1);
  const y = y0 + (y1 - y0) * t;
  return 0 + yToPixel(y + layerYOffset + offset.yOffset);
}