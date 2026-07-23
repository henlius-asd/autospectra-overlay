import type { LineStyle, LineType } from '@/types';

/** Like `Partial<T>`, but each field may also be explicitly `null`. Overrides
 * can arrive from untrusted sources (JSON workspace import, v2->v3 migration)
 * where a field may be `null`; the resolver treats null as "use the default". */
type NullablePartial<T> = { [K in keyof T]?: T[K] | null };

/**
 * Resolve a curve's effective line style by merging its per-curve override
 * with the global default. Fields present in `override` win; absent fields
 * fall back to `defaultStyle`.
 *
 * An explicit `null` in the override is treated as absent (not as "set to
 * null"): it falls back to the default. This restores the pre-cascade
 * `curve.color || '#000000'` guard and prevents a null color — which can
 * reach the store via an unsanitized JSON workspace import or a v2->v3
 * migration of a null top-level color — from clobbering the default and
 * crashing the PPTX export at `resolved.color.replace('#', '')`.
 * Falsy-but-defined values (e.g. `width: 0`) are preserved.
 */
export function resolveLineStyle(
  override: NullablePartial<LineStyle> | undefined,
  defaultStyle: LineStyle,
): LineStyle {
  if (!override) return defaultStyle;
  const picked: Partial<LineStyle> = {};
  if (override.width != null) picked.width = override.width;
  if (override.type != null) picked.type = override.type;
  if (override.color != null) picked.color = override.color;
  return { ...defaultStyle, ...picked };
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
