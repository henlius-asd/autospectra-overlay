/**
 * Design-token mirror for non-Tailwind consumers (ECharts options, canvas
 * overlays). Values MUST stay in sync with the CSS variables in
 * src/index.css (:root) — the CSS layer is the source of truth; this module
 * mirrors it because ECharts needs concrete color strings at option-build
 * time rather than computed styles at paint time.
 */

export const themeFontFamily =
  "'Inter Variable', Inter, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif";

export const themeColors = {
  canvas: '#ffffff',
  surface: '#fafafa',
  surfaceHover: '#f4f4f5',
  surfaceActive: '#e4e4e7',
  ink: '#27272a',
  inkMuted: '#52525b',
  inkFaint: '#a1a1aa',
  line: '#e4e4e7',
  lineStrong: '#d4d4d8',
  accent: '#3b82f6',
  accentStrong: '#2563eb',
  accentSubtle: '#eff6ff',
  accentInk: '#1d4ed8',
  danger: '#dc2626',
  dangerSubtle: '#fee2e2',
  dangerInk: '#b91c1c',
  success: '#16a34a',
} as const;
