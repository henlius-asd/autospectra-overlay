import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore, useUiStore } from '@/store';
import BraceOverlay from './BraceOverlay';
import PointLabelOverlay from './PointLabelOverlay';
import YRangeSlider from './YRangeSlider';
import CurveScaleOverlay from './CurveScaleOverlay';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';
import { computeYAxisRange } from './computeYAxisRange';
import { resolveYAxis } from './resolveYAxis';
import { yToPixel } from './yPixelMath';
import { getTopCurvePixelYAtX, topCurvePeak } from './labelGeometry';

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
  const setCurveScale = useCurveStore((s) => s.setCurveScale);
  const setCurveScaleOffset = useCurveStore((s) => s.setCurveScaleOffset);
  const xRange = useUiStore((s) => s.xRange);
  const yScaleToolMode = useUiStore((s) => s.yScaleToolMode);
  const activeScaledCurveId = useUiStore((s) => s.activeScaledCurveId);
  const setActiveScaledCurveId = useUiStore((s) => s.setActiveScaledCurveId);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const showGrid = useUiStore((s) => s.showGrid);
  const showAxes = useUiStore((s) => s.showAxes);
  const yZoomRange = useUiStore((s) => s.yZoomRange);
  const setYZoomRange = useUiStore((s) => s.setYZoomRange);
  const resetYZoomRange = useUiStore((s) => s.resetYZoomRange);

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
    // Chart is fully initialized, refine xRange to actual visible range.
    const xExtent = getXAxisExtent();
    if (xExtent) useUiStore.getState().setXRange(xExtent);
  }, []);

  const onDataZoom = useCallback(() => {
    // Only the X axis zooms; Y bounds are fixed by explicit min/max, so we
    // only need to sync xRange here.
    const xExtent = getXAxisExtent();
    if (xExtent) useUiStore.getState().setXRange(xExtent);
  }, []);

  const rangeResult = useMemo(
    () => computeYAxisRange(visibleIds, curves, offsets, xRange, layerSpacing),
    [visibleIds, curves, offsets, xRange, layerSpacing],
  );
  const resolvedFrame = useMemo(
    () => resolveYAxis(rangeResult, yZoomRange),
    [rangeResult, yZoomRange],
  );

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

    const { yRangeForLayer } = rangeResult;

    const series = visibleIds.map((id, visibleIndex) => {
      const curve = curves[id];
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };

      const layerIndex = visibleCount - 1 - visibleIndex;
      const layerYOffset = layerIndex * layerSpacing * yRangeForLayer;

      const scale = curveScales[id] ?? 1;
      const scaleOffset = curveScaleOffsets[id] ?? 0;
      const renderedData = curve.data.map(([x, y]) => [
        x + offset.xOffset,
        y * scale + scaleOffset + layerYOffset + offset.yOffset,
      ]);

      return {
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
        clip: true,
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
      },
      grid: {
        left: 60,
        right: 48,
        top: visibleIds.length > 1 ? 50 : 20,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        // @deprecated Axes hidden by default; will be removed in future version
        show: showAxes,
        name: showAxes ? '时间' : '',
        nameLocation: 'center',
        nameGap: 35,
        min: xMin,
        max: xMax,
        axisLine: { show: showAxes },
        axisTick: { show: showAxes },
        axisLabel: { show: showAxes },
        splitLine: { show: showGrid },
      },
      yAxis: {
        type: 'value',
        // @deprecated Axes hidden by default; will be removed in future version
        show: showAxes,
        name: showAxes ? '强度' : '',
        nameLocation: 'center',
        nameGap: 45,
        // Explicit bounds — prevents ECharts auto-scale from drifting.
        min: resolvedFrame.yMin,
        max: resolvedFrame.yMax,
        axisLine: { show: showAxes },
        axisTick: { show: showAxes },
        axisLabel: { show: showAxes },
        splitLine: { show: showGrid },
      },
      dataZoom: bracePlacementMode
        ? [{ type: 'slider', xAxisIndex: 0, bottom: 10 }]
        : [
            // X-axis zoom only. Y-axis bounds are computed explicitly (with a
            // reserved label area on top); enabling y-axis zoom would let the
            // user drag curves out of the reserved region and misalign labels.
            { type: 'inside', xAxisIndex: 0 },
            { type: 'slider', xAxisIndex: 0, bottom: 10 },
          ],
      series,
      animation: false,
    };
  }, [curves, offsets, visibleCurves, layerSpacing, stagingOrder, visibleIds, xRange, yZoomRange, bracePlacementMode, showGrid, showAxes, rangeResult, resolvedFrame]);

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

  const convertYToPixel = (yVal: number): number =>
    yToPixel(yVal, {
      yMin: resolvedFrame.yMin,
      yMax: resolvedFrame.yMax,
      gridTop,
      gridBottom,
      chartHeight: chartDims.height,
    });
  const peak = topCurvePeak(rangeResult.rawDataMin, rangeResult.yRangeForLayer);

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
        yRangeForLayer: rangeResult.yRangeForLayer,
      },
      convertYToPixel,
    );

  return (
    <div className="relative w-full h-full">
      <ReactECharts
        option={option}
        replaceMerge={['series']}
        style={{ width: '100%', height: '100%' }}
        onChartReady={onChartReady}
        onEvents={{ dataZoom: onDataZoom }}
      />
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
      <YRangeSlider
        chartWidth={chartDims.width}
        chartHeight={chartDims.height}
        gridTop={gridTop}
        gridBottom={gridBottom}
        gridLeft={gridLeft}
        resolvedFrame={resolvedFrame}
        fullRange={rangeResult}
        yZoomRange={yZoomRange}
        setYZoomRange={setYZoomRange}
        resetYZoomRange={resetYZoomRange}
      />
      {yScaleToolMode && activeScaledCurveId && (
        <CurveScaleOverlay
          curveId={activeScaledCurveId}
          curves={curves}
          offsets={offsets}
          curveScales={curveScales}
          curveScaleOffsets={curveScaleOffsets}
          xRange={xRange}
          chartHeight={chartDims.height}
          gridTop={gridTop}
          gridBottom={gridBottom}
          resolvedFrame={resolvedFrame}
          setCurveScale={setCurveScale}
          setCurveScaleOffset={setCurveScaleOffset}
          onDeselect={() => setActiveScaledCurveId(null)}
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
