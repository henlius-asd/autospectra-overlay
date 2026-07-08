import { useEffect, useRef, useCallback, useState } from 'react';

const PRESET_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf', '#000000',
];

interface ColorPanelProps {
  color: string;
  colorHistory: string[];
  triggerRect: DOMRect;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPanel({
  color,
  colorHistory,
  triggerRect,
  onSelect,
  onClose,
}: ColorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [pendingColor, setPendingColor] = useState<string | null>(null);

  const handleSelect = useCallback(
    (c: string) => {
      onSelect(c);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleConfirm = useCallback(() => {
    if (pendingColor) {
      onSelect(pendingColor);
    }
    onClose();
  }, [pendingColor, onSelect, onClose]);

  const handleCustomClick = useCallback(() => {
    customInputRef.current?.click();
  }, []);

  useEffect(() => {
    const input = customInputRef.current;
    if (!input) return;
    const onChange = () => {
      if (input.value) {
        setPendingColor(input.value);
      }
    };
    input.addEventListener('change', onChange);
    return () => input.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const panelHeight = 220;
  const top = spaceBelow >= panelHeight + 8
    ? triggerRect.bottom + 4
    : triggerRect.top - panelHeight - 4;
  const left = Math.min(triggerRect.left, window.innerWidth - 240);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-56"
      style={{ top, left }}
    >
      <button
        onClick={onClose}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs leading-none"
        title="关闭"
      >
        ✕
      </button>

      <div className="text-xs font-medium text-gray-500 mb-2">预设颜色</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handleSelect(c)}
            className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
              c === color ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {colorHistory.length > 0 && (
        <>
          <div className="text-xs font-medium text-gray-500 mb-2">最近使用</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {colorHistory.map((c) => (
              <button
                key={c}
                onClick={() => handleSelect(c)}
                className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                  c === color ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={handleCustomClick}
          className="flex-1 text-xs text-blue-500 hover:text-blue-700 py-1 border border-dashed border-gray-300 rounded hover:border-blue-300"
        >
          自定义...
        </button>
        {pendingColor && (
          <span
            className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: pendingColor }}
            title="待确认"
          />
        )}
      </div>
      <input
        ref={customInputRef}
        type="color"
        className="hidden"
        defaultValue={color}
      />

      <div className="flex gap-2 mt-1">
        <button
          onClick={onClose}
          className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1 border border-gray-200 rounded hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!pendingColor}
          className={`flex-1 text-xs py-1 rounded ${
            pendingColor
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          确认
        </button>
      </div>
    </div>
  );
}