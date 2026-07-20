import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { themeColors, themeFontFamily } from '@/lib/theme';

describe('theme tokens (ECharts mirror of CSS design tokens)', () => {
  it('exports a complete token set', () => {
    const expectedKeys = [
      'canvas', 'surface', 'surfaceHover', 'surfaceActive',
      'ink', 'inkMuted', 'inkFaint',
      'line', 'lineStrong',
      'accent', 'accentStrong', 'accentSubtle', 'accentInk',
      'danger', 'dangerSubtle', 'dangerInk',
      'success',
    ];
    for (const key of expectedKeys) {
      expect(themeColors, `missing token: ${key}`).toHaveProperty(key);
    }
  });

  it('all color values are valid 6-digit hex strings', () => {
    for (const [key, value] of Object.entries(themeColors)) {
      expect(value, `token ${key} must be #rrggbb`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('font family includes Inter with CJK fallbacks', () => {
    expect(themeFontFamily).toContain('Inter');
    expect(themeFontFamily).toContain('PingFang SC');
    expect(themeFontFamily).toContain('Microsoft YaHei');
  });

  it('stays in sync with the CSS variable layer in index.css', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const cssVar = (name: string) => {
      const m = css.match(new RegExp(`--${name}:\\s*([0-9]+)\\s+([0-9]+)\\s+([0-9]+)`));
      if (!m) throw new Error(`CSS variable --${name} not found in index.css`);
      const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
      return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
    };
    // camelCase token -> kebab-case CSS variable
    const pairs: Array<[keyof typeof themeColors, string]> = [
      ['canvas', 'canvas'],
      ['surface', 'surface'],
      ['surfaceHover', 'surface-hover'],
      ['surfaceActive', 'surface-active'],
      ['ink', 'ink'],
      ['inkMuted', 'ink-muted'],
      ['inkFaint', 'ink-faint'],
      ['line', 'line'],
      ['lineStrong', 'line-strong'],
      ['accent', 'accent'],
      ['accentStrong', 'accent-strong'],
      ['accentSubtle', 'accent-subtle'],
      ['accentInk', 'accent-ink'],
      ['danger', 'danger'],
      ['dangerSubtle', 'danger-subtle'],
      ['dangerInk', 'danger-ink'],
      ['success', 'success'],
    ];
    for (const [token, varName] of pairs) {
      expect(themeColors[token], `theme.${token} must equal --${varName}`).toBe(cssVar(varName));
    }
  });
});
