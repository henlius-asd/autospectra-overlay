import type { LabelStyle } from '@/types';

export function resolveLabelStyle(
  override: Partial<LabelStyle> | undefined,
  defaultStyle: LabelStyle,
): LabelStyle {
  if (!override) return defaultStyle;
  return { ...defaultStyle, ...override };
}