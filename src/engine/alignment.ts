import type { AlignmentAlgorithm, AlignmentResult } from '@/types';

/**
 * ROI Max Peak Alignment:
 * Finds the maximum peak in the ROI window for both reference and target curves,
 * and returns the X-offset that aligns the target's peak to the reference's peak.
 */
export const roiMaxPeakAlignment: AlignmentAlgorithm = {
  name: 'ROI 最大峰对齐',
  align(refData, targetData, roiStart, roiEnd) {
    const refPeak = findMaxPeakInROI(refData, roiStart, roiEnd);
    const targetPeak = findMaxPeakInROI(targetData, roiStart, roiEnd);

    if (!refPeak || !targetPeak) {
      return { xOffset: 0, correlationScore: 0 };
    }

    const xOffset = refPeak.x - targetPeak.x;
    return { xOffset, correlationScore: 1 };
  },
};

function findMaxPeakInROI(
  data: [number, number][],
  roiStart: number,
  roiEnd: number,
): { x: number; y: number } | null {
  let maxY = -Infinity;
  let maxX = 0;

  for (const [x, y] of data) {
    if (x >= roiStart && x <= roiEnd && y > maxY) {
      maxY = y;
      maxX = x;
    }
  }

  return maxY === -Infinity ? null : { x: maxX, y: maxY };
}

/**
 * Cross-correlation alignment result.
 * Computed in a Web Worker for performance.
 */
export function crossCorrelate(
  refData: [number, number][],
  targetData: [number, number][],
  roiStart: number,
  roiEnd: number,
  searchRange: number = 120,
): AlignmentResult {
  const refROI = extractROI(refData, roiStart, roiEnd);
  const targetROI = extractROI(targetData, roiStart, roiEnd);

  if (refROI.length === 0 || targetROI.length === 0) {
    return { xOffset: 0, correlationScore: 0 };
  }

  // Normalize both signals
  const refNorm = normalize(refROI);
  const targetNorm = normalize(targetROI);

  // Cross-correlation over search range
  let bestOffset = 0;
  let bestScore = -Infinity;

  for (let offset = -searchRange; offset <= searchRange; offset++) {
    const score = correlationScore(refNorm, targetNorm, offset);
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  // Convert index offset to X-axis offset
  // Assuming uniform sampling, compute the per-step X delta
  const xStep = (refROI[refROI.length - 1][0] - refROI[0][0]) / (refROI.length - 1);
  return { xOffset: bestOffset * xStep, correlationScore: bestScore };
}

function extractROI(
  data: [number, number][],
  roiStart: number,
  roiEnd: number,
): [number, number][] {
  return data.filter(([x]) => x >= roiStart && x <= roiEnd);
}

function normalize(data: [number, number][]): number[] {
  const values = data.map(([, y]) => y);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
  return values.map((v) => (std === 0 ? 0 : (v - mean) / std));
}

function correlationScore(
  ref: number[],
  target: number[],
  offset: number,
): number {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < ref.length; i++) {
    const targetIdx = i + offset;
    if (targetIdx >= 0 && targetIdx < target.length) {
      sum += ref[i] * target[targetIdx];
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}