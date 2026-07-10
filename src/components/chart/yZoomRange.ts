export function normalizeYZoomRange(
  lo: number,
  hi: number,
): [number, number] {
  const min = Math.min(lo, hi);
  const max = Math.max(lo, hi);
  return [min, max];
}