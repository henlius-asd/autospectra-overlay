import { useState, useEffect, useRef, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useUiStore } from '@/store';
import type { InteractionMode } from '@/types';

const HUD_STORAGE_KEY = 'hasSeenShortcuts';

const SHORTCUTS = [
  { key: '空格', desc: '临时平移' },
  { key: 'Ctrl+Z', desc: '撤销' },
  { key: 'Ctrl+Y', desc: '重做' },
  { key: 'Esc', desc: '回到默认工具' },
] as const;

const TOOL_HINTS: Record<InteractionMode, { name: string; hint: string }> = {
  select:      { name: '一般选中', hint: '点击选中曲线，拖拽平移画布' },
  brush:       { name: '框选放大', hint: '拖拽框选矩形区域' },
  brace:       { name: '区间标签', hint: '拖拽选择区间范围' },
  pointLabel:  { name: '点标签',   hint: '点击图表放置标签' },
  move:        { name: '手动移动', hint: '拖拽移动选中曲线' },
  zoomGlobal:  { name: '全局缩放', hint: '滚轮缩放所有曲线，双击复位' },
  zoomCurve:   { name: '单曲线缩放', hint: '点击选中曲线，滚轮缩放，双击复位' },
};

export default function HudShortcuts() {
  const interactionMode = useUiStore((s) => s.interactionMode);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 12, y: 12 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    const seen = localStorage.getItem(HUD_STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    localStorage.setItem(HUD_STORAGE_KEY, 'true');
  }, []);

  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const toolHint = TOOL_HINTS[interactionMode];

  return (
    <>
      {visible && (
        <div
          className="absolute z-40 bg-ink/85 text-white rounded-lg p-3 text-xs select-none"
          style={{ left: pos.x, top: pos.y, minWidth: 220 }}
        >
          <div
            className="flex items-center justify-between mb-2 cursor-move"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <span className="font-semibold text-xs tracking-wide">快捷键</span>
            <button
              onClick={handleClose}
              className="text-ink-faint hover:text-white text-sm leading-none px-1"
            >
              ×
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex justify-between py-0.5">
                  <kbd className="text-ink-faint font-mono">{s.key}</kbd>
                  <span className="text-white/70">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex-1">
              <div className="text-ink-faint mb-1 text-xs">当前工具</div>
              <div className="font-semibold text-xs">{toolHint.name}</div>
              <div className="text-white/70 mt-0.5">{toolHint.hint}</div>
            </div>
          </div>
        </div>
      )}
      {!visible && (
        <button
          onClick={handleOpen}
          className="absolute top-2 right-2 z-40 w-6 h-6 rounded-full bg-surface-active/80 hover:bg-line-strong text-ink-muted text-xs flex items-center justify-center"
          title="快捷键帮助"
        >
          ?
        </button>
      )}
    </>
  );
}