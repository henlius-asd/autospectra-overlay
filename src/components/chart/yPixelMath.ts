export interface YPixelFrame {
  yMin: number;
  yMax: number;
  gridTop: number;
  gridBottom: number;
  chartHeight: number;
}

export function yToPixel(yVal: number, f: YPixelFrame): number {
  const range = f.yMax - f.yMin || 1;
  const plotH = f.chartHeight - f.gridTop - f.gridBottom;
  return f.gridTop + ((f.yMax - yVal) / range) * plotH;
}

export function pixelToY(py: number, f: YPixelFrame): number {
  if (f.yMax === f.yMin) return f.yMax;
  const range = f.yMax - f.yMin;
  const plotH = f.chartHeight - f.gridTop - f.gridBottom || 1;
  return f.yMax - ((py - f.gridTop) / plotH) * range;
}