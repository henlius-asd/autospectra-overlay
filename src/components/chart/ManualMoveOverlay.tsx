import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCurveStore, useUiStore } from '@/store';

interface Props {
  chartWidth: number;
  chartHeight: number;
  xRange: [number, number];
  gridLeft: number;
  gridRight: number;
  gridTop: number;
  gridBottom: number;
  visibleYMin: number;
  visibleYMax: number;
}

export default function ManualMoveOverlay({
  chartWidth, chartHeight, xRange, gridLeft, gridRight, gridTop, gridBottom, visibleYMin, visibleYMax,
}: Props) {
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const locked = useCurveStore((s) => s.locked);
  const setCurveOffset = useCurveStore((s) => s.setCurveOffset);
  const setInteractionMode = useUiStore((s) => s.setInteractionMode);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origXOffset: number;
    origYOffset: number;
  } | null>(null);

  const convertPixelToX = (px: number) => {
    const range = xRange[1] - xRange[0] || 1;
    const plotWidth = chartWidth - gridLeft - gridRight;
    return xRange[0] + ((px - gridLeft) / plotWidth) * range;
  };

  const convertPixelToY = (py: number) => {
    const plotHeight = chartHeight - gridTop - gridBottom;
    const yRange = visibleYMax - visibleYMin || 1;
    return visibleYMax - ((py - gridTop) / plotHeight) * yRange;
  };

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    if (!selectedCurveId) return;
    const offsets = useCurveStore.getState().offsets;
    const cur = offsets[selectedCurveId] ?? { xOffset: 0, yOffset: 0 };
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origXOffset: cur.xOffset,
      origYOffset: cur.yOffset,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [selectedCurveId]);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragRef.current || !selectedCurveId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const isLocked = locked[selectedCurveId];

    const deltaX = isLocked ? 0 : convertPixelToX(gridLeft + dx) - convertPixelToX(gridLeft);
    const deltaY = convertPixelToY(gridTop + dy) - convertPixelToY(gridTop);

    setCurveOffset(selectedCurveId, {
      xOffset: isLocked ? dragRef.current.origXOffset : dragRef.current.origXOffset + deltaX,
      yOffset: dragRef.current.origYOffset + deltaY,
    });
  }, [selectedCurveId, locked, setCurveOffset, gridLeft, gridTop]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInteractionMode('select');
    }
  }, [setInteractionMode]);

  if (!selectedCurveId) {
    return (
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
    );
  }

  const isLocked = locked[selectedCurveId];

  return (
    <div
      className="absolute top-0 left-0 w-full h-full"
      style={{
        pointerEvents: 'auto',
        cursor: isLocked ? 'ns-resize' : 'move',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {isLocked && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded">
          横向锁定
        </div>
      )}
    </div>
  );
}