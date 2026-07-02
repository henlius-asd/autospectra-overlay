import { useState, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { useCurveStore } from '@/store';
import type { BraceAnnotation } from '@/types';

const BRACE_COLOR = '#e74c3c';

// Simple brace path generator
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
  /** Convert data X to pixel X */
  convertXToPixel: (xVal: number) => number;
  /** Convert pixel X to data X */
  convertPixelToX: (px: number) => number;
  /** Current dataZoom X range [min, max] */
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<number | null>(null);
  const [drawEnd, setDrawEnd] = useState<number | null>(null);
  const [editingBrace, setEditingBrace] = useState<BraceAnnotation | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!e.shiftKey) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    setIsDrawing(true);
    setDrawStart(x);
    setDrawEnd(x);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDrawing) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDrawEnd(e.clientX - rect.left);
  };

  const handleMouseUp = () => {
    if (!isDrawing || drawStart === null || drawEnd === null) {
      setIsDrawing(false);
      return;
    }

    const startX = Math.min(drawStart, drawEnd);
    const endX = Math.max(drawStart, drawEnd);

    if (endX - startX > 10) {
      // Convert to data coordinates
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
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  };

  const handleSaveLabel = () => {
    if (!editingBrace) return;
    const brace: BraceAnnotation = { ...editingBrace, label: labelInput || '未命名' };
    useCurveStore.setState((s) => ({ braces: [...s.braces, brace] }));
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

  // Filter braces to only those visible in current xRange
  const visibleBraces = braces.filter(
    (b) => b.startX <= xRange[1] && b.endX >= xRange[0],
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: 'crosshair', pointerEvents: isDrawing ? 'auto' : 'none' }}
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
              onClick={() => handleBraceClick(brace)}
            />
            <text
              x={(px1 + px2) / 2}
              y={y + 24}
              textAnchor="middle"
              fontSize={11}
              fill={BRACE_COLOR}
              onClick={() => handleBraceClick(brace)}
            >
              {brace.label || '未命名'}
            </text>
          </g>
        );
      })}

      {/* Drawing preview */}
      {isDrawing && drawStart !== null && drawEnd !== null && (
        <path
          d={bracePath(
            Math.min(drawStart, drawEnd),
            Math.max(drawStart, drawEnd),
            height - 40,
          )}
          fill="none"
          stroke={BRACE_COLOR}
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}

      {/* Label editing popup */}
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