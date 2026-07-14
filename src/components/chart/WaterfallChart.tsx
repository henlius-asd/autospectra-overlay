import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore, useUiStore } from '@/store';
import BraceOverlay from './BraceOverlay';
import PointLabelOverlay from './PointLabelOverlay';
import ManualMoveOverlay from './ManualMoveOverlay';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';
import { computeYAxisRange } from './computeYAxisRange';
import { normalizeYZoomRange } from './yZoomRange';
import { yToPixel } from './yPixelMath';
import { getTopCurvePixelYAtX, topCurvePeak } from './labelGeometry';
import { scaleByWheel, offsetByDrag } from './curveScaleMath';

// Shared chart instance for PNG export
let chartInstance: EChartsInstance | null = null;
export function getChartInstance() {
  return chartInstance;
}

/**
 * Proportion of the Y-axis reserved above the highest curve so labels and
 * braces have room above the data. Applied to yAxisMax inside
 * computeYAxisRange; the label baselines themselves are computed separately
 * via getTopCurvePixelYAtX (point labels) and topCurvePeak (braces).
 */
export const LABEL_PADDING_RATIO = 0.15;

/** Read current X-axis visible range from ECharts model */
function getXAxisExtent(): [number, number] | null {
  if (!chartInstance) return null;
  try {
    // getModel() is private in type defs but available at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = chartInstance as any;
    const extent = chart.getModel()?.getComponent?.('xAxis', 0)?.axis?.scale?.getExtent?.();
    if (extent && extent.length === 2) {
      return [extent[0] as number, extent[1] as number];
    }
  } catch { /* fall through */ }
  return null;
}

