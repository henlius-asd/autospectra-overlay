import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  isBaseline: boolean;
  onSetBaseline: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  isBaseline,
  onSetBaseline,
  onDelete,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 160);
  const adjustedY = Math.min(y, window.innerHeight - 80);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface-raised border border-line rounded-lg shadow-overlay py-1 min-w-[140px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <button
        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover ${
          isBaseline ? 'text-line-strong cursor-not-allowed' : 'text-ink'
        }`}
        disabled={isBaseline}
        onClick={() => {
          if (!isBaseline) {
            onSetBaseline();
            onClose();
          }
        }}
      >
        {isBaseline ? '★ 已是基准线' : '设为对齐基准线'}
      </button>
      <button
        className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger-subtle"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        删除曲线
      </button>
    </div>
  );
}