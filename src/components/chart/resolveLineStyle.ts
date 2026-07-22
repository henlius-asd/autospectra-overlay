import type { LineStyle, LineType } from '@/types';

/**
 * Resolve a curve's effective line style by merging its per-curve override
 * with the global default. Fields present in `override` win; absent fields
 * fall back to `defaultStyle`.
 */
export function resolveLineStyle(
  override: Partial<LineStyle> | undefined,
  defaultStyle: LineStyle,
): LineStyle {
  if (!override) return defaultStyle;
  return { ...defaultStyle, ...override };
}

/**
 * Map a LineType to the pptxgenjs `line.dashType` value used by PPTX export.
 * `solid` maps to `undefined` (omit dashType so pptxgenjs draws a solid line,
 * matching ECharts default). `dashed` -> 'dash', `dotted` -> 'dot'.
 */
export function mapLineTypeToPptxDash(
  type: LineType,
): 'solid' | 'dash' | 'dot' | undefined {
  switch (type) {
    case 'dashed':
      return 'dash';
    case 'dotted':
      return 'dot';
    case 'solid':
    default:
      return undefined;
  }
}
