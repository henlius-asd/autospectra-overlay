export const BRACE_COLOR = '#555555';

/**
 * Generate SVG path for an I-beam bracket style annotation.
 *
 * Visual (ticks point DOWN toward the curves below):
 *   ────────────────────────    ← y (horizontal baseline)
 *   │                        │  ← ticks go down to y + tickH
 *         label above
 *
 * @param startX - left pixel X
 * @param endX - right pixel X
 * @param y - baseline Y pixel (top of the bracket, above the curves)
 */
export function bracePath(startX: number, endX: number, y: number): string {
  const tickH = 8; // vertical tick height (downward)

  // Left vertical tick (pointing down)
  const leftTick = `M ${startX} ${y} L ${startX} ${y + tickH}`;
  // Horizontal line
  const hLine = `M ${startX} ${y} L ${endX} ${y}`;
  // Right vertical tick (pointing down)
  const rightTick = `M ${endX} ${y} L ${endX} ${y + tickH}`;

  return `${leftTick} ${hLine} ${rightTick}`;
}