export const BRACE_COLOR = '#555555';

/** Total vertical extent of the bracket (spike top to hook bottom). */
export const BRACE_HEIGHT = 14;
/** Gap between the spike top and the label text baseline. */
export const BRACE_LABEL_GAP = 6;

/** Spike height above the baseline (horizontal line). */
const SPIKE_H = BRACE_HEIGHT * 0.5;
/** Hook depth below the baseline. */
const HOOK_H = BRACE_HEIGHT * 0.5;
/** Spike width at the baseline (triangle base). */
const SPIKE_W = 2;
/** Hook corner radius (rounded). */
const HOOK_R = 3;

/**
 * Generate SVG path for a flat bracket annotation (PPT-style).
 *
 * Visual (spike points UP toward the label, hooks point DOWN toward the curves):
 *              |              ← spike tip at (mid, y - SPIKE_H)
 *   ───────────┴───────────   ← horizontal baseline at y
 *   ⌐                      ¬  ← hooks curve down to y + HOOK_H
 *
 * The path traces the centerline; stroke creates the thickness.
 *
 * @param startX - left pixel X
 * @param endX - right pixel X
 * @param y - baseline Y pixel (horizontal line, between spike and hooks)
 */
export function bracePath(startX: number, endX: number, y: number): string {
  const mid = (startX + endX) / 2;
  const spikeTop = y - SPIKE_H;
  const hookBottom = y + HOOK_H;

  return [
    `M ${startX} ${hookBottom}`,
    `Q ${startX} ${y} ${startX + HOOK_R} ${y}`,
    `L ${mid - SPIKE_W / 2} ${y}`,
    `L ${mid} ${spikeTop}`,
    `L ${mid + SPIKE_W / 2} ${y}`,
    `L ${endX - HOOK_R} ${y}`,
    `Q ${endX} ${y} ${endX} ${hookBottom}`,
  ].join(' ');
}

/**
 * Sample the bracket into a polyline for renderers that only support
 * straight segments (e.g. PPTX `custGeom`). Returns points in the same pixel
 * space as the inputs; the caller scales to its own coordinate system.
 */
export function bracePathPoints(
  startX: number,
  endX: number,
  y: number,
  samplesPerSegment = 6,
): Array<{ x: number; y: number; moveTo?: boolean }> {
  const mid = (startX + endX) / 2;
  const spikeTop = y - SPIKE_H;
  const hookBottom = y + HOOK_H;

  // Define the path as a series of segments (line or quadratic bezier)
  const segments: Array<{ type: 'L' | 'Q'; pts: [number, number][] }> = [
    { type: 'L', pts: [[startX, hookBottom]] },
    { type: 'Q', pts: [[startX, y], [startX + HOOK_R, y]] },
    { type: 'L', pts: [[mid - SPIKE_W / 2, y]] },
    { type: 'L', pts: [[mid, spikeTop]] },
    { type: 'L', pts: [[mid + SPIKE_W / 2, y]] },
    { type: 'L', pts: [[endX - HOOK_R, y]] },
    { type: 'Q', pts: [[endX, y], [endX, hookBottom]] },
  ];

  const pts: Array<{ x: number; y: number; moveTo?: boolean }> = [];
  let first = true;

  for (const seg of segments) {
    if (seg.type === 'L') {
      const [x, yv] = seg.pts[0];
      pts.push({ x, y: yv, moveTo: first });
      first = false;
    } else {
      // Quadratic bezier: sample it
      const [p1, p2] = seg.pts;
      const prev = pts.length > 0 ? pts[pts.length - 1] : null;
      const p0 = prev ? [prev.x, prev.y] : [startX, hookBottom];
      for (let i = 1; i <= samplesPerSegment; i++) {
        const t = i / samplesPerSegment;
        const mt = 1 - t;
        const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
        const yv = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
        pts.push({ x, y: yv });
      }
    }
  }

  return pts;
}
