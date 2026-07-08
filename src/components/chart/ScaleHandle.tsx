import { useCallback, useRef, useEffect, useState } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

interface ScaleHandleProps {
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  xRange: [number, number];
  chartWidth: number;
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  gridRight: number;
  convertYToPixel: (y: number) => number;
  setCurveScale: (id: string, scale: number) => void;
  onDeselect: () => void;
}

export default function ScaleHandle({
  curveId,
  curves,
  offsets,
  curveScales,
  xRange,
  chartWidth,
  chartHeight,
  gridLeft,
  gridRight,
  convertYToPixel,
  setCurveScale,
  onDeselect,
}: ScaleHandleProps) {
  const scale = curveScales[curveId] ?? 1;
  const [displayScale, setDisplayScale] = useState(scale);

  const curve = curves[curveId];
  const offset = offsets[curveId] ?? { xOffset: 0, yOffset: 0 };

  const peakX = useRef(0);
  const peakY = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;
      const startScale = curveScales[curveId] ?? 1;

      const onMouseMove = (ev: MouseEvent) => {
        const deltaY = startY - ev.clientY;
        const newScale = Math.max(0.1, Math.min(10, startScale * (1 + deltaY / (chartHeight * 0.5))));
        setDisplayScale(newScale);
        setCurveScale(curveId, newScale);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [curveId, curveScales, chartHeight, setCurveScale],
  );

  useEffect(() => {
    setDisplayScale(scale);
  }, [scale]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDeselect();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDeselect]);

  if (!curve || curve.data.length === 0) return null;

  let maxY = -Infinity;
  let maxX = 0;
  for (const [x, yVal] of curve.data) {
    const xAdj = x + offset.xOffset;
    if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
      const yAdj = yVal * scale + offset.yOffset;
      if (yAdj > maxY) {
        maxY = yAdj;
        maxX = xAdj;
      }
    }
  }

  if (!isFinite(maxY)) return null;

  peakX.current = maxX;
  peakY.current = maxY;

  const range = xRange[1] - xRange[0] || 1;
  const px = gridLeft + ((maxX - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
  const py = convertYToPixel(maxY);

  return (
    <div
      className="absolute z-10"
      style={{ left: px - 7, top: py - 7 }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-ns-resize hover:scale-125 transition-transform"
        title="拖拽缩放曲线"
      />
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
      >
        ×{displayScale.toFixed(1)}
      </div>
    </div>
  );
}
