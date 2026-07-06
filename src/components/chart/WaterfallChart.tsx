import { useMemo, useCallback, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore, useUiStore } from '@/store';
import BraceOverlay from './BraceOverlay';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';

// Shared chart instance for PNG export
let chartInstance: EChartsInstance | null = null;
export function getChartInstance() {
  return chartInstance;
}

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

const CURVE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf',
];

export default function WaterfallChart() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);
  const visibleCurves = useCurveStore((s) => s.visibleCurves);
  const stagingOrder = useCurveStore((s) => s.stagingOrder);
  const layerSpacing = useCurveStore((s) => s.layerSpacing);
  const setLayerSpacing = useCurveStore((s) => s.setLayerSpacing);
  const xRange = useUiStore((s) => s.xRange);
  const yRange = useUiStore((s) => s.yRange);

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
    // Chart is fully initialized, refine xRange/yRange to actual visible range
    const xExtent = getXAxisExtent();
    if (xExtent) useUiStore.getState().setXRange(xExtent);
    const yExtent = getYAxisExtent();
    if (yExtent) useUiStore.getState().setYRange(yExtent);
  }, []);

  const onDataZoom = useCallback(() => {
    const xExtent = getXAxisExtent();
    if (xExtent) useUiStore.getState().setXRange(xExtent);
    const yExtent = getYAxisExtent();
    if (yExtent) useUiStore.getState().setYRange(yExtent);
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
    const visibleYRange = (yRange[1] - yRange[0]) || 1;

    const series = visibleIds.map((id, visibleIndex) => {
      const curve = curves[id];
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };

      // Unified layer formula: baseline is visibleIds[last] (layerIndex 0, offset 0),
      // curves stack upward with increasing layerIndex.
      const layerIndex = visibleCount - 1 - visibleIndex;
      const layerYOffset = layerIndex * layerSpacing * visibleYRange;

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
        name: '时间',
        nameLocation: 'center',
        nameGap: 35,
        min: xMin,
        max: xMax,
      },
      yAxis: {
        type: 'value',
        name: '强度',
        nameLocation: 'center',
        nameGap: 45,
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, bottom: 10 },
      ],
      series,
      animation: false,
    };
  }, [curves, offsets, visibleCurves, layerSpacing, stagingOrder, visibleIds, yRange]);

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
      />
      <input
        type="range"
        min={-0.5}
        max={0.5}
        step={0.01}
        value={layerSpacing}
        onChange={(e) => setLayerSpacing(parseFloat(e.target.value))}
        className="absolute top-1/2 right-1 -translate-y-1/2 h-3/5 w-3"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: '#3b82f6' }}
        title="Y 轴层间距（占可见范围比例）"
      />
    </div>
  );
}
