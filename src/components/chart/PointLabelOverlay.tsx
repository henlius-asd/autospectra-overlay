import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import type { PointLabel } from '@/types';
import { resolveLabelStyle } from './resolveLabelStyle';
import { estimateTextWidth } from './labelClamp';

interface PointLabelOverlayProps {
  width: number;
  height: number;
  convertXToPixel: (xVal: number) => number;
  convertPixelToX: (px: number) => number;
  convertYToPixel: (yVal: number) => number;
  convertPixelToY: (py: number) => number;
  xRange: [number, number];
  gridTop: number;
}

export default function PointLabelOverlay({
  width,
  height,
  convertXToPixel,
  convertPixelToX,
  convertYToPixel,
  convertPixelToY,
  xRange,
  gridTop,
}: PointLabelOverlayProps) {
  const pointLabels = useCurveStore((s) => s.pointLabels);
  const addPointLabel = useCurveStore((s) => s.addPointLabel);
  const updatePointLabel = useCurveStore((s) => s.updatePointLabel);
  const removePointLabel = useCurveStore((s) => s.removePointLabel);
  const pointLabelPlacementMode = useUiStore((s) => s.interactionMode) === 'pointLabel';
  const setInteractionMode = useUiStore((s) => s.setInteractionMode);
  const labelStyle = useUiStore((s) => s.labelStyle);

  const [editingLabel, setEditingLabel] = useState<PointLabel | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleLabels = pointLabels.filter(
    (pl) => pl.x >= xRange[0] && pl.x <= xRange[1],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!pointLabelPlacementMode) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dataX = convertPixelToX(px);
      const dataY = convertPixelToY(py);

      const newLabel: PointLabel = {
        id: `pl_${Date.now()}`,
        x: dataX,
        y: dataY,
        label: '',
      };
      addPointLabel(newLabel);
      setEditingLabel(newLabel);
      setLabelInput('');
      setInteractionMode('select');
      e.stopPropagation();
    },
    [pointLabelPlacementMode, convertPixelToX, convertPixelToY, addPointLabel, setInteractionMode],
  );

  const handleLabelPointerDown = useCallback(
    (e: ReactPointerEvent, pl: PointLabel) => {
      if (pointLabelPlacementMode) return;
      e.stopPropagation();
      setDragging({
        id: pl.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: pl.x,
        origY: pl.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pointLabelPlacementMode],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      const newDataX = convertPixelToX(convertXToPixel(dragging.origX) + dx);
      // Absolute data Y: convert mouse pixel Y directly to data Y.
      // No dependency on any curve — the label is anchored to the y-axis only.
      const origPixelY = convertYToPixel(dragging.origY);
      const newDataY = convertPixelToY(origPixelY + dy);
      updatePointLabel(dragging.id, { x: newDataX, y: newDataY });
    },
    [dragging, convertXToPixel, convertPixelToX, convertYToPixel, convertPixelToY, updatePointLabel],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleSaveLabel = () => {
    if (!editingLabel) return;
    updatePointLabel(editingLabel.id, { label: labelInput || '未命名' });
    setEditingLabel(null);
    setLabelInput('');
  };

  const handleDeleteLabel = (id: string) => {
    removePointLabel(id);
    setEditingLabel(null);
  };

  const handleLabelClick = (pl: PointLabel) => {
    if (pointLabelPlacementMode) return;
    setEditingLabel(pl);
    setLabelInput(pl.label);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointLabelPlacementMode) setInteractionMode('select');
        if (editingLabel) setEditingLabel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointLabelPlacementMode, editingLabel, setInteractionMode]);

  const dialogLeft = editingLabel
    ? convertXToPixel(editingLabel.x) - 100
    : width / 2 - 100;

  return (
    <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute top-0 left-0"
        style={{
          cursor: pointLabelPlacementMode ? 'crosshair' : 'default',
          pointerEvents: pointLabelPlacementMode ? 'auto' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {visibleLabels.map((pl) => {
          const style = resolveLabelStyle(pl.labelStyle, labelStyle);
          const labelText = pl.label || '未命名';
          // Absolute data Y → pixel Y. No dependency on any curve.
          const px = convertXToPixel(pl.x);
          const py = convertYToPixel(pl.y);
          const textW = estimateTextWidth(labelText, style.fontSize);
          return (
            <g
              key={pl.id}
              style={{ pointerEvents: 'auto', cursor: 'move' }}
              onPointerDown={(e) => handleLabelPointerDown(e, pl)}
            >
              {/* Invisible hit area around the text for easy grabbing */}
              <rect
                x={px - textW / 2 - 4}
                y={py - style.fontSize}
                width={textW + 8}
                height={style.fontSize * 1.4}
                fill="transparent"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleLabelClick(pl);
                }}
              />
              <text
                x={px}
                y={py + 3}
                textAnchor="middle"
                fontSize={style.fontSize}
                fontFamily={style.fontFamily}
                fontWeight={style.fontWeight}
                fill={style.color}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleLabelClick(pl);
                }}
              >
                {labelText}
              </text>
            </g>
          );
        })}
      </svg>

      {editingLabel && (
        <div
          className="absolute bg-surface-raised border border-line rounded-lg shadow-overlay p-3 flex flex-col gap-2 z-50"
          style={{
            left: Math.max(8, Math.min(dialogLeft, width - 220)),
            top: gridTop + 10,
            width: 200,
            pointerEvents: 'auto',
          }}
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="输入标签文字"
            className="text-xs px-2 py-1.5 border border-line-strong rounded focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') setEditingLabel(null);
            }}
          />
          <div className="flex gap-2 justify-end items-center">
            {editingLabel.label && (
              <button
                className="text-xs text-danger hover:text-danger-ink mr-auto"
                onClick={() => handleDeleteLabel(editingLabel.id)}
              >
                删除
              </button>
            )}
            <button
              className="text-xs px-2.5 py-1 bg-accent text-white rounded hover:bg-accent-strong"
              onClick={handleSaveLabel}
            >
              确认
            </button>
            <button
              className="text-xs px-2.5 py-1 bg-surface-hover text-ink-muted rounded hover:bg-surface-active"
              onClick={() => setEditingLabel(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
