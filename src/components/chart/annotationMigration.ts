/**
 * Shared migration util for annotation Y reference-frame migration (v4→v5).
 *
 * Both braces and point labels historically stored a pixel-space `yOffset`
 * relative to a top-curve-derived baseline. The v5 model stores an absolute
 * data Y (`BraceAnnotation.y` / `PointLabel.y`) rendered via the shared
 * `convertYToPixel`. Because pixel→data conversion requires runtime chart
 * geometry (`chartDims`, grid, visible Y range) unavailable at load time,
 * migration is deferred to first render, where this util converts the legacy
 * pixel offset to an absolute data Y using the live `convertPixelToY`.
 *
 * @param basePixel  baseline pixel Y the legacy offset was relative to.
 *                   Braces: `braceY`; point labels: `getTopCurvePixelYAtX(pl.x)`.
 * @param yOffset    legacy pixel offset.
 * @param convertPixelToY live runtime pixel→data-Y transform.
 * @returns absolute data Y equivalent to `basePixel + yOffset`.
 */
export function migrateLegacyPixelOffset(
  basePixel: number,
  yOffset: number,
  convertPixelToY: (py: number) => number,
): number {
  return convertPixelToY(basePixel + yOffset);
}
