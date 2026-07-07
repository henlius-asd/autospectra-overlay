export const BRACE_COLOR = '#555555';

/**
 * Generate SVG path for an I-beam bracket style annotation.
 *
 * Visual:
 *   ┌──────────────────────┐    ← y - tickH
 *   │      label area      │
 *   └──────────────────────┘    ← y
 *   │                        │  ← ticks at start/end
 *
 * @param startX - left pixel X
 * @param endX - right pixel X
 * @param y - baseline Y pixel (bottom of the bracket)
 */
export function bracePath(startX: number, endX: number, y: number): string {
  const tickH = 8; // vertical tick height

  // Left vertical tick
  const leftTick = `M ${startX} ${y} L ${startX} ${y - tickH}`;
  // Horizontal line
  const hLine = `M ${startX} ${y} L ${endX} ${y}`;
  // Right vertical tick
  const rightTick = `M ${endX} ${y} L ${endX} ${y - tickH}`;

  return `${leftTick} ${hLine} ${rightTick}`;
}