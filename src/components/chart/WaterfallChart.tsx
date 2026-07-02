import { useMemo, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore } from '@/store';
import BraceOverlay from './BraceOverlay';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';

// Shared chart instance for PNG export
let chartInstance: EChartsInstance | null = null;
export function getChartInstance() {
  return chartInstance;
}

const CURVE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf',
];

export default function WaterfallChart() {
  const curves = useCurveStore((s) => s.curves);
  const offsets = useCurveStore((s) => s.offsets);
  const [xRange, setXRange] = useState<[number, number]>([0, 10]);

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartInstance = instance;
    // Get initial dataZoom range
    const option = instance.getOption() as {
      xAxis?: { min?: number; max?: number }[];
    };
    if (option.xAxis?.[0]) {
      setXRange([option.xAxis[0].min ?? 0, option.xAxis[0].max ?? 10]);
    }
  }, []);

  const onDataZoom = useCallback((params: unknown) => {
    const p = params as { start?: number; end?: number };
    if (p.start !== undefined && chartInstance) {
      const option = chartInstance.getOption() as {
        xAxis?: { min?: number; max?: number }[];
      };
      if (option.xAxis?.[0]) {
        setXRange([option.xAxis[0].min ?? 0, option.xAxis[0].max ?? 10]);
      }
    }
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

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const items = params as { seriesName: string; data: [number, number] }[];
          if (!items || items.length === 0) return '';
          const p = items[0];
          const id = ids.find((i) => curves[i].name === p.seriesName);
          const offset = id ? offsets[id] : { xOffset: 0, yOffset: 0 };
          if (!offset) return '';
          const xOriginal = p.data[0] - offset.xOffset;
          const yOriginal = p.data[1] - offset.yOffset;
          return `<strong>${p.seriesName}</strong><br/>
            原始 X: ${xOriginal.toFixed(4)}<br/>
            原始 Y: ${yOriginal.toFixed(4)}<br/>
            渲染 X: ${p.data[0].toFixed(4)}<br/>
            渲染 Y: ${p.data[1].toFixed(4)}`;
        },
      },
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
        notMerge
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