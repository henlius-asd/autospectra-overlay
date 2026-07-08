/** Curve data point: [time, value] */
export type DataPoint = [number, number];

/** A single curve (one column/channel within a parsed file) */
export interface CurveData {
  name: string;
  data: DataPoint[];
  /** Display name for chart legend and list (editable by user). Falls back to `name` if not set. */
  displayName?: string;
  /** Optional custom color for the curve (CSS color string). Falls back to ECharts auto-assigned color if not set. */
  color?: string;
  /** Key-value metadata parsed from the file header (e.g., Waters Empower ARW format) */
  metadata?: Record<string, string>;
}

/** A parsed file, potentially containing multiple curves */
export interface ParsedFile {
  id: string;
  name: string;
  /** Key-value metadata parsed from the file header (e.g., Waters Empower ARW format) */
  metadata?: Record<string, string>;
  curves: CurveData[];
}