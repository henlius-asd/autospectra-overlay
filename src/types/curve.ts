/** Label style configuration */
export interface LabelStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor: string;
}

export const DEFAULT_LABEL_STYLE: LabelStyle = {
  fontSize: 10,
  fontFamily: 'sans-serif',
  fontWeight: 'normal',
  color: '#333333',
  backgroundColor: '#ffffff',
};

/** Line type enumeration for curve stroke style. */
export type LineType = 'solid' | 'dashed' | 'dotted';

/** Curve line style. Held in full as the global default (`uiStore.lineStyle`),
 * and as a `Partial<LineStyle>` override per curve (`CurveData.lineStyle`). */
export interface LineStyle {
  width: number;
  type: LineType;
  color: string;
}

export const DEFAULT_LINE_STYLE: LineStyle = {
  width: 1.5,
  type: 'solid',
  color: '#000000',
};

/** Curve data point: [time, value] */
export type DataPoint = [number, number];

/** A single curve (one column/channel within a parsed file) */
export interface CurveData {
  name: string;
  data: DataPoint[];
  /** Display name for chart legend and list (editable by user). Falls back to `name` if not set. */
  displayName?: string;
  /** Per-curve line style override. Fields present here override the global
   * default (`uiStore.lineStyle`); absent fields fall back to the global default.
   * `undefined` (the default) means the curve fully follows the global style. */
  lineStyle?: Partial<LineStyle>;
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
  /** Warnings from ARW V2 parsing (non-two-column data rows, etc.) */
  __v2ParseWarnings?: Array<{ line: number; content: string }>;
}