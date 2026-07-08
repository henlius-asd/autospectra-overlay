import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

interface ScaleSliderProps {
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  xRange: [number, number];
  chartWidth: number;
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  layerYOffset: number;
  convertYToPixel: (y: number) => number;
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  onDeselect: () => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10.0;

export default function ScaleSlider({
  curveId,
  curves,
  offsets,
  curveScales,
  curveScaleOffsets,
  xRange,
  chartWidth,
  chartHeight,
  gridTop,
  gridBottom,
  gridLeft,
  layerYOffset,
  convertYToPixel,
  setCurveScale,
  setCurveScaleOffset,
  onDeselect,
}: ScaleSliderProps) {
  const scale = curveScales[curveId] ?? 1;
  const scaleOffset = curveScaleOffsets[curveId] ?? 0;
  const [displayScale, setDisplayScale] = useState(scale);
  const pendingScaleRef = useRef(scale);
  const pendingOffsetRef = useRef(scaleOffset);
  const trackRef = useRef<HTMLDivElement>(null);

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

  if (!curve || curve.data.length === 0 || !isFinite(originalMin) || !isFinite(originalMax)) return null;

  const currentTop = originalMax * scale + scaleOffset;
  const currentBottom = originalMin * scale + scaleOffset;

  const topPy = convertYToPixel(currentTop + layerYOffset + offset.yOffset);
  const bottomPy = convertYToPixel(currentBottom + layerYOffset + offset.yOffset);

  const handleTopY = Math.max(gridTop, Math.min(chartHeight - gridBottom, topPy));
  const handleBottomY = Math.max(gridTop, Math.min(chartHeight - gridBottom, bottomPy));
  const trackTop = Math.min(handleTopY, handleBottomY);
  const trackBottom = Math.max(handleTopY, handleBottomY);
  const trackHeight = trackBottom - trackTop;

  if (trackHeight <= 0) return null;

  const createDragHandler = useCallback(
    (isTop: boolean) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;
      const startScale = scale;
      const startOffset = scaleOffset;
      const startHandleY = isTop ? handleTopY : handleBottomY;
      const otherHandleY = isTop ? handleBottomY : handleTopY;

      pendingScaleRef.current = startScale;
      pendingOffsetRef.current = startOffset;

      const onMouseMove = (ev: MouseEvent) => {
        const deltaY = startY - ev.clientY;
        const newHandleY = Math.max(gridTop, Math.min(chartHeight - gridBottom, startHandleY - deltaY));
        const pixelSpan = isTop
          ? otherHandleY - newHandleY
          : newHandleY - otherHandleY;

        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pixelSpan / (trackHeight || 1) * scale));
        pendingScaleRef.current = newScale;
        setDisplayScale(newScale);

        if (isTop) {
          pendingOffsetRef.current = currentBottom - originalMin * newScale;
        } else {
          pendingOffsetRef.current = currentBottom + (currentBottom - newHandleY) - originalMin * newScale;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setCurveScale(curveId, pendingScaleRef.current);
        setCurveScaleOffset(curveId, pendingOffsetRef.current);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [curveId, scale, scaleOffset, handleTopY, handleBottomY, trackHeight,
      gridTop, chartHeight, gridBottom, currentBottom, originalMin,
      setCurveScale, setCurveScaleOffset],
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

  const sliderLeft = gridLeft - 22;
  const midY = (handleTopY + handleBottomY) / 2;

  return (
    <div className="absolute z-10" style={{ left: 0, top: 0, width: chartWidth, height: chartHeight, pointerEvents: 'none' }}>
      <div
        ref={trackRef}
        className="absolute bg-gray-200 rounded-full pointer-events-auto"
        style={{ left: sliderLeft, top: trackTop, width: 4, height: trackHeight }}
      >
        <div
          className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-ns-resize"
          style={{ left: -5, top: handleTopY - trackTop - 7 }}
          onMouseDown={createDragHandler(true)}
          title="拖拽调整上限"
        />
        <div
          className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-ns-resize"
          style={{ left: -5, top: handleBottomY - trackTop - 7 }}
          onMouseDown={createDragHandler(false)}
          title="拖拽调整下限"
        />
      </div>
      <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
        style={{ left: sliderLeft - 4, top: midY - 8, transform: 'translateX(-100%)' }}>
        ×{displayScale.toFixed(1)}
      </div>
    </div>
  );
}