export default function WaterfallChart() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);
  const visibleCurves = useCurveStore((s) => s.visibleCurves);
  const stagingOrder = useCurveStore((s) => s.stagingOrder);
  const layerSpacing = useCurveStore((s) => s.layerSpacing);
  const setLayerSpacing = useCurveStore((s) => s.setLayerSpacing);
  const curveScales = useCurveStore((s) => s.curveScales);
  const curveScaleOffsets = useCurveStore((s) => s.curveScaleOffsets);
  const normalizeFactors = useCurveStore((s) => s.normalizeFactors);
  const globalScale = useCurveStore((s) => s.globalScale);
  const setCurveScale = useCurveStore((s) => s.setCurveScale);
  const setCurveScaleOffset = useCurveStore((s) => s.setCurveScaleOffset);
  const setGlobalScale = useCurveStore((s) => s.setGlobalScale);
  const xRange = useUiStore((s) => s.xRange);
  const globalScaleMode = useUiStore((s) => s.globalScaleMode);
  const perCurveScaleMode = useUiStore((s) => s.perCurveScaleMode);
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const setSelectedCurveId = useUiStore((s) => s.setSelectedCurveId);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const scaleModeActive = globalScaleMode || perCurveScaleMode;
  const showGrid = useUiStore((s) => s.showGrid);
  const showXAxis = useUiStore((s) => s.showXAxis);
  const showYAxis = useUiStore((s) => s.showYAxis);
  const yZoomRange = useUiStore((s) => s.yZoomRange);
  const manualMoveMode = useUiStore((s) => s.manualMoveMode);
  const yZoomRangeSource = useRef<'event' | 'external' | null>(null);

  // visibleIds follows stagingOrder (only IDs that are in stagingOrder AND visible)
  // visibleIds[0] = top of list = top of chart; visibleIds[last] = bottom (baseline)
  const visibleIds = stagingOrder.filter((id) => visibleCurves[id]);

  // Seed xRange only when visible curves appear for the first time after a period
  // of having none. Visibility toggles (add/remove from overlay, select/deselect all)
  // must NOT overwrite xRange — the ECharts dataZoom viewport is preserved by
  // replaceMerge, and overwriting the store value here would desync ROI from the
  // on-screen visible range. onChartReady/onDataZoom remain the sources of truth for
  // the live visible range; this effect only provides the initial seed.
  const hasInitializedXRange = useRef(false);
  useEffect(() => {
    if (visibleIds.length === 0) {
      // No visible curves: allow the next appearance to re-seed xRange.
      hasInitializedXRange.current = false;
      return;
    }
    if (hasInitializedXRange.current) return;
    hasInitializedXRange.current = true;

    // Prefer the real ECharts visible extent; fall back to data head/tail when the
    // chart instance is not ready yet (onChartReady will refine it afterwards).
    const extent = getXAxisExtent();
    if (extent) {
      useUiStore.getState().setXRange(extent);
      return;
    }
    const firstCurve = curves[visibleIds[0]];
    if (firstCurve && firstCurve.data.length > 0) {
      const min = Math.floor(firstCurve.data[0][0]);
      const max = Math.ceil(firstCurve.data[firstCurve.data.length - 1][0]);
      useUiStore.getState().setXRange([min, max]);
    }
  }, [curves, visibleCurves]);

  const [chartDims, setChartDims] = useState({ width: 800, height: 600 });

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartInstance = instance;
    setChartDims({ width: instance.getWidth(), height: instance.getHeight() });
    const xExtent = getXAxisExtent();
    if (xExtent) useUiStore.getState().setXRange(xExtent);
    const yzr = useUiStore.getState().yZoomRange;
    if (yzr) {
      instance.dispatchAction({
        type: 'dataZoom',
        dataZoomId: 'yZoom',
        startValue: yzr[0],
        endValue: yzr[1],
      });
    }
  }, []);

  const onDataZoom = useCallback((e: unknown) => {
    const xExtent = getXAxisExtent();
    const currentXRange = useUiStore.getState().xRange;
    const xChanged = xExtent && (xExtent[0] !== currentXRange[0] || xExtent[1] !== currentXRange[1]);

    let yRange: [number, number] | null = null;
    const event = e as { batch?: Array<{ dataZoomId?: string; startValue?: number; endValue?: number }> };
    if (event?.batch) {
      for (const item of event.batch) {
        if ((item.dataZoomId === 'yZoom' || item.dataZoomId === 'yZoomSlider')
          && item.startValue != null && item.endValue != null) {
          yRange = normalizeYZoomRange(item.startValue, item.endValue);
          yZoomRangeSource.current = 'event';
          break;
        }
      }
    }

    if (xChanged || yRange) {
      useUiStore.setState({
        ...(xChanged ? { xRange: xExtent! } : {}),
        ...(yRange ? { yZoomRange: yRange } : {}),
      });
    }
  }, []);

  const yAxisFullRange = useMemo(() =>
    computeYAxisRange(
      visibleIds, curves, offsets, xRange, layerSpacing,
    ),
    [visibleIds, curves, offsets, xRange, layerSpacing],
  );

  useEffect(() => {
    if (yZoomRangeSource.current === 'event') {
      yZoomRangeSource.current = null;
      return;
    }
    yZoomRangeSource.current = null;
    if (yZoomRange && chartInstance) {
      chartInstance.dispatchAction({
        type: 'dataZoom',
        dataZoomId: 'yZoom',
        startValue: yZoomRange[0],
        endValue: yZoomRange[1],
      });
    }
  }, [yZoomRange]);

  const option: EChartsOption = useMemo(() => {
    if (visibleIds.length === 0) {
      return {
        title: {
          text: '尚未加载曲线数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#ccc', fontSize: 16 },
        },
      };
    }

    const visibleCount = visibleIds.length;

    const { yRangeForLayer } = yAxisFullRange;

    const series = visibleIds.map((id, visibleIndex) => {
      const curve = curves[id];
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };

      const layerIndex = visibleCount - 1 - visibleIndex;
      const layerYOffset = layerIndex * layerSpacing * yRangeForLayer;

      const normalize = normalizeFactors[id] ?? 1;
      const manual = curveScales[id] ?? 1;
      const composite = normalize * globalScale * manual;
      const scaleOffset = curveScaleOffsets[id] ?? 0;
      const renderedData = curve.data.map(([x, y]) => [
        x + offset.xOffset,
        y * composite + scaleOffset + layerYOffset + offset.yOffset,
      ]);

      return {
        id,
        name: curve.displayName || curve.name,
        type: 'line' as const,
        data: renderedData,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: curve.color || '#000000',
          width: 1.5,
        },
        large: true,
        sampling: 'lttb' as const,
        clip: false,
      };
    });

    // Compute global x-range from visible curves to set explicit axis min/max
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const id of visibleIds) {
      const data = curves[id].data;
      if (data.length > 0) {
        xMin = Math.min(xMin, data[0][0]);
        xMax = Math.max(xMax, data[data.length - 1][0]);
      }
    }
    if (!isFinite(xMin)) { xMin = 0; xMax = 10; }
    xMin = Math.floor(xMin);
    xMax = Math.ceil(xMax);

    return {
      title: { show: false },
      tooltip: { show: false },
legend: {
        show: visibleIds.length > 1,
        top: 8,
        type: 'scroll',
        icon: 'line',
        itemWidth: 20,
        itemHeight: 14,
      },
      grid: {
        left: 60,
        right: 48,
        top: visibleIds.length > 1 ? 50 : 20,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        show: showXAxis,
        name: showXAxis ? '时间' : '',
        nameLocation: 'center',
        nameGap: 35,
        min: xMin,
        max: xMax,
        onZero: false,
        axisLine: { show: showXAxis },
        axisTick: { show: showXAxis },
        axisLabel: { show: showXAxis },
        splitLine: { show: showGrid },
      },
      yAxis: {
        type: 'value',
        show: showYAxis,
        name: showYAxis ? '强度' : '',
        nameLocation: 'center',
        nameGap: 45,
        min: yAxisFullRange.yAxisMin,
        max: yAxisFullRange.yAxisMax,
        axisLine: { show: showYAxis },
        axisTick: { show: showYAxis },
        axisLabel: { show: showYAxis },
        splitLine: { show: showGrid },
      },
      dataZoom: (() => {
        if (bracePlacementMode) {
          return [{ id: 'xZoomSlider', type: 'slider', xAxisIndex: 0, bottom: 10 }];
        }
        // When scale mode is active, disable 'inside' dataZoom so ECharts
        // doesn't capture wheel events — our native container listener handles scaling.
        const xInside = scaleModeActive
          ? { id: 'xZoom', type: 'slider', xAxisIndex: 0, bottom: 10, show: false }
          : { id: 'xZoom', type: 'inside' as const, xAxisIndex: 0 };
        const xZoom: EChartsOption['dataZoom'] = [
          xInside,
          { id: 'xZoomSlider', type: 'slider', xAxisIndex: 0, bottom: 10 },
        ];
        const yMinSpan = 0.05 * (yAxisFullRange.dataSpan || 1);
        const yInside: Record<string, unknown> = scaleModeActive
          ? { id: 'yZoom', type: 'slider', yAxisIndex: 0, show: false, filterMode: 'none', minValueSpan: yMinSpan }
          : { id: 'yZoom', type: 'inside', yAxisIndex: 0, filterMode: 'none', minValueSpan: yMinSpan };
        const ySlider: Record<string, unknown> = {
          id: 'yZoomSlider', type: 'slider', yAxisIndex: 0, orient: 'vertical',
          left: 60 - 14 - 4, width: 14, filterMode: 'none', minValueSpan: yMinSpan,
        };
        return [...xZoom, yInside, ySlider] as EChartsOption['dataZoom'];
      })(),
      series,
      animation: false,
    };
  }, [curves, offsets, visibleCurves, layerSpacing, stagingOrder, visibleIds, xRange, bracePlacementMode, showGrid, showXAxis, showYAxis, curveScales, curveScaleOffsets, normalizeFactors, globalScale, scaleModeActive]);

  const convertXToPixel = (xVal: number): number => {
    if (!chartInstance) return 0;
    const grid = (chartInstance.getOption() as Record<string, unknown>).grid as { left?: number; right?: number }[];
    const gridLeft = (grid?.[0]?.left as number) ?? 60;
    const gridRight = (grid?.[0]?.right as number) ?? 48;
    const chartWidth = chartInstance.getWidth();
    const range = xRange[1] - xRange[0] || 1;
    return gridLeft + ((xVal - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
  };

  const convertPixelToX = (px: number): number => {
    if (!chartInstance) return 0;
    const grid = (chartInstance.getOption() as Record<string, unknown>).grid as { left?: number; right?: number }[];
    const gridLeft = (grid?.[0]?.left as number) ?? 60;
    const gridRight = (grid?.[0]?.right as number) ?? 48;
    const chartWidth = chartInstance.getWidth();
    const range = xRange[1] - xRange[0] || 1;
    return xRange[0] + ((px - gridLeft) / (chartWidth - gridLeft - gridRight)) * range;
  };

  const visibleYRange = useMemo((): [number, number] => {
    if (!yZoomRange) return [yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax];
    return yZoomRange;
  }, [yZoomRange, yAxisFullRange]);

  const convertYToPixel = (yVal: number): number =>
    yToPixel(yVal, {
      yMin: visibleYRange[0],
      yMax: visibleYRange[1],
      gridTop,
      gridBottom,
      chartHeight: chartDims.height,
    });
  const peak = topCurvePeak(yAxisFullRange.rawDataMin, yAxisFullRange.yRangeForLayer);

  const gridTop = visibleIds.length > 1 ? 50 : 20;
  const gridBottom = 60;
  const gridLeft = 60;
  const gridRight = 48;

  const braceY = Math.max(gridTop + 8, convertYToPixel(peak) - 14);

  const getLabelBaseYAtX = (xVal: number) =>
    getTopCurvePixelYAtX(
      xVal,
      {
        visibleIds,
        curves,
        offsets,
        layerSpacing,
        yRangeForLayer: yAxisFullRange.yRangeForLayer,
      },
      convertYToPixel,
    );

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Native wheel listener for scaling (non-passive so preventDefault works)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !scaleModeActive) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const perCurveActive = perCurveScaleMode && selectedCurveId;
      if (perCurveActive) {
        const cur = curveScales[selectedCurveId!] ?? 1;
        setCurveScale(selectedCurveId!, scaleByWheel(cur, e.deltaY));
      } else if (globalScaleMode) {
        setGlobalScale(scaleByWheel(globalScale, e.deltaY));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [scaleModeActive, globalScaleMode, perCurveScaleMode, selectedCurveId, globalScale, curveScales, setCurveScale, setGlobalScale]);

  // Native mousedown for shift+drag pan (per-curve mode only)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !perCurveScaleMode || !selectedCurveId) return;

    const frame = {
      yMin: visibleYRange[0], yMax: visibleYRange[1],
      gridTop, gridBottom, chartHeight: chartDims.height,
    };

    const onMouseDown = (e: globalThis.MouseEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const startY = e.clientY;
      const startOffset = curveScaleOffsets[selectedCurveId!] ?? 0;

      const onMove = (ev: globalThis.MouseEvent) => {
        const next = offsetByDrag(startOffset, startY, ev.clientY, frame);
        setCurveScaleOffset(selectedCurveId!, next);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    container.addEventListener('mousedown', onMouseDown);
    return () => container.removeEventListener('mousedown', onMouseDown);
  }, [perCurveScaleMode, selectedCurveId, curveScaleOffsets, visibleYRange, gridTop, gridBottom, chartDims.height, setCurveScaleOffset]);

  // Double-click handler for reset
  const onChartDoubleClick = useCallback(() => {
    if (perCurveScaleMode && selectedCurveId) {
      setCurveScale(selectedCurveId, 1);
      setCurveScaleOffset(selectedCurveId, 0);
    } else if (globalScaleMode) {
      setGlobalScale(1);
    }
  }, [perCurveScaleMode, globalScaleMode, selectedCurveId, setCurveScale, setCurveScaleOffset, setGlobalScale]);

  const scaleBadge = scaleModeActive ? (
    globalScaleMode && !(perCurveScaleMode && selectedCurveId)
      ? `×${globalScale.toFixed(1)}`
      : perCurveScaleMode && selectedCurveId
      ? `×${((normalizeFactors[selectedCurveId] ?? 1) * globalScale * (curveScales[selectedCurveId] ?? 1)).toFixed(1)}`
      : null
  ) : null;

  const scaleBadgeOffset = perCurveScaleMode && selectedCurveId
    ? (curveScaleOffsets[selectedCurveId] ?? 0)
    : 0;

  const handleChartClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!chartInstance || visibleIds.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const plotW = chartDims.width - gridLeft - gridRight;
    const plotH = chartDims.height - gridTop - gridBottom;
    const dataX = xRange[0] + ((px - gridLeft) / plotW) * (xRange[1] - xRange[0]);
    const { yAxisMin, yAxisMax } = yAxisFullRange;
    const dataY = yAxisMax - ((py - gridTop) / plotH) * (yAxisMax - yAxisMin);

    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const id of visibleIds) {
      const curve = curves[id];
      if (!curve) continue;
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };
      const layerIndex = visibleIds.length - 1 - visibleIds.indexOf(id);
      const layerYOffset = layerIndex * layerSpacing * yAxisFullRange.yRangeForLayer;
      const normalize = normalizeFactors[id] ?? 1;
      const manual = curveScales[id] ?? 1;
      const composite = normalize * globalScale * manual;
      const scaleOffset = curveScaleOffsets[id] ?? 0;
      const data = curve.data;
      let lo = 0; let hi = data.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (data[mid][0] + offset.xOffset < dataX) lo = mid + 1;
        else hi = mid;
      }
      const idx = lo > 0 && lo < data.length &&
        Math.abs(data[lo][0] + offset.xOffset - dataX) > Math.abs(data[lo - 1][0] + offset.xOffset - dataX)
        ? lo - 1 : lo;
      if (idx < 0 || idx >= data.length) continue;
      const cy = data[idx][1] * composite + scaleOffset + layerYOffset + offset.yOffset;
      const dist = Math.abs(cy - dataY);
      if (dist < bestDist) { bestDist = dist; bestId = id; }
    }
    if (bestId) {
      setSelectedCurveId(selectedCurveId === bestId ? null : bestId);
    }
  }, [chartInstance, visibleIds, xRange, gridLeft, gridTop, gridRight, gridBottom,
      chartDims, yAxisFullRange, curves, offsets, layerSpacing, normalizeFactors,
      curveScales, globalScale, curveScaleOffsets, selectedCurveId, setSelectedCurveId]);

  return (
    <div className="relative w-full h-full" ref={chartContainerRef} onDoubleClick={scaleModeActive ? onChartDoubleClick : undefined} onClick={handleChartClick}>
      <ReactECharts
        option={option}
        replaceMerge={['series', 'dataZoom']}
        style={{ width: '100%', height: '100%' }}
        onChartReady={onChartReady}
        onEvents={{
          dataZoom: onDataZoom,
          click: (params: { seriesId?: string; seriesIndex?: number }) => {
            if (params.seriesIndex != null && params.seriesIndex >= 0 && params.seriesIndex < visibleIds.length) {
              const id = visibleIds[params.seriesIndex];
              if (selectedCurveId === id) {
                setSelectedCurveId(null);
              } else {
                setSelectedCurveId(id);
              }
            }
          },
        }}
      />
      {scaleBadge && (
        <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
          style={{ left: 8, top: gridTop }}>
          {scaleBadge}
          {scaleBadgeOffset !== 0 ? ` Δ${scaleBadgeOffset.toFixed(0)}` : ''}
        </div>
      )}
      <BraceOverlay
        width={chartDims.width}
        height={chartDims.height}
        convertXToPixel={convertXToPixel}
        convertPixelToX={convertPixelToX}
        xRange={xRange}
        gridTop={gridTop}
        braceY={braceY}
      />
      <PointLabelOverlay
        width={chartDims.width}
        height={chartDims.height}
        convertXToPixel={convertXToPixel}
        convertPixelToX={convertPixelToX}
        xRange={xRange}
        getLabelBaseYAtX={getLabelBaseYAtX}
        gridTop={gridTop}
        gridBottom={gridBottom}
        chartWidth={chartDims.width}
        gridLeft={gridLeft}
        gridRight={gridRight}
      />
      {manualMoveMode && (
        <ManualMoveOverlay
          chartWidth={chartDims.width}
          chartHeight={chartDims.height}
          xRange={xRange}
          gridLeft={gridLeft}
          gridRight={gridRight}
          gridTop={gridTop}
          gridBottom={gridBottom}
          visibleYMin={yAxisFullRange.yAxisMin}
          visibleYMax={yAxisFullRange.yAxisMax}
        />
      )}
      <div className="absolute top-1/2 right-1 -translate-y-1/2 h-3/5 flex flex-col items-center gap-1.5 pointer-events-none">
        <span className="text-[10px] text-gray-500 font-mono tabular-nums">
          {layerSpacing.toFixed(3)}
        </span>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.001}
          value={layerSpacing}
          onChange={(e) => setLayerSpacing(parseFloat(e.target.value))}
          className="layer-slider flex-1 w-3 pointer-events-auto"
          title="Y 轴层间距（占可见范围比例）"
        />
      </div>
    </div>
  );
}
