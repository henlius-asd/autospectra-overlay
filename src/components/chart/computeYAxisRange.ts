import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
import { LABEL_PADDING_RATIO } from './WaterfallChart';

/**
 * Compute Y-axis range parameters for waterfall chart rendering.
 * Tracks both rawDataMin and rawDataMax to support negative values.
 *
 * @param visibleIds - Array of visible curve IDs in display order
 * @param curves - Map of curve ID to curve data
 * @param offsets - Map of curve ID to offsets
 * @param xRange - Current X-axis visible range [min, max]
 * @param layerSpacing - Layer spacing multiplier from UI slider
 * @returns Object containing all computed Y-axis range parameters
 */
export function computeYAxisRange(
  visibleIds: string[],
  curves: Record<string, CurveData>,
  offsets: Record<string, CurveOffsets>,
  xRange: [number, number],
  layerSpacing: number,
): {
  rawDataMin: number;
  rawDataMax: number;
  dataSpan: number;
  yRangeForLayer: number;
  yAxisMin: number;
  yAxisMax: number;
  maxY: number;
} {
  // Track both min and max across all visible curves
  let rawDataMin = Infinity;
  let rawDataMax = -Infinity;

  for (const id of visibleIds) {
    const curve = curves[id];
    const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };
    for (const [x, yVal] of curve.data) {
      if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
        const adjusted = yVal + offset.yOffset;
        if (adjusted < rawDataMin) rawDataMin = adjusted;
        if (adjusted > rawDataMax) rawDataMax = adjusted;
      }
    }
  }

  // Handle case where no data points are in range
  if (!isFinite(rawDataMin) || !isFinite(rawDataMax)) {
    rawDataMin = 0;
    rawDataMax = 1;
  }

  // Compute data span, with fallback for degenerate case
  let dataSpan = rawDataMax - rawDataMin;
  if (dataSpan === 0) {
    dataSpan = 1; // default span when all values are the same
  }

  // Fixed-point formula for layer range
  const visibleCount = visibleIds.length;
  const spacingBudget = (visibleCount - 1) * layerSpacing;
  const yRangeForLayer = spacingBudget >= 1
    ? dataSpan * 10 // safety fallback
    : dataSpan / (1 - spacingBudget);

  // Y-axis bounds with padding
  const padding = dataSpan * 0.02;
  const yAxisMin = Math.min(0, rawDataMin) - padding;
  const yAxisMax = rawDataMin + yRangeForLayer * (1 + LABEL_PADDING_RATIO);

  // maxY for label positioning (same as yAxisMax)
  const maxY = yAxisMax;

  return {
    rawDataMin,
    rawDataMax,
    dataSpan,
    yRangeForLayer,
    yAxisMin,
    yAxisMax,
    maxY,
  };
}