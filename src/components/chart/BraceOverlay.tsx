import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import type { BraceAnnotation } from '@/types';
import { bracePath, BRACE_COLOR, BRACE_HEIGHT, BRACE_LABEL_GAP } from './bracePath';
import { resolveLabelStyle } from './resolveLabelStyle';

interface BraceOverlayProps {
  width: number;
  height: number;
  convertXToPixel: (xVal: number) => number;
  convertPixelToX: (px: number) => number;
  xRange: [number, number];
  gridTop: number;
  braceY: number;
}

export default function BraceOverlay({
  width,
  height,
  convertXToPixel,
  convertPixelToX,
  xRange,
  braceY,
}: BraceOverlayProps) {
  const braces = useCurveStore((s) => s.braces);
  const updateBrace = useCurveStore((s) => s.updateBrace);
  const bracePlacementMode = useUiStore((s) => s.interactionMode) === 'brace';
  const setInteractionMode = useUiStore((s) => s.setInteractionMode);
  const labelStyle = useUiStore((s) => s.labelStyle);

  const [editingBrace, setEditingBrace] = useState<BraceAnnotation | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [placementY, setPlacementY] = useState<number | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startClientX: number;
    startClientY: number;
    origStartX: number;
    origEndX: number;
    origYOffset: number;
  } | null>(null);
  const dragMovedRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!bracePlacementMode) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setDragStart(px);
      setDragEnd(px);
      setPlacementY(py);
      svgRef.current?.setPointerCapture(e.pointerId);
      e.stopPropagation();
    },
    [bracePlacementMode],
  );

  const handleBracePointerDown = useCallback(
    (e: ReactPointerEvent, brace: BraceAnnotation) => {
      if (bracePlacementMode) return;
      e.stopPropagation();
      dragMovedRef.current = false;
      setDragging({
        id: brace.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origStartX: brace.startX,
        origEndX: brace.endX,
        origYOffset: brace.yOffset ?? 0,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [bracePlacementMode],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!bracePlacementMode && dragging) {
        const dx = e.clientX - dragging.startClientX;
        const dy = e.clientY - dragging.startClientY;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return; // below threshold: treat as click, don't move
        dragMovedRef.current = true;
        const origStartPx = convertXToPixel(dragging.origStartX);
        const newStartDataX = convertPixelToX(origStartPx + dx);
        const delta = newStartDataX - dragging.origStartX;
        updateBrace(dragging.id, {
          startX: dragging.origStartX + delta,
          endX: dragging.origEndX + delta,
          yOffset: dragging.origYOffset + dy,
        });
        e.stopPropagation();
        return;
      }
      if (!bracePlacementMode || dragStart === null) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      setDragEnd(px);
      e.stopPropagation();
    },
    [bracePlacementMode, dragging, dragStart, convertXToPixel, convertPixelToX, updateBrace],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (dragging) {
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        setDragging(null);
        return;
      }
      svgRef.current?.releasePointerCapture(e.pointerId);
      if (!bracePlacementMode || dragStart === null || dragEnd === null) {
        setDragStart(null);
        setDragEnd(null);
        setPlacementY(null);
        return;
      }
      const startX = Math.min(dragStart, dragEnd);
      const endX = Math.max(dragStart, dragEnd);
      if (endX - startX < 5) {
        setDragStart(null);
        setDragEnd(null);
        setPlacementY(null);
        return;
      }
      const dataStartX = convertPixelToX(startX);
      const dataEndX = convertPixelToX(endX);

      const newBrace: BraceAnnotation = {
        id: `brace_${Date.now()}`,
        type: 'horizontal',
        startX: dataStartX,
        endX: dataEndX,
        label: '',
        yOffset: placementY != null ? placementY - braceY : 0,
      };
      setEditingBrace(newBrace);
      setLabelInput('');
      setDragStart(null);
      setDragEnd(null);
      setPlacementY(null);
      setInteractionMode('select');
    },
    [bracePlacementMode, dragging, dragStart, dragEnd, placementY, convertPixelToX, braceY, setInteractionMode],
  );

  // Cancel placement on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bracePlacementMode) {
        setDragStart(null);
        setDragEnd(null);
        setPlacementY(null);
        setInteractionMode('select');
      }
    },
    [bracePlacementMode, setInteractionMode],
  );

  // Attach/detach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSaveLabel = () => {
    if (!editingBrace) return;
    const brace: BraceAnnotation = { ...editingBrace, label: labelInput || '未命名' };
    useCurveStore.setState((s) => {
      const exists = s.braces.some((b) => b.id === brace.id);
      return {
        braces: exists
          ? s.braces.map((b) => (b.id === brace.id ? brace : b))
          : [...s.braces, brace],
      };
    });
    setEditingBrace(null);
    setLabelInput('');
  };

  const handleDeleteBrace = (id: string) => {
    useCurveStore.setState((s) => ({ braces: s.braces.filter((b) => b.id !== id) }));
  };

  const handleBraceClick = (brace: BraceAnnotation) => {
    setEditingBrace(brace);
    setLabelInput(brace.label);
  };

  const visibleBraces = braces.filter(
    (b) => b.startX <= xRange[1] && b.endX >= xRange[0],
  );

  // Drag preview bounds
  const previewLeft =
    dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : null;
  const previewRight =
    dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) : null;

  // Calculate dialog position based on editing brace
  const dialogLeft = editingBrace
    ? (convertXToPixel(editingBrace.startX) + convertXToPixel(editingBrace.endX)) / 2 - 100
    : width / 2 - 100;
  // Dialog vertical position: follow the editing brace's own baseline (with yOffset).
  const dialogTop = editingBrace
    ? braceY + (editingBrace.yOffset ?? 0) - 60
    : braceY - 60;

  return (
    <>
      {/* SVG overlay — wrapper has pointerEvents:none so dataZoom slider is not blocked */}
      <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="absolute top-0 left-0"
          style={{
            cursor: bracePlacementMode ? 'crosshair' : 'default',
            pointerEvents: bracePlacementMode ? 'auto' : 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Render existing braces */}
{visibleBraces.map((brace) => {
            const style = resolveLabelStyle(brace.labelStyle, labelStyle);
            const px1 = convertXToPixel(brace.startX);
            const px2 = convertXToPixel(brace.endX);
            const labelText = brace.label || '未命名';
            // Per-brace baseline: default braceY + free vertical offset. No
            // horizontal clamping — labels are freely positionable.
            const y = braceY + (brace.yOffset ?? 0);
            const textX = (px1 + px2) / 2;
            return (
              <g
                key={brace.id}
                style={{ pointerEvents: 'auto', cursor: dragging?.id === brace.id ? 'grabbing' : 'grab' }}
                onPointerDown={(e) => handleBracePointerDown(e, brace)}
              >
                {/* Invisible hit area — wider stroke for easy grabbing */}
                <path
                  d={bracePath(px1, px2, y)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onDoubleClick={(e) => {
                    if (dragMovedRef.current) return;
                    e.stopPropagation();
                    handleBraceClick(brace);
                  }}
                />
                {/* Invisible hit area around the label text */}
                <rect
                  x={textX - labelText.length * style.fontSize * 0.3}
                  y={y - BRACE_HEIGHT / 2 - BRACE_LABEL_GAP - style.fontSize}
                  width={labelText.length * style.fontSize * 0.6}
                  height={style.fontSize * 1.3}
                  fill="transparent"
                  onDoubleClick={(e) => {
                    if (dragMovedRef.current) return;
                    e.stopPropagation();
                    handleBraceClick(brace);
                  }}
                />
                <path
                  d={bracePath(px1, px2, y)}
                  fill="none"
                  stroke={BRACE_COLOR}
                  strokeWidth={2}
                  onDoubleClick={(e) => {
                    if (dragMovedRef.current) return;
                    e.stopPropagation();
                    handleBraceClick(brace);
                  }}
                />
                <text
                  x={textX}
                  y={y - BRACE_HEIGHT / 2 - BRACE_LABEL_GAP}
                  textAnchor="middle"
                  fontSize={style.fontSize}
                  fontFamily={style.fontFamily}
                  fontWeight={style.fontWeight}
                  fill={style.color}
                  onDoubleClick={(e) => {
                    if (dragMovedRef.current) return;
                    e.stopPropagation();
                    handleBraceClick(brace);
                  }}
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* Drag preview */}
          {dragStart !== null && previewLeft !== null && previewRight !== null && (
            <g pointerEvents="none">
              <rect
                x={previewLeft}
                y={0}
                width={previewRight - previewLeft}
                height={height}
                fill={BRACE_COLOR}
                fillOpacity={0.08}
                stroke={BRACE_COLOR}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              <path
                d={bracePath(previewLeft, previewRight, placementY ?? braceY)}
                fill="none"
                stroke={BRACE_COLOR}
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Label editing dialog — rendered OUTSIDE pointerEvents:none wrapper */}
      {editingBrace && (
        <div
          className="absolute bg-surface-raised border border-line rounded-lg shadow-overlay p-3 flex flex-col gap-2 z-50"
          style={{
            left: Math.max(8, Math.min(dialogLeft, width - 220)),
            top: dialogTop,
            width: 200,
          }}
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="输入标签文字"
            className="text-xs px-2 py-1.5 border border-line-strong rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') setEditingBrace(null);
            }}
          />
          <div className="flex gap-2 justify-end items-center">
            {editingBrace.label && (
              <button
                className="text-xs text-danger hover:text-danger-ink mr-auto"
                onClick={() => {
                  handleDeleteBrace(editingBrace.id);
                  setEditingBrace(null);
                }}
              >
                删除
              </button>
            )}
            <button
              className="text-xs px-2.5 py-1 bg-accent text-white rounded hover:bg-accent-strong transition-colors"
              onClick={handleSaveLabel}
            >
              确认
            </button>
            <button
              className="text-xs px-2.5 py-1 bg-surface-hover text-ink-muted rounded hover:bg-surface-active transition-colors"
              onClick={() => setEditingBrace(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}
