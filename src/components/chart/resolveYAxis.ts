export interface YAxisFullRange {
  yAxisMin: number;
  yAxisMax: number;
  rawDataMin: number;
  rawDataMax: number;
  dataSpan: number;
}

export interface ResolvedYAxis {
  yMin: number;
  yMax: number;
  isZoomed: boolean;
}

const MIN_SEGMENT_RATIO = 0.05;

export function resolveYAxis(
  full: YAxisFullRange,
  yZoomRange: [number, number] | null,
): ResolvedYAxis {
  if (!yZoomRange) {
    return { yMin: full.yAxisMin, yMax: full.yAxisMax, isZoomed: false };
  }
  const lo = Math.min(yZoomRange[0], yZoomRange[1]);
  const hi = Math.max(yZoomRange[0], yZoomRange[1]);
  let min = Math.max(full.rawDataMin, Math.min(full.rawDataMax, lo));
  let max = Math.max(full.rawDataMin, Math.min(full.rawDataMax, hi));
  const minSeg = MIN_SEGMENT_RATIO * full.dataSpan;
  if (max - min < minSeg) {
    const mid = (min + max) / 2;
    min = mid - minSeg / 2;
    max = mid + minSeg / 2;
    if (min < full.rawDataMin) {
      min = full.rawDataMin;
      max = min + minSeg;
    }
    if (max > full.rawDataMax) {
      max = full.rawDataMax;
      min = max - minSeg;
    }
    if (max - min < minSeg) {
      const mid = (full.rawDataMin + full.rawDataMax) / 2;
      min = mid - minSeg / 2;
      max = mid + minSeg / 2;
    }
  }
  return { yMin: min, yMax: max, isZoomed: true };
}
