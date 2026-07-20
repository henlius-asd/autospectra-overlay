import { useEffect } from 'react';
import { useUiStore } from '@/store';
import { MODE_SHORTCUTS } from '@/lib/shortcuts';
import type { InteractionMode } from '@/types';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable;
}

/** Match a keyboard event against a shortcut definition. */
function matchesShortcut(e: KeyboardEvent, mode: InteractionMode): boolean {
  const sc = MODE_SHORTCUTS[mode];
  if (!sc) return false;
  if (sc.shift && !e.shiftKey) return false;
  if (!sc.shift && e.shiftKey) return false;
  return e.key.toLowerCase() === sc.key.toLowerCase();
}

export function useGlobalKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const { interactionMode, setInteractionMode } = useUiStore.getState();

      if (e.code === 'Space') {
        if (interactionMode !== 'select') {
          e.preventDefault();
          useUiStore.getState().setSpaceHeld(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (interactionMode !== 'select') {
          setInteractionMode('select');
        }
        return;
      }

      // Mode shortcuts (B/Shift+B/P/M/G/C/V) — skip browser-native chords
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const modes = Object.keys(MODE_SHORTCUTS) as InteractionMode[];
      for (const mode of modes) {
        if (matchesShortcut(e, mode)) {
          e.preventDefault();
          // Same toggle semantics as toolbar: click active mode → select
          setInteractionMode(interactionMode === mode ? 'select' : mode);
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        useUiStore.getState().setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
