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
  /** String tags parsed from the file header (one per line) */
  tags?: string[];
  curves: CurveData[];
}