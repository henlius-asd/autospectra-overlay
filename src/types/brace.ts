import type { LabelStyle } from './curve';

/** Horizontal brace annotation on the X-axis */
export interface BraceAnnotation {
  id: string;
  type: 'horizontal';
  startX: number;
  endX: number;
  label: string;
  /** Per-label style override (merges with default labelStyle) */
  labelStyle?: Partial<LabelStyle>;
}