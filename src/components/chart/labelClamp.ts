// src/components/chart/labelClamp.ts

/** Conservative text-width estimate (no DOM measurement needed). */
export function estimateTextWidth(label: string, fontSize: number): number {
  return label.length * fontSize * 0.55;
}

/** Clamp a label's X so its centered text stays within the grid horizontally. */
export function clampLabelX(
  px: number,
  textW: number,
  gridLeft: number,
  gridRight: number,
  chartWidth: number,
): number {
  const halfW = textW / 2;
  const minPx = gridLeft + halfW;
  const maxPx = chartWidth - gridRight - halfW;
  if (maxPx < minPx) return (minPx + maxPx) / 2; // degenerate: center
  return Math.min(Math.max(px, minPx), maxPx);
}

/** Clamp a label's Y so its text stays within [gridTop, plotBottom] vertically. */
export function clampLabelY(
  py: number,
  labelHalfH: number,
  gridTop: number,
  plotBottom: number,
): number {
  const minPy = gridTop + labelHalfH;
  const maxPy = plotBottom - labelHalfH;
  if (maxPy < minPy) return (minPy + maxPy) / 2;
  return Math.min(Math.max(py, minPy), maxPy);
}