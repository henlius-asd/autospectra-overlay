/** Point label annotation — a single X position with a label above the top curve */
export interface PointLabel {
  id: string;
  /** Data coordinate X */
  x: number;
  /** Pixel offset from the top curve's pixel Y at this label's X position (negative = above) */
  yOffset: number;
  /** Display label text */
  label: string;
}