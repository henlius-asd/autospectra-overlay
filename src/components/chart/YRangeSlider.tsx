import { useCallback, useRef } from 'react';
import type { YAxisFullRange, ResolvedYAxis } from './resolveYAxis';
import { yToPixel, pixelToY } from './yPixelMath';

interface Props {
  chartWidth: number;
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  resolvedFrame: ResolvedYAxis;
  fullRange: YAxisFullRange;
  yZoomRange: [number, number] | null;
  setYZoomRange: (range: [number, number]) => void;
  resetYZoomRange: () => void;
}

const TRACK_LEFT_OFFSET = 18;
const HALF_HANDLE = 7;

export default function YRangeSlider({
  chartHeight, gridTop, gridBottom, gridLeft,
  resolvedFrame, fullRange, yZoomRange, setYZoomRange, resetYZoomRange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = {
    yMin: resolvedFrame.yMin,
    yMax: resolvedFrame.yMax,
    gridTop, gridBottom, chartHeight,
  };
  const { rawDataMin, rawDataMax } = fullRange;

  const localY = (clientY: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect ? clientY - rect.top : clientY;
  };

  const clampRange = useCallback(
    (lo: number, hi: number): [number, number] => {
      let a = Math.min(lo, hi);
      let b = Math.max(lo, hi);
      a = Math.max(rawDataMin, Math.min(rawDataMax, a));
      b = Math.max(rawDataMin, Math.min(rawDataMax, b));
      return [a, b];
    },
    [rawDataMin, rawDataMax],
  );

  const dragHandle = (which: 'lo' | 'hi') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const other = yZoomRange
      ? (which === 'lo' ? yZoomRange[1] : yZoomRange[0])
      : (which === 'lo' ? resolvedFrame.yMax : resolvedFrame.yMin);

    const onMove = (ev: MouseEvent) => {
      const y = pixelToY(localY(ev.clientY), frame);
      const next = which === 'lo'
        ? clampRange(y, other)
        : clampRange(other, y);
      setYZoomRange(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const dragMiddle = (e: React.MouseEvent) => {
    if (!yZoomRange) return;
    e.stopPropagation();
    e.preventDefault();
    const startClientY = e.clientY;
    const [startLo, startHi] = yZoomRange;
    const span = startHi - startLo;
    const onMove = (ev: MouseEvent) => {
      const yStart = pixelToY(localY(startClientY), frame);
      const yNow = pixelToY(localY(ev.clientY), frame);
      const delta = yNow - yStart;
      let lo = startLo + delta;
      let hi = startHi + delta;
      if (lo < rawDataMin) { lo = rawDataMin; hi = lo + span; }
      if (hi > rawDataMax) { hi = rawDataMax; lo = hi - span; }
      setYZoomRange([lo, hi]);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const loY = yZoomRange ? yToPixel(yZoomRange[0], frame) : gridTop;
  const hiY = yZoomRange ? yToPixel(yZoomRange[1], frame) : chartHeight - gridBottom;
  const top = Math.min(loY, hiY);
  const bottom = Math.max(loY, hiY);
  const trackX = gridLeft - TRACK_LEFT_OFFSET;

  return (
    <div ref={containerRef} className="absolute z-10" style={{ left: 0, top: 0, width: '100%', height: chartHeight, pointerEvents: 'none' }}>
      <div
        ref={trackRef}
        className="absolute bg-gray-300 rounded-full pointer-events-auto"
        style={{ left: trackX, top: gridTop, width: 4, height: chartHeight - gridTop - gridBottom }}
        onDoubleClick={(e) => { e.stopPropagation(); resetYZoomRange(); }}
      />
      <div
        className="absolute bg-blue-200/60 pointer-events-auto cursor-ns-resize"
        style={{ left: trackX - 4, top, width: 12, height: Math.max(2, bottom - top) }}
        onMouseDown={dragMiddle}
        title="拖拽平移 Y 范围；双击轨道复位"
      />
      <div
        className="absolute w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-ns-resize pointer-events-auto"
        style={{ left: trackX - HALF_HANDLE, top: top - HALF_HANDLE }}
        onMouseDown={dragHandle('hi')}
        title="拖拽调整 Y 上限"
      />
      <div
        className="absolute w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-ns-resize pointer-events-auto"
        style={{ left: trackX - HALF_HANDLE, top: bottom - HALF_HANDLE }}
        onMouseDown={dragHandle('lo')}
        title="拖拽调整 Y 下限"
      />
    </div>
  );
}