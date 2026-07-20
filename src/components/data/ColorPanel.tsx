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
  onChange: (color: string) => void;
  onConfirm: (color: string) => void;
  onClose: () => void;
}

export default function ColorPanel({
  color,
  colorHistory,
  triggerRect,
  onChange,
  onConfirm,
  onClose,
}: ColorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const originalColor = useRef(color);
  const colorPickerOpen = useRef(false);
  const [previewColor, setPreviewColor] = useState(color);

  const handlePreview = useCallback(
    (c: string) => {
      setPreviewColor(c);
      onChange(c);
    },
    [onChange],
  );

  const handleCancel = useCallback(() => {
    onChange(originalColor.current);
    onClose();
  }, [onChange, onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm(previewColor);
    onClose();
  }, [previewColor, onConfirm, onClose]);

  useEffect(() => {
    const input = customInputRef.current;
    if (!input) return;
    const onChangeEvent = () => {
      colorPickerOpen.current = false;
      if (input.value) {
        handlePreview(input.value);
      }
    };
    input.addEventListener('change', onChangeEvent);
    return () => input.removeEventListener('change', onChangeEvent);
  }, [handlePreview]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (colorPickerOpen.current) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handleCancel]);

  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const panelHeight = 220;
  const top = spaceBelow >= panelHeight + 8
    ? triggerRect.bottom + 4
    : triggerRect.top - panelHeight - 4;
  const left = Math.min(triggerRect.left, window.innerWidth - 240);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-surface-raised rounded-lg shadow-overlay border border-line p-3 w-56"
      style={{ top, left }}
    >
      <button
        onClick={handleCancel}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-ink-faint hover:text-ink-muted hover:bg-surface-hover rounded-md text-xs leading-none"
        title="关闭"
      >
        ✕
      </button>

      <div className="text-xs font-medium text-ink-muted mb-2">预设颜色</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handlePreview(c)}
            className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
              c === previewColor ? 'border-accent ring-1 ring-accent/50' : 'border-line-strong'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {colorHistory.length > 0 && (
        <>
          <div className="text-xs font-medium text-ink-muted mb-2">最近使用</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {colorHistory.map((c) => (
              <button
                key={c}
                onClick={() => handlePreview(c)}
                className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                  c === previewColor ? 'border-accent ring-1 ring-accent/50' : 'border-line-strong'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </>
      )}

      <div className="text-xs font-medium text-ink-muted mb-1.5">当前颜色</div>
      <button
        onClick={() => { colorPickerOpen.current = true; customInputRef.current?.click(); }}
        className="w-full h-8 rounded-md border border-line-strong mb-2 relative overflow-hidden text-xs text-white font-medium hover:opacity-90 transition-opacity"
        style={{ backgroundColor: previewColor }}
      >
        自定义
      </button>
      <input
        ref={customInputRef}
        type="color"
        className="hidden"
        defaultValue={color}
      />

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleCancel}
          className="flex-1 text-xs text-ink-muted hover:text-ink py-1 border border-line rounded-md hover:bg-surface"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 text-xs bg-accent text-white py-1 rounded-md hover:bg-accent-strong"
        >
          确认
        </button>
      </div>
    </div>
  );
}