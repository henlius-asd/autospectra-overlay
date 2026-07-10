import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
import { LABEL_PADDING_RATIO } from './WaterfallChart';

/**
 * Compute Y-axis range parameters for waterfall chart rendering.
 * Tracks both rawDataMin and rawDataMax to support negative values.
 * Y-axis range is computed from composite-scaled data (normalize × globalScale × manual + scaleOffset)
 * so the axis accommodates the rendered curves rather than raw data.
 */
export function computeYAxisRange(
  visibleIds: string[],
  curves: Record<string, CurveData>,
  offsets: Record<string, CurveOffsets>,
  xRange: [number, number],
  layerSpacing: number,
  normalizeFactors: Record<string, number> = {},
  globalScale: number = 1,
  curveScales: Record<string, number> = {},
  curveScaleOffsets: Record<string, number> = {},
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
    const normalize = normalizeFactors[id] ?? 1;
    const manual = curveScales[id] ?? 1;
    const composite = normalize * globalScale * manual;
    const scaleOffset = curveScaleOffsets[id] ?? 0;
    for (const [x, yVal] of curve.data) {
      if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
        const adjusted = yVal * composite + scaleOffset + offset.yOffset;
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
