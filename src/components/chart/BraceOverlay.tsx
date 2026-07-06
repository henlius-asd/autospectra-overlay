import { useState, useRef, useCallback, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';
import type { BraceAnnotation } from '@/types';

const BRACE_COLOR = '#e74c3c';

function bracePath(startX: number, endX: number, y: number): string {
  const width = endX - startX;
  const midX = startX + width / 2;
  const h = 12;
  const w = 6;

  return `M ${startX} ${y}
    C ${startX} ${y - h}, ${startX + w} ${y - h}, ${startX + w} ${y - h / 2}
    L ${midX - w / 2} ${y + h / 2}
    L ${midX} ${y + h}
    L ${midX + w / 2} ${y + h / 2}
    L ${endX - w} ${y - h / 2}
    C ${endX - w} ${y - h}, ${endX} ${y - h}, ${endX} ${y}`;
}

interface BraceOverlayProps {
  width: number;
  height: number;
  convertXToPixel: (xVal: number) => number;
  convertPixelToX: (px: number) => number;
  xRange: [number, number];
}

export default function BraceOverlay({
  width,
  height,
  convertXToPixel,
  convertPixelToX,
  xRange,
}: BraceOverlayProps) {
  const braces = useCurveStore((s) => s.braces);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const setBracePlacementMode = useUiStore((s) => s.setBracePlacementMode);

  const [firstPoint, setFirstPoint] = useState<number | null>(null);
  const [editingBrace, setEditingBrace] = useState<BraceAnnotation | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  // Handle click on chart area during placement mode
  const handleChartClick = useCallback(
    (e: ReactMouseEvent) => {
      if (!bracePlacementMode) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;

      if (firstPoint === null) {
        setFirstPoint(px);
      } else {
        // Second click — create brace
        const startX = Math.min(firstPoint, px);
        const endX = Math.max(firstPoint, px);
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
        setFirstPoint(null);
        setBracePlacementMode(false);
      }
    },
    [bracePlacementMode, firstPoint, convertPixelToX, setBracePlacementMode],
  );

  // Cancel placement on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bracePlacementMode) {
        setFirstPoint(null);
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

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute top-0 left-0"
      style={{
        cursor: bracePlacementMode ? 'crosshair' : 'default',
        pointerEvents: bracePlacementMode ? 'auto' : 'none',
      }}
      onClick={handleChartClick}
    >
      {/* Render existing braces */}
      {visibleBraces.map((brace) => {
        const px1 = convertXToPixel(brace.startX);
        const px2 = convertXToPixel(brace.endX);
        const y = height - 40;
        return (
          <g key={brace.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
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
              y={y + 24}
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

      {/* First point marker */}
      {bracePlacementMode && firstPoint !== null && (
        <line
          x1={firstPoint}
          y1={0}
          x2={firstPoint}
          y2={height}
          stroke={BRACE_COLOR}
          strokeWidth={1}
          strokeDasharray="4 2"
        />
      )}

      {/* Label editing dialog */}
      {editingBrace && (
        <foreignObject x={100} y={height / 2 - 30} width={width - 200} height={60}>
          <div className="bg-white border border-gray-300 rounded shadow-lg p-3 flex flex-col gap-2">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="输入标签文字"
              className="text-xs px-2 py-1 border border-gray-300 rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel();
                if (e.key === 'Escape') setEditingBrace(null);
              }}
            />
            <div className="flex gap-2 justify-end">
              {editingBrace.label && (
                <button
                  className="text-xs text-red-500 hover:text-red-700"
                  onClick={() => {
                    handleDeleteBrace(editingBrace.id);
                    setEditingBrace(null);
                  }}
                >
                  删除
                </button>
              )}
              <button
                className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleSaveLabel}
              >
                确认
              </button>
              <button
                className="text-xs px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setEditingBrace(null)}
              >
                取消
              </button>
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}