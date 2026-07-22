import type { LabelStyle } from './curve';

/** Horizontal brace annotation on the X-axis */
export interface BraceAnnotation {
  id: string;
  type: 'horizontal';
  startX: number;
  endX: number;
  label: string;
  /** Pixel offset from the default braceY (top curve peak). Positive = move down toward the curves. Free vertical positioning. */
  yOffset?: number;
  /** Per-label style override (merges with default labelStyle) */
  labelStyle?: Partial<LabelStyle>;
}