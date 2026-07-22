import type { LabelStyle } from './curve';

/** Point label annotation — a single X,Y position with a label */
export interface PointLabel {
  id: string;
  /** Data coordinate X */
  x: number;
  /** Data coordinate Y (absolute, independent of any curve) */
  y: number;
  /** Display label text */
  label: string;
  /** Per-label style override (merges with default labelStyle) */
  labelStyle?: Partial<LabelStyle>;
}