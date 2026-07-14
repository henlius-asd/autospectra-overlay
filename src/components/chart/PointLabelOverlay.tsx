import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import type { PointLabel } from '@/types';
import { clampLabelX, clampLabelY, estimateTextWidth } from './labelClamp';
import { resolveLabelStyle } from './resolveLabelStyle';

interface PointLabelOverlayProps {
  width: number;
  height: number;
  convertXToPixel: (xVal: number) => number;
  convertPixelToX: (px: number) => number;
  xRange: [number, number];
  getLabelBaseYAtX: (xVal: number) => number;
  gridTop: number;
  gridBottom: number;
  chartWidth: number;
  gridLeft: number;
  gridRight: number;
}

export default function PointLabelOverlay({
  width,
  height,
  convertXToPixel,
  convertPixelToX,
  xRange,
  getLabelBaseYAtX,
  gridTop,
  gridBottom,
  chartWidth,
  gridLeft,
  gridRight,
}: PointLabelOverlayProps) {
  const pointLabels = useCurveStore((s) => s.pointLabels);
  const addPointLabel = useCurveStore((s) => s.addPointLabel);
  const updatePointLabel = useCurveStore((s) => s.updatePointLabel);
  const removePointLabel = useCurveStore((s) => s.removePointLabel);
  const pointLabelPlacementMode = useUiStore((s) => s.pointLabelPlacementMode);
  const setPointLabelPlacementMode = useUiStore((s) => s.setPointLabelPlacementMode);
  const labelStyle = useUiStore((s) => s.labelStyle);

  const [editingLabel, setEditingLabel] = useState<PointLabel | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origYOffset: number } | null>(null);
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
      const dataX = convertPixelToX(px);

      const newLabel: PointLabel = {
        id: `pl_${Date.now()}`,
        x: dataX,
        yOffset: -10,
        label: '',
      };
      addPointLabel(newLabel);
      setEditingLabel(newLabel);
      setLabelInput('');
      setPointLabelPlacementMode(false);
      e.stopPropagation();
    },
    [pointLabelPlacementMode, convertPixelToX, addPointLabel, setPointLabelPlacementMode],
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
        origYOffset: pl.yOffset,
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
      const newYOffset = dragging.origYOffset + dy;
      updatePointLabel(dragging.id, { x: newDataX, yOffset: newYOffset });
    },
    [dragging, convertXToPixel, convertPixelToX, updatePointLabel],
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
        if (pointLabelPlacementMode) setPointLabelPlacementMode(false);
        if (editingLabel) setEditingLabel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointLabelPlacementMode, editingLabel, setPointLabelPlacementMode]);

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
          const textW = estimateTextWidth(labelText, style.fontSize);
          const rawPx = convertXToPixel(pl.x);
          const px = clampLabelX(rawPx, textW, gridLeft, gridRight, chartWidth);
          const rawPy = getLabelBaseYAtX(pl.x) + pl.yOffset;
          const py = clampLabelY(rawPy, 6, gridTop, height - gridBottom);
          return (
            <g
              key={pl.id}
              style={{ pointerEvents: 'auto', cursor: 'move' }}
              onPointerDown={(e) => handleLabelPointerDown(e, pl)}
            >
              <text
                x={px}
                y={py + 3}
                textAnchor="middle"
                fontSize={style.fontSize}
                fontFamily={style.fontFamily}
                fontWeight={style.fontWeight}
                fill={style.color}
                onClick={(e) => {
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
          className="absolute bg-white border border-gray-200 rounded-lg shadow-xl p-3 flex flex-col gap-2 z-50"
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
            className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') setEditingLabel(null);
            }}
          />
          <div className="flex gap-2 justify-end items-center">
            {editingLabel.label && (
              <button
                className="text-xs text-red-500 hover:text-red-700 mr-auto"
                onClick={() => handleDeleteLabel(editingLabel.id)}
              >
                删除
              </button>
            )}
            <button
              className="text-xs px-2.5 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSaveLabel}
            >
              确认
            </button>
            <button
              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
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
