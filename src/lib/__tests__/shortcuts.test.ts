import { describe, it, expect } from 'vitest';
import { MODE_SHORTCUTS } from '@/lib/shortcuts';
import type { InteractionMode } from '@/types';

describe('MODE_SHORTCUTS', () => {
  const allModes: InteractionMode[] = [
    'select', 'brush', 'brace', 'pointLabel', 'move', 'zoomGlobal', 'zoomCurve',
  ];

  it('defines a shortcut for every interaction mode', () => {
    for (const mode of allModes) {
      expect(MODE_SHORTCUTS[mode], `missing shortcut for mode: ${mode}`).toBeDefined();
    }
  });

  it('no two modes share the same key combination', () => {
    const seen = new Map<string, string>();
    for (const [mode, sc] of Object.entries(MODE_SHORTCUTS)) {
      const combo = `${sc.shift ? 'shift+' : ''}${sc.key.toLowerCase()}`;
      expect(seen.has(combo), `duplicate shortcut "${combo}" for modes "${seen.get(combo)}" and "${mode}"`).toBe(false);
      seen.set(combo, mode);
    }
  });

  it('display strings are non-empty', () => {
    for (const [mode, sc] of Object.entries(MODE_SHORTCUTS)) {
      expect(sc.display.length, `empty display for mode: ${mode}`).toBeGreaterThan(0);
    }
  });
});
