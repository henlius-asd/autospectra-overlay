import { useCallback, useEffect, useRef } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
import { yToPixel } from './yPixelMath';
import { scaleByWheel, offsetByDrag } from './curveScaleMath';

interface Props {
  scaleMode: 'off' | 'split' | 'merge';
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  normalizeFactors: Record<string, number>;
  globalScale: number;
  xRange: [number, number];
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  visibleFrame: { yMin: number; yMax: number };
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  setGlobalScale: (s: number) => void;
  onDeselect: () => void;
}

export default function CurveScaleOverlay({
  scaleMode, curveId, curves, offsets, curveScales, curveScaleOffsets,
  normalizeFactors, globalScale,
  xRange, chartHeight, gridTop, gridBottom, visibleFrame,
  setCurveScale, setCurveScaleOffset, setGlobalScale,
  onDeselect,
}: Props) {
  const scale = curveScales[curveId] ?? 1;
  const scaleOffset = curveScaleOffsets[curveId] ?? 0;
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
    e.preventDefault();
    if (scaleMode === 'merge') {
      setGlobalScale(scaleByWheel(globalScale, e.deltaY));
    } else if (scaleMode === 'split' && isFinite(originalMin) && isFinite(originalMax)) {
      const cur = curveScales[curveId] ?? 1;
      const next = scaleByWheel(cur, e.deltaY);
      setCurveScale(curveId, next);
    }
  }, [scaleMode, curveId, globalScale, curveScales, originalMin, originalMax, setCurveScale, setGlobalScale]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (scaleMode !== 'split') return;
    if (!isFinite(originalMin) || !isFinite(originalMax)) return;
    if (!e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startScale: scale, startOffset: scaleOffset, shift: true };
    const frame = { yMin: visibleFrame.yMin, yMax: visibleFrame.yMax, gridTop, gridBottom, chartHeight };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const next = offsetByDrag(d.startOffset, d.startY, ev.clientY, frame);
      setCurveScaleOffset(curveId, next);
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
    if (scaleMode === 'merge') {
      setGlobalScale(1);
    } else if (scaleMode === 'split') {
      setCurveScale(curveId, 1);
      setCurveScaleOffset(curveId, 0);
    }
  }, [scaleMode, curveId, setCurveScale, setCurveScaleOffset, setGlobalScale]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (scaleMode === 'split') {
        onDeselect();
      } else if (scaleMode === 'merge') {
        onDeselect();
      }
    }
  }, [onDeselect, scaleMode]);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const valid = scaleMode === 'split'
    ? curve && curve.data.length > 0 && isFinite(originalMin) && isFinite(originalMax)
    : true;

  const badgeText = scaleMode === 'merge'
    ? `×${globalScale.toFixed(1)}`
    : scaleMode === 'split'
    ? `×${((normalizeFactors[curveId] ?? 1) * globalScale * scale).toFixed(1)}`
    : '';

  const badgeOffset = scaleMode === 'split' ? (curveScaleOffsets[curveId] ?? 0) : 0;

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
      {badgeText && (
        <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
          style={{ left: 8, top: Math.max(gridTop, midPy - 8) }}>
          {badgeText}
          {badgeOffset !== 0 && scaleMode === 'split' ? ` Δ${badgeOffset.toFixed(0)}` : ''}
        </div>
      )}
      {!badgeText && !valid && (
        <div className="absolute text-[10px] text-gray-400 pointer-events-none" style={{ left: 8, top: gridTop }}>—</div>
      )}
    </div>
  );
}
