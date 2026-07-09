import type { YPixelFrame } from './yPixelMath';
import { pixelToY } from './yPixelMath';

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

const DRAG_GAIN = 1 / 200;

export function scaleByDrag(scale: number, deltaPx: number): number {
  return clampScale(scale * (1 + (-deltaPx) * DRAG_GAIN));
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