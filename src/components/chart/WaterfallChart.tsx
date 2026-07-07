import { useMemo, useCallback, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore, useUiStore } from '@/store';
import { CURVE_COLORS } from '@/lib/colors';
import BraceOverlay from './BraceOverlay';
import PointLabelOverlay from './PointLabelOverlay';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';
import { computeYAxisRange } from './computeYAxisRange';

// Shared chart instance for PNG export
let chartInstance: EChartsInstance | null = null;
export function getChartInstance() {
  return chartInstance;
}

/**
 * Proportion of the Y-axis reserved above the highest curve for labels
 * (brace text, point label boxes). Applied to both yMaxForAxis (yAxis max)
 * and maxY (label positioning baseline) so labels land in the reserved area.
 * Shared with exportImage.ts to keep export and on-screen rendering identical.
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

/** Read current Y-axis visible range from ECharts model */
function getYAxisExtent(): [number, number] | null {
  if (!chartInstance) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = chartInstance as any;
    const extent = chart.getModel()?.getComponent?.('yAxis', 0)?.axis?.scale?.getExtent?.();
    if (extent && extent.length === 2) return [extent[0] as number, extent[1] as number];
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
  const xRange = useUiStore((s) => s.xRange);
  const bracePlacementMode = useUiStore((s) => s.bracePlacementMode);
  const showGrid = useUiStore((s) => s.showGrid);
  const showAxes = useUiStore((s) => s.showAxes);

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

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartInstance = instance;
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

    // ── Compute explicit Y-axis bounds using fixed-point formula ──
    // We want: layerYOffset = layerIndex × layerSpacing × yRange
    // AND:     yRange = rawDataMax + (visibleCount-1) × layerSpacing × yRange
    // Solving: yRange = rawDataMax / (1 - (visibleCount-1) × layerSpacing)
    // This gives a STABLE, deterministic yRange that does NOT depend on
    // ECharts auto-scale, breaking the positive-feedback loop.
    const { yRangeForLayer, yAxisMin, yAxisMax } = computeYAxisRange(
      visibleIds,
      curves,
      offsets,
      xRange,
      layerSpacing,
    );

    const series = visibleIds.map((id, visibleIndex) => {
      const curve = curves[id];
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };

      const layerIndex = visibleCount - 1 - visibleIndex;
      const layerYOffset = layerIndex * layerSpacing * yRangeForLayer;

      const renderedData = curve.data.map(([x, y]) => [
        x + offset.xOffset,
        y + layerYOffset + offset.yOffset,
      ]);

      return {
        name: curve.displayName || curve.name,
        type: 'line' as const,
        data: renderedData,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: CURVE_COLORS[visibleIndex % CURVE_COLORS.length],
          width: 1.5,
        },
        large: true,
        sampling: 'lttb' as const,
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
        show: showAxes,
        name: showAxes ? '强度' : '',
        nameLocation: 'center',
        nameGap: 45,
        // Explicit bounds — prevents ECharts auto-scale from drifting.
        min: yAxisMin,
        max: yAxisMax,
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
  }, [curves, offsets, visibleCurves, layerSpacing, stagingOrder, visibleIds, xRange, bracePlacementMode, showGrid, showAxes]);

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

  const convertYToPixel = (yVal: number): number => {
    if (!chartInstance) return 0;
    const yExtent = getYAxisExtent();
    if (!yExtent) return 0;
    const option = chartInstance.getOption() as Record<string, unknown>;
    const grid = (option.grid as { top?: number; bottom?: number }[])?.[0];
    const gridTop = typeof grid?.top === 'number' ? grid.top : (visibleIds.length > 1 ? 50 : 20);
    const gridBottom = typeof grid?.bottom === 'number' ? grid.bottom : 60;
    const chartHeight = chartInstance.getHeight();
    const range = yExtent[1] - yExtent[0] || 1;
    return gridTop + ((yExtent[1] - yVal) / range) * (chartHeight - gridTop - gridBottom);
  };

  // maxY for label positioning — uses the same fixed-point formula as the
  // option useMemo so labels always sit at the top of the highest curve.
  const maxY = useMemo(() => {
    const { maxY } = computeYAxisRange(
      visibleIds,
      curves,
      offsets,
      xRange,
      layerSpacing,
    );
    return maxY;
  }, [curves, offsets, visibleIds, layerSpacing, xRange]);

  const braceY = Math.max(
    (visibleIds.length > 1 ? 50 : 20) + 5,
    convertYToPixel(maxY) - 18,
  );

  const topCurvePixelY = convertYToPixel(maxY);

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
        width={chartInstance?.getWidth() ?? 800}
        height={chartInstance?.getHeight() ?? 600}
        convertXToPixel={convertXToPixel}
        convertPixelToX={convertPixelToX}
        xRange={xRange}
        gridTop={visibleIds.length > 1 ? 50 : 20}
        braceY={braceY}
      />
      <PointLabelOverlay
        width={chartInstance?.getWidth() ?? 800}
        height={chartInstance?.getHeight() ?? 600}
        convertXToPixel={convertXToPixel}
        convertPixelToX={convertPixelToX}
        xRange={xRange}
        topCurvePixelY={topCurvePixelY}
        gridTop={visibleIds.length > 1 ? 50 : 20}
      />
      <div className="absolute top-1/2 right-1 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
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
          className="layer-slider h-3/5 w-3 pointer-events-auto"
          title="Y 轴层间距（占可见范围比例）"
        />
      </div>
    </div>
  );
}
