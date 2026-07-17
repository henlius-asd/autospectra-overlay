import { useEffect } from 'react';
import { useUiStore } from '@/store';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable;
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