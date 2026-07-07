import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import type { BraceAnnotation } from '@/types';
import { bracePath, BRACE_COLOR } from './bracePath';

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
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const setBracePlacementMode = useUiStore((s) => s.setBracePlacementMode);

  const [editingBrace, setEditingBrace] = useState<BraceAnnotation | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!bracePlacementMode) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      setDragStart(px);
      setDragEnd(px);
      svgRef.current?.setPointerCapture(e.pointerId);
      e.stopPropagation();
    },
    [bracePlacementMode],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!bracePlacementMode || dragStart === null) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      setDragEnd(px);
      e.stopPropagation();
    },
    [bracePlacementMode, dragStart],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      svgRef.current?.releasePointerCapture(e.pointerId);
      if (!bracePlacementMode || dragStart === null || dragEnd === null) {
        setDragStart(null);
        setDragEnd(null);
        return;
      }
      const startX = Math.min(dragStart, dragEnd);
      const endX = Math.max(dragStart, dragEnd);
      if (endX - startX < 5) {
        // Too small — treat as click, not a placement drag.
        setDragStart(null);
        setDragEnd(null);
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
      };
      setEditingBrace(newBrace);
      setLabelInput('');
      setDragStart(null);
      setDragEnd(null);
      setBracePlacementMode(false);
    },
    [bracePlacementMode, dragStart, dragEnd, convertPixelToX, setBracePlacementMode],
  );

  // Cancel placement on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bracePlacementMode) {
        setDragStart(null);
        setDragEnd(null);
        setBracePlacementMode(false);
      }
    },
    [bracePlacementMode, setBracePlacementMode],
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

  const y = braceY;

  // Drag preview bounds
  const previewLeft =
    dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : null;
  const previewRight =
    dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) : null;

  // Calculate dialog position based on editing brace
  const dialogLeft = editingBrace
    ? (convertXToPixel(editingBrace.startX) + convertXToPixel(editingBrace.endX)) / 2 - 100
    : width / 2 - 100;

  return (
    <div className="absolute top-0 left-0 w-full h-full">
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
          const px1 = convertXToPixel(brace.startX);
          const px2 = convertXToPixel(brace.endX);
          return (
            <g
              key={brace.id}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <path
                d={bracePath(px1, px2, y)}
                fill="none"
                stroke={BRACE_COLOR}
                strokeWidth={2}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBraceClick(brace);
                }}
              />
              <text
                x={(px1 + px2) / 2}
                y={y - 10}
                textAnchor="middle"
                fontSize={11}
                fill={BRACE_COLOR}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBraceClick(brace);
                }}
              >
                {brace.label || '未命名'}
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
              d={bracePath(previewLeft, previewRight, y)}
              fill="none"
              stroke={BRACE_COLOR}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          </g>
        )}
      </svg>

      {/* Label editing dialog — HTML floating layer */}
      {editingBrace && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-xl p-3 flex flex-col gap-2 z-50"
          style={{
            left: Math.max(8, Math.min(dialogLeft, width - 220)),
            top: y - 60,
            width: 200,
          }}
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="输入标签文字"
            className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') setEditingBrace(null);
            }}
          />
          <div className="flex gap-2 justify-end items-center">
            {editingBrace.label && (
              <button
                className="text-xs text-red-500 hover:text-red-700 mr-auto"
                onClick={() => {
                  handleDeleteBrace(editingBrace.id);
                  setEditingBrace(null);
                }}
              >
                删除
              </button>
            )}
            <button
              className="text-xs px-2.5 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={handleSaveLabel}
            >
              确认
            </button>
            <button
              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setEditingBrace(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
