import type { LabelStyle } from '@/types';

/** Like `Partial<T>`, but each field may also be explicitly `null`. Overrides
 * can arrive from untrusted sources (JSON workspace import) where a field
 * may be `null`; the resolver treats null as "use the default". */
type NullablePartial<T> = { [K in keyof T]?: T[K] | null };

/**
 * Resolve a label's effective style by merging its per-label override with
 * the global default. Fields present in `override` win; absent fields fall
 * back to `defaultStyle`.
 *
 * An explicit `null` in the override is treated as absent and falls back to
 * the default (see resolveLineStyle for the rationale): braces/point-labels
 * can carry a null style field via an unsanitized JSON import, and without
 * this guard `style.color` becomes null and exportPptx/exportImage crash at
 * `style.color.replace('#', '')`. Falsy-but-defined values (e.g. `fontSize:
 * 0`) are preserved.
 */
export function resolveLabelStyle(
  override: NullablePartial<LabelStyle> | undefined,
  defaultStyle: LabelStyle,
): LabelStyle {
  if (!override) return defaultStyle;
  const picked: Partial<LabelStyle> = {};
  if (override.fontSize != null) picked.fontSize = override.fontSize;
  if (override.fontFamily != null) picked.fontFamily = override.fontFamily;
  if (override.fontWeight != null) picked.fontWeight = override.fontWeight;
  if (override.color != null) picked.color = override.color;
  return { ...defaultStyle, ...picked };
}
