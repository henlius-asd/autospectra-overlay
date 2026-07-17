import { useEffect } from 'react';
import { ThreeColumnLayout } from '@/components/layout';
import { initPersistence, restoreWorkspace } from '@/persistence';
import { useCurveStore } from '@/store';
import { useGlobalKeyboard } from '@/hooks/useGlobalKeyboard';
import Toast from '@/components/ui/Toast';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable;
}

export default function App() {
  useGlobalKeyboard();

  // Initialize persistence and restore workspace on mount
  useEffect(() => {
    initPersistence();
    restoreWorkspace();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useCurveStore.temporal.getState().undo();
      }

      if (mod && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault();
        useCurveStore.temporal.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ThreeColumnLayout />
      <Toast />
    </>
  );
}