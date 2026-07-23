import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restoreWorkspace } from '../index';
import { useUiStore } from '@/store';
import { DEFAULT_LINE_STYLE } from '@/types';

// Mock localforage so restoreWorkspace reads controlled snapshots.
// vi.hoisted keeps the in-memory map available to the hoisted mock factory.
const stores = vi.hoisted(() => {
  const memory: Record<string, unknown> = {};
  return {
    memory,
    localforageMock: {
      createInstance: () => ({
        getItem: async (key: string) => memory[key],
        setItem: async (key: string, val: unknown) => {
          memory[key] = val;
        },
        removeItem: async (key: string) => {
          delete memory[key];
        },
      }),
    },
  };
});

vi.mock('localforage', () => ({ default: stores.localforageMock }));

describe('restoreWorkspace — UI lineStyle hydration (regression for controlled/uncontrolled warning)', () => {
  beforeEach(() => {
    // Reset store lineStyle to defaults.
    useUiStore.setState({
      lineStyle: { width: 1.5, type: 'solid', color: '#000000' },
    });
    // Clear in-memory persistence store.
    for (const k of Object.keys(stores.memory)) delete stores.memory[k];
  });

  it('backfills missing width/type when persisted lineStyle is partial', async () => {
    // Persisted UI snapshot from an older schema: lineStyle has only color.
    stores.memory['current_workspace'] = {
      version: 3,
      curves: { c1: { name: 'test', data: [[0, 1]] } },
      savedAt: Date.now(),
    };
    stores.memory['current_ui'] = {
      lineStyle: { color: '#ff0000' }, // missing width + type
    };

    await restoreWorkspace();

    const ls = useUiStore.getState().lineStyle;
    // BUG (line 146): `uiSnapshot.lineStyle ?? DEFAULT` only falls back when the
    // persisted value is null/undefined. A PARTIAL persisted lineStyle is used
    // as-is (cast via `as unknown as LineStyle`), so `width` is undefined →
    // CurveStylePanel renders <input type="range" value={undefined}>, switching
    // the input to uncontrolled and tripping React's controlled/uncontrolled
    // warning the next time a defined value arrives.
    expect(ls.width).toBeTypeOf('number');
    expect(ls.type).toBe('solid');
    expect(ls.color).toBe('#ff0000');
  });

  it('backfills missing fontSize/fontFamily when persisted labelStyle is partial', async () => {
    stores.memory['current_workspace'] = {
      version: 3,
      curves: { c1: { name: 'test', data: [[0, 1]] } },
      savedAt: Date.now(),
    };
    stores.memory['current_ui'] = {
      labelStyle: { color: '#9a9a9a' }, // missing fontSize, fontFamily, fontWeight, backgroundColor
    };

    await restoreWorkspace();

    const ls = useUiStore.getState().labelStyle;
    // Same root cause as lineStyle: line 148 used `as unknown as LabelStyle`
    // on a partial persisted object, leaving fontSize undefined.
    expect(ls.fontSize).toBeTypeOf('number');
    expect(ls.fontFamily).toBe('sans-serif');
    expect(ls.fontWeight).toBe('normal');
    expect(ls.backgroundColor).toBe('#ffffff');
    expect(ls.color).toBe('#9a9a9a');
  });

  it('rejects wrong-typed persisted lineStyle fields (null width, bogus type, non-string color)', async () => {
    stores.memory['current_workspace'] = {
      version: 3,
      curves: { c1: { name: 'test', data: [[0, 1]] } },
      savedAt: Date.now(),
    };
    stores.memory['current_ui'] = {
      lineStyle: { width: null, type: 'bogus', color: 123 },
    };

    await restoreWorkspace();

    const ls = useUiStore.getState().lineStyle;
    // Wrong-typed persisted values must NOT leak through: a `width: null`
    // would otherwise reproduce the controlled/uncontrolled warning this
    // fix targets, and a non-string `color` would throw in `toHexColor`.
    expect(ls.width).toBe(DEFAULT_LINE_STYLE.width);
    expect(ls.type).toBe(DEFAULT_LINE_STYLE.type);
    expect(ls.color).toBe(DEFAULT_LINE_STYLE.color);
  });
});
