import { useEffect, useState } from 'react';
import { useUiStore } from '@/store';

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (toast) {
      setAnimating(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!animating && !toast) return null;

  const typeStyles: Record<string, string> = {
    error: 'bg-danger text-white',
    success: 'bg-success text-white',
    info: 'bg-accent-strong text-white',
  };

  const type = toast?.type ?? 'info';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-overlay text-sm transition-all duration-300 ${
        typeStyles[type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {toast?.message}
    </div>
  );
}