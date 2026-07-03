import { useMemo, useCallback, useEffect } from 'react';
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

const CURVE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf',
];

export default function WaterfallChart() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);
  const xRange = useUiStore((s) => s.xRange);

  // Initialize xRange from curve data (reliable, no ECharts dependency)
  useEffect(() => {
    const ids = Object.keys(curves);
    if (ids.length > 0) {
      const firstCurve = curves[ids[0]];
      if (firstCurve.data.length > 0) {
        const min = Math.floor(firstCurve.data[0][0]);
        const max = Math.ceil(firstCurve.data[firstCurve.data.length - 1][0]);
        useUiStore.getState().setXRange([min, max]);
      }
    }
  }, [curves]);

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartInstance = instance;
    // Chart is fully initialized, refine xRange to actual visible range
    const extent = getXAxisExtent();
    if (extent) useUiStore.getState().setXRange(extent);
  }, []);

  const onDataZoom = useCallback(() => {
    const extent = getXAxisExtent();
    if (extent) useUiStore.getState().setXRange(extent);
  }, []);

  const option: EChartsOption = useMemo(() => {
    const ids = Object.keys(curves);
    if (ids.length === 0) {
      return {
        title: {
          text: '尚未加载曲线数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#ccc', fontSize: 16 },
        },
      };
    }

    const series = ids.map((id, idx) => {
      const curve = curves[id];
      const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };

      const renderedData = curve.data.map(([x, y]) => [
        x + offset.xOffset,
        y + offset.yOffset,
      ]);

      return {
        name: curve.name,
        type: 'line' as const,
        data: renderedData,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: CURVE_COLORS[idx % CURVE_COLORS.length],
          width: 1.5,
        },
        large: true,
        sampling: 'lttb' as const,
      };
    });

    // Compute global x-range from all curves to set explicit axis min/max
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const id of ids) {
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
      tooltip: { show: false },
      legend: {
        show: ids.length > 1,
        top: 8,
        type: 'scroll',
      },
      grid: {
        left: 60,
        right: 30,
        top: ids.length > 1 ? 50 : 20,
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
  }, [curves, offsets]);

  const convertXToPixel = (xVal: number): number => {
    if (!chartInstance) return 0;
    const grid = (chartInstance.getOption() as Record<string, unknown>).grid as { left?: number; right?: number }[];
    const gridLeft = (grid?.[0]?.left as number) ?? 60;
    const gridRight = (grid?.[0]?.right as number) ?? 30;
    const chartWidth = chartInstance.getWidth();
    const range = xRange[1] - xRange[0] || 1;
    return gridLeft + ((xVal - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
  };

  const convertPixelToX = (px: number): number => {
    if (!chartInstance) return 0;
    const grid = (chartInstance.getOption() as Record<string, unknown>).grid as { left?: number; right?: number }[];
    const gridLeft = (grid?.[0]?.left as number) ?? 60;
    const gridRight = (grid?.[0]?.right as number) ?? 30;
    const chartWidth = chartInstance.getWidth();
    const range = xRange[1] - xRange[0] || 1;
    return xRange[0] + ((px - gridLeft) / (chartWidth - gridLeft - gridRight)) * range;
  };

  return (
    <div className="relative w-full h-full">
      <ReactECharts
        option={option}
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
    </div>
  );
}