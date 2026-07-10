import type { YPixelFrame } from './yPixelMath';
import { pixelToY } from './yPixelMath';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10.0;

export function clampScale(s: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

const WHEEL_STEP = 1.1;

export function scaleByWheel(scale: number, deltaY: number): number {
  const factor = deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
  return clampScale(scale * factor);
}

export function computePeakNormalizeFactor(
  curve: CurveData,
  offset: CurveOffsets,
  xRange: [number, number],
  targetPeak: number,
): number {
  let peakY = -Infinity;
  for (const [x, y] of curve.data) {
    const xAdj = x + offset.xOffset;
    if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
      if (y > peakY) peakY = y;
    }
  }
  if (!isFinite(peakY) || peakY <= 0) return 1;
  return targetPeak / peakY;
}

export function offsetByDrag(
  startOffset: number,
  startPy: number,
  currentPy: number,
  frame: YPixelFrame,
): number {
  const delta = pixelToY(currentPy, frame) - pixelToY(startPy, frame);
  return startOffset + delta;
}
