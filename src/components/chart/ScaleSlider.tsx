import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

interface ScaleSliderProps {
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
  layerYOffset: number;
  convertYToPixel: (y: number) => number;
  setCurveScale: (id: string, scale: number) => void;
  onDeselect: () => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10.0;

function scaleToProgress(scale: number): number {
  return (Math.log10(scale) + 1) / 2;
}

function progressToScale(progress: number): number {
  return Math.pow(10, progress * 2 - 1);
}

export default function ScaleSlider({
  curveId,
  curves,
  offsets,
  curveScales,
  xRange,
  chartWidth,
  chartHeight,
  gridTop,
  gridBottom,
  gridLeft,
  layerYOffset,
  convertYToPixel,
  setCurveScale,
  onDeselect,
}: ScaleSliderProps) {
  const scale = curveScales[curveId] ?? 1;
  const [displayScale, setDisplayScale] = useState(scale);
  const pendingScaleRef = useRef(scale);
  const trackRef = useRef<HTMLDivElement>(null);

  const curve = curves[curveId];
  const offset = offsets[curveId] ?? { xOffset: 0, yOffset: 0 };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;
      const trackRect = track.getBoundingClientRect();
      const startScale = curveScales[curveId] ?? 1;
      pendingScaleRef.current = startScale;

      const updateFromClientY = (clientY: number) => {
        const progress = 1 - (clientY - trackRect.top) / trackRect.height;
        const clamped = Math.max(0, Math.min(1, progress));
        const newScale = progressToScale(clamped);
        const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        pendingScaleRef.current = clampedScale;
        setDisplayScale(clampedScale);
      };

      updateFromClientY(e.clientY);

      const onMouseMove = (ev: MouseEvent) => {
        updateFromClientY(ev.clientY);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setCurveScale(curveId, pendingScaleRef.current);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [curveId, curveScales, setCurveScale],
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
  let minY = Infinity;
  for (const [x, yVal] of curve.data) {
    const xAdj = x + offset.xOffset;
    if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
      const yAdj = yVal * scale + layerYOffset + offset.yOffset;
      if (yAdj > maxY) maxY = yAdj;
      if (yAdj < minY) minY = yAdj;
    }
  }

  if (!isFinite(maxY) || !isFinite(minY)) return null;

  const peakPy = convertYToPixel(maxY);
  const basePy = convertYToPixel(minY);
  const trackTop = Math.max(gridTop, peakPy);
  const trackBottom = Math.min(chartHeight - gridBottom, basePy);
  const trackHeight = trackBottom - trackTop;

  if (trackHeight <= 0) return null;

  const progress = scaleToProgress(displayScale);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const thumbY = trackTop + trackHeight * (1 - clampedProgress);

  const sliderLeft = gridLeft - 22;

  return (
    <div className="absolute z-10" style={{ left: 0, top: 0, width: chartWidth, height: chartHeight, pointerEvents: 'none' }}>
      <div
        ref={trackRef}
        className="absolute bg-gray-200 rounded-full pointer-events-auto"
        style={{
          left: sliderLeft,
          top: trackTop,
          width: 4,
          height: trackHeight,
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-ns-resize hover:scale-125 transition-transform"
          style={{
            left: -5,
            top: thumbY - trackTop - 7,
          }}
          title="拖拽缩放曲线"
        />
      </div>
      <div
        className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
        style={{
          left: sliderLeft - 4,
          top: thumbY - 16,
          transform: 'translateX(-100%)',
        }}
      >
        ×{displayScale.toFixed(1)}
      </div>
    </div>
  );
}