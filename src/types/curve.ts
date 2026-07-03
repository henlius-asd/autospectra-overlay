/** Curve data point: [time, value] */
export type DataPoint = [number, number];

/** A single curve (one column/channel within a parsed file) */
export interface CurveData {
  name: string;
  data: DataPoint[];
}

/** A parsed file, potentially containing multiple curves */
export interface ParsedFile {
  id: string;
  name: string;
  /** Key-value metadata parsed from the file header (e.g., Waters Empower ARW format) */
  metadata?: Record<string, string>;
  curves: CurveData[];
}