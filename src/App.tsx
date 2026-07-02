import { useEffect } from 'react';
import { ThreeColumnLayout } from '@/components/layout';
import { initPersistence, restoreWorkspace } from '@/persistence';
import { useCurveStore } from '@/store';

export default function App() {
  const curves = useCurveStore((s) => s.curves);

  // Initialize persistence and restore workspace on mount
  useEffect(() => {
    initPersistence();
    restoreWorkspace();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const store = useCurveStore as unknown as {
          temporal: { undo: () => void };
        };
        store.temporal?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        const store = useCurveStore as unknown as {
          temporal: { redo: () => void };
        };
        store.temporal?.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [curves]);

  return <ThreeColumnLayout />;
}