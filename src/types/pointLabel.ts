import type { LabelStyle } from './curve';

/** Point label annotation — a single X,Y position with a label */
export interface PointLabel {
  id: string;
  /** Data coordinate X */
  x: number;
  /** Data coordinate Y (absolute, independent of any curve) */
  y: number;
  /** LEGACY (transitional): pixel offset relative to the top curve, carried
   * only for pre-v5 migration. Stripped after first-render migration converts
   * it to `y`. Present only on point labels loaded from v1–v3 snapshots that
   * have not yet been migrated. */
  yOffset?: number;
  /** Display label text */
  label: string;
  /** Per-label style override (merges with default labelStyle) */
  labelStyle?: Partial<LabelStyle>;
}