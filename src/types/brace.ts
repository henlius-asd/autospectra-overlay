import type { LabelStyle } from './curve';

/** Horizontal brace annotation on the X-axis */
export interface BraceAnnotation {
  id: string;
  type: 'horizontal';
  startX: number;
  endX: number;
  label: string;
  /** Absolute data Y of the brace baseline (horizontal main line). Rendered via
   * convertYToPixel(brace.y). Aligned with PointLabel.y reference frame so the
   * brace rides the same axis transform as the curve data and point labels. */
  y: number;
  /** LEGACY (transitional): pixel offset from the default braceY (top curve
   * peak), carried only for v4→v5 migration. Stripped after first-render
   * migration converts it to `y`. Positive = move down toward the curves. */
  yOffset?: number;
  /** Per-label style override (merges with default labelStyle) */
  labelStyle?: Partial<LabelStyle>;
}