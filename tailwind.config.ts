/**
 * Tailwind theme extension: semantic design tokens backed by CSS variables
 * defined in src/index.css (:root). The `rgb(var(--x) / <alpha-value>)`
 * pattern keeps opacity modifiers (e.g. `bg-surface/80`) working and lets a
 * future dark theme swap token values without touching components.
 * Keep src/lib/theme.ts (ECharts) in sync with these values.
 */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: withAlpha('--canvas'),
        surface: withAlpha('--surface'),
        'surface-raised': withAlpha('--surface-raised'),
        'surface-hover': withAlpha('--surface-hover'),
        'surface-active': withAlpha('--surface-active'),
        ink: withAlpha('--ink'),
        'ink-muted': withAlpha('--ink-muted'),
        'ink-faint': withAlpha('--ink-faint'),
        line: withAlpha('--line'),
        'line-strong': withAlpha('--line-strong'),
        accent: withAlpha('--accent'),
        'accent-strong': withAlpha('--accent-strong'),
        'accent-subtle': withAlpha('--accent-subtle'),
        'accent-ink': withAlpha('--accent-ink'),
        danger: withAlpha('--danger'),
        'danger-subtle': withAlpha('--danger-subtle'),
        'danger-ink': withAlpha('--danger-ink'),
        success: withAlpha('--success'),
      },
      boxShadow: {
        overlay:
          '0 4px 16px rgb(0 0 0 / 0.12), 0 1px 4px rgb(0 0 0 / 0.08)',
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          'sans-serif',
        ],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'accordion-up': 'accordion-up 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
