import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
import { yToPixel } from './yPixelMath';
import { scaleByWheel, scaleByDrag, offsetByDrag } from './curveScaleMath';

interface Props {
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  xRange: [number, number];
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  visibleFrame: { yMin: number; yMax: number };
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  onDeselect: () => void;
}

export default function CurveScaleOverlay({
  curveId, curves, offsets, curveScales, curveScaleOffsets,
  xRange, chartHeight, gridTop, gridBottom, visibleFrame,
  setCurveScale, setCurveScaleOffset, onDeselect,
}: Props) {
  const scale = curveScales[curveId] ?? 1;
  const scaleOffset = curveScaleOffsets[curveId] ?? 0;
  const [displayScale, setDisplayScale] = useState(scale);
  const dragRef = useRef<{ startY: number; startScale: number; startOffset: number; shift: boolean } | null>(null);

  const curve = curves[curveId];
  const offset = offsets[curveId] ?? { xOffset: 0, yOffset: 0 };

  let originalMin = Infinity;
  let originalMax = -Infinity;
  if (curve) {
    for (const [x, yVal] of curve.data) {
      const xAdj = x + offset.xOffset;
      if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
        if (yVal < originalMin) originalMin = yVal;
        if (yVal > originalMax) originalMax = yVal;
      }
    }
  }

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!isFinite(originalMin) || !isFinite(originalMax)) return;
    e.preventDefault();
    const next = scaleByWheel(scale, e.deltaY);
    setCurveScale(curveId, next);
    setDisplayScale(next);
  }, [curveId, scale, originalMin, originalMax, setCurveScale]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isFinite(originalMin) || !isFinite(originalMax)) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startScale: scale, startOffset: scaleOffset, shift: e.shiftKey };
    const frame = { yMin: visibleFrame.yMin, yMax: visibleFrame.yMax, gridTop, gridBottom, chartHeight };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const deltaPx = ev.clientY - d.startY;
      if (d.shift) {
        const next = offsetByDrag(d.startOffset, d.startY, ev.clientY, frame);
        setCurveScaleOffset(curveId, next);
      } else {
        const next = scaleByDrag(d.startScale, deltaPx);
        setCurveScale(curveId, next);
        setDisplayScale(next);
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      dragRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const onDoubleClick = useCallback(() => {
    setCurveScale(curveId, 1);
    setCurveScaleOffset(curveId, 0);
    setDisplayScale(1);
  }, [curveId, setCurveScale, setCurveScaleOffset]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onDeselect();
  }, [onDeselect]);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const valid = curve && curve.data.length > 0 && isFinite(originalMin) && isFinite(originalMax);
  const midPy = valid
    ? yToPixel((originalMin + originalMax) / 2 * scale + scaleOffset, {
        yMin: visibleFrame.yMin, yMax: visibleFrame.yMax, gridTop, gridBottom, chartHeight,
      })
    : (gridTop + chartHeight - gridBottom) / 2;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ pointerEvents: 'auto' }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {valid && (
        <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
          style={{ left: 8, top: Math.max(gridTop, midPy - 8) }}>
          ×{displayScale.toFixed(1)}
          {scaleOffset !== 0 ? ` Δ${scaleOffset.toFixed(0)}` : ''}
        </div>
      )}
      {!valid && (
        <div className="absolute text-[10px] text-gray-400 pointer-events-none" style={{ left: 8, top: gridTop }}>—</div>
      )}
    </div>
  );
}
