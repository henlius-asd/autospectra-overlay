import { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCurveStore, useUiStore } from '@/store';
import BraceOverlay from './BraceOverlay';
import PointLabelOverlay from './PointLabelOverlay';
import ManualMoveOverlay from './ManualMoveOverlay';
import HudShortcuts from '@/components/ui/HudShortcuts';
import type { EChartsOption } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';
import { computeYAxisRange } from './computeYAxisRange';
import { resolveLineStyle } from './resolveLineStyle';
import { yToPixel, pixelToY } from './yPixelMath';
import { topCurvePeak } from './labelGeometry';
import { BRACE_HEIGHT, BRACE_LABEL_GAP } from './bracePath';
import { scaleByWheel, offsetByDrag } from './curveScaleMath';
import { buildViewportRestoreActions, dispatchRangeToIds, X_ZOOM_IDS, Y_ZOOM_IDS } from './viewportRestore';
import { themeColors, themeFontFamily } from '@/lib/theme';

// Shared chart instance for PNG export
let chartInstance: EChartsInstance | null = null;
export function getChartInstance() {
  return chartInstance;
}

// DEV-only test seam: exposes the ui store + live axis extents to window so
// e2e (Playwright) can assert viewport-preservation behavior without reaching
// into internals. The `typeof window` check keeps vitest (node) from crashing
// when this module is imported transitively; `import.meta.env.DEV` strips it
// from production builds.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.__autospectra = {
    getXExtent: () => getXAxisExtent(),
    getYExtent: () => getYAxisExtent(),
    getUiState: () => useUiStore.getState(),
    getChartSize: () => (chartInstance ? { width: chartInstance.getWidth(), height: chartInstance.getHeight() } : null),
    // DEV-only: drive a chart-originated dataZoom so e2e can reproduce the
    // xZoomRangeSource residue race (H4) without real pointer interaction.
    dispatchXZoom: (start: number, end: number) => {
      if (!chartInstance) return;
      chartInstance.dispatchAction({ type: 'dataZoom', dataZoomId: 'xZoom', startValue: start, endValue: end });
      chartInstance.dispatchAction({ type: 'dataZoom', dataZoomId: 'xZoomSlider', startValue: start, endValue: end });
    },
  };
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

/** Read current Y-axis visible range from ECharts model */
function getYAxisExtent(): [number, number] | null {
  if (!chartInstance) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = chartInstance as any;
    const extent = chart.getModel()?.getComponent?.('yAxis', 0)?.axis?.scale?.getExtent?.();
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
  const curveScales = useCurveStore((s) => s.curveScales);
  const curveScaleOffsets = useCurveStore((s) => s.curveScaleOffsets);
  const normalizeFactors = useCurveStore((s) => s.normalizeFactors);
  const globalScale = useCurveStore((s) => s.globalScale);
  const setCurveScale = useCurveStore((s) => s.setCurveScale);
  const setCurveScaleOffset = useCurveStore((s) => s.setCurveScaleOffset);
  const setGlobalScale = useCurveStore((s) => s.setGlobalScale);
  const xRange = useUiStore((s) => s.xRange);
  const interactionMode = useUiStore((s) => s.interactionMode);
  const setInteractionMode = useUiStore((s) => s.setInteractionMode);
  const spaceHeld = useUiStore((s) => s.spaceHeld);
  const selectedCurveId = useUiStore((s) => s.selectedCurveId);
  const setSelectedCurveId = useUiStore((s) => s.setSelectedCurveId);
  const scaleModeActive = interactionMode === 'zoomGlobal' || interactionMode === 'zoomCurve';
  const showGrid = useUiStore((s) => s.showGrid);
  const showXAxis = useUiStore((s) => s.showXAxis);
  const showYAxis = useUiStore((s) => s.showYAxis);
  const showLegend = useUiStore((s) => s.showLegend);
  const lineStyle = useUiStore((s) => s.lineStyle);
  const yZoomRange = useUiStore((s) => s.yZoomRange);
  // Last X/Y range the CHART itself reported via onDataZoom. The [xRange]/
  // [yZoomRange] restore effects skip re-dispatch only when the current store
  // value EQUALS this (the change originated from the chart, so pushing it
  // back would jitter). A boolean 'event' flag could go stale and swallow a
  // legitimate external override landing in the same React batch (H4):
  // chart dataZoom sets source='event' + writes store=A, then an external
  // setXRange(B) lands in the same commit; the effect saw source='event' and
  // skipped dispatching B, leaving the chart at A while the store held B.
  const lastChartXRange = useRef<[number, number] | null>(null);
  const lastChartYZoom = useRef<[number, number] | null>(null);
  const brushRafId = useRef<number | null>(null);
  const hasMountedViewport = useRef(false);
  // Set to true inside the option useMemo (which runs during render, BEFORE
  // echarts-for-react's componentDidUpdate calls setOption). onDataZoom checks
  // this and skips store writes during the option-rebuild cycle so the
  // pre-rebuild xRange/yZoomRange survive for the viewport useLayoutEffect to
  // restore. Cleared by a layout effect that runs after all child updates.
  const isOptionRebuilding = useRef(false);

  function isChartReady(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!chartInstance && !(chartInstance as any).isDisposed?.();
  }

  // visibleIds follows stagingOrder (only IDs that are in stagingOrder AND visible)
  // visibleIds[0] = top of list = top of chart; visibleIds[last] = bottom (baseline)
  const visibleIds = stagingOrder.filter((id) => visibleCurves[id]);

  // Seed xRange only when visible curves appear for the first time after a period
  // of having none. Visibility toggles (add/remove from overlay, select/deselect all)
  // must NOT overwrite xRange — the ECharts dataZoom viewport is preserved by
  // replaceMerge, and overwriting the store value here would desync ROI from the
  // on-screen visible range. onChartReady/onDataZoom remain the sources of truth for
  // the live visible range; this effect only provides the initial seed.
  //
  // Hydration guard: if xRange was already restored from a persisted workspace
  // (or set by the user), do NOT overwrite it — that was the root cause of
  // "refresh loses the X zoom": restoreWorkspace wrote the persisted xRange, then
  // this effect ran on the none→some curve transition and clobbered it with the
  // full data extent. xRangeHydrated is the single signal that the viewport has
  // been meaningfully set; only a fresh app (or a new-workspace reset) leaves it
  // false so the seed can run.
  const hasInitializedXRange = useRef(false);
  useEffect(() => {
    if (visibleIds.length === 0) {
      // No visible curves: allow the next appearance to re-seed xRange — but
      // only if the viewport isn't already hydrated (restore/user-set).
      hasInitializedXRange.current = false;
      return;
    }
    if (hasInitializedXRange.current) return;
    hasInitializedXRange.current = true;
    if (useUiStore.getState().xRangeHydrated) {
      // Viewport already restored/set — keep it, do not re-seed.
      return;
    }

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

  // DEV-only: mirror chartDims to the test seam so e2e can assert it tracks
  // container resizes (the H5 overlay-drift root cause is this React state
  // staying stale while the ECharts canvas auto-resizes).
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__autospectra.__chartDims = chartDims;
    }
  }, [chartDims]);

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartInstance = instance;
    setChartDims({ width: instance.getWidth(), height: instance.getHeight() });
    // Only seed X from the live extent on a genuinely fresh viewport; never
    // clobber a restored/user xRange (mirrors the seed-effect hydration guard).
    const xExtent = getXAxisExtent();
    if (xExtent && !useUiStore.getState().xRangeHydrated) {
      useUiStore.getState().setXRange(xExtent);
    }
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

  const onDataZoom = useCallback((_e: unknown) => {
    // Skip store writes during option-rebuild setOption cycle — the dataZoom
    // is rebuilt to full and we don't want that transient full to overwrite
    // the user's viewport. The viewport useLayoutEffect restores after.
    if (isOptionRebuilding.current) return;
    const xExtent = getXAxisExtent();
    const yExtent = getYAxisExtent();
    const currentXRange = useUiStore.getState().xRange;
    const currentYZoom = useUiStore.getState().yZoomRange;
    const xChanged = xExtent && (xExtent[0] !== currentXRange[0] || xExtent[1] !== currentXRange[1]);
    const EPS = 1e-10;
    const yChanged = yExtent && (!currentYZoom
      || Math.abs(currentYZoom[0] - yExtent[0]) > EPS
      || Math.abs(currentYZoom[1] - yExtent[1]) > EPS);

    if (xChanged || yChanged) {
      // Record what the CHART reported so the restore effects can tell a
      // chart-originated change (skip re-dispatch) from an external one.
      if (xChanged) lastChartXRange.current = xExtent!;
      if (yChanged) lastChartYZoom.current = yExtent!;
      useUiStore.setState({
        ...(xChanged ? { xRange: xExtent! } : {}),
        ...(yChanged ? { yZoomRange: yExtent! } : {}),
      });
    }
  }, []);

  const yAxisFullRange = useMemo(() =>
    computeYAxisRange(
      visibleIds, curves, offsets, layerSpacing,
    ),
    [visibleIds, curves, offsets, layerSpacing],
  );

  // Restore persisted yZoomRange to the dataZoom synchronously in the commit
  // phase (useLayoutEffect), BEFORE paint and BEFORE ECharts' async dataZoom
  // event from the option rebuild fires. As a useEffect (after paint) the
  // rebuild's transient full-range event could land first and overwrite a
  // restored viewport via onDataZoom. Skip re-dispatch only when this change
  // came FROM the chart (value matches lastChartYZoom) to avoid feedback
  // jitter during user zoom — a value comparison, not a stale boolean flag,
  // so an external override in the same batch is never swallowed (H4).
  useLayoutEffect(() => {
    const fromChart = lastChartYZoom.current != null
      && yZoomRange != null
      && yZoomRange[0] === lastChartYZoom.current[0]
      && yZoomRange[1] === lastChartYZoom.current[1];
    lastChartYZoom.current = null;
    if (fromChart) return;
    if (yZoomRange && isChartReady()) {
      dispatchRangeToIds(
        (a) => chartInstance!.dispatchAction({ type: 'dataZoom', ...a }),
        Y_ZOOM_IDS,
        yZoomRange,
      );
    }
  }, [yZoomRange]);

  // Restore persisted xRange to dataZoom when it changes externally
  // (e.g., workspace load restore). Runs in the commit phase (useLayoutEffect)
  // so the chart is at the restored range BEFORE ECharts' async dataZoom event
  // from the option rebuild can overwrite it via onDataZoom. Mirrors the
  // [yZoomRange] effect; skip re-dispatch only when this change came FROM the
  // chart (value matches lastChartXRange) to avoid jitter — value comparison,
  // not a stale boolean flag, so an external override in the same batch is
  // never swallowed (H4).
  useLayoutEffect(() => {
    const fromChart = lastChartXRange.current != null
      && xRange[0] === lastChartXRange.current[0]
      && xRange[1] === lastChartXRange.current[1];
    lastChartXRange.current = null;
    if (fromChart) return;
    if (isChartReady()) {
      dispatchRangeToIds(
        (a) => chartInstance!.dispatchAction({ type: 'dataZoom', ...a }),
        X_ZOOM_IDS,
        xRange,
      );
    }
  }, [xRange]);

  // Preserve the X/Y dataZoom viewport across interaction-mode and spaceHeld
  // transitions. These transitions flip the dataZoom `type` (inside <-> hidden
  // slider), which makes ECharts rebuild the affected dataZoom components and
  // discard their internal start/end. We re-apply the store's xRange/yZoomRange
  // via synchronous dispatchAction in a useLayoutEffect — this runs AFTER
  // echarts-for-react's componentDidUpdate (which calls setOption/rebuild, and
  // runs synchronously before paint since it's a class lifecycle) but BEFORE
  // the browser paints, so the user never sees the intermediate full-range.
  // Deps are intentionally only [interactionMode, spaceHeld] so wheel/slider
  // zoom (xRange/yZoomRange changes) does NOT re-dispatch and fight ECharts
  // internal state (jitter); values are read fresh via useUiStore.getState().
  useLayoutEffect(() => {
    if (!hasMountedViewport.current) {
      hasMountedViewport.current = true;
      return;
    }
    if (!isChartReady()) return;
    const { xRange, yZoomRange } = useUiStore.getState();
    const actions = buildViewportRestoreActions({ xRange, yZoomRange });
    for (const action of actions) {
      try {
        chartInstance!.dispatchAction({ type: 'dataZoom', ...action });
      } catch {
        // Instance may be disposed during HMR / React StrictMode double-invoke
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionMode, spaceHeld]);

  // Clear the option-rebuild guard after all layout effects (runs on every
  // render, after child componentDidUpdate + viewport restore). Declared
  // after the viewport useLayoutEffect so it runs last.
  useLayoutEffect(() => {
    isOptionRebuilding.current = false;
  });

  const option: EChartsOption = useMemo(() => {
    // Mark that we're rebuilding the option. echarts-for-react's
    // componentDidUpdate will call setOption (rebuilding dataZoom to full)
    // AFTER this render but BEFORE our layout effects. onDataZoom checks
    // this flag and skips store writes during that rebuild so the
    // pre-rebuild viewport survives for the viewport useLayoutEffect.
    isOptionRebuilding.current = true;
    if (visibleIds.length === 0) {
      return {
        title: {
          text: '尚未加载曲线数据',
          left: 'center',
          top: 'center',
          textStyle: { color: themeColors.inkFaint, fontSize: 16, fontFamily: themeFontFamily },
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

      const resolvedLineStyle = resolveLineStyle(curve.lineStyle, lineStyle);

      return {
        id,
        name: curve.displayName || curve.name,
        type: 'line' as const,
        data: renderedData,
        smooth: false,
        symbol: 'circle',
        showSymbol: false,
        itemStyle: { color: resolvedLineStyle.color },
        lineStyle: {
          color: resolvedLineStyle.color,
          width: resolvedLineStyle.width,
          type: resolvedLineStyle.type,
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
      textStyle: { fontFamily: themeFontFamily },
legend: {
        show: showLegend && visibleIds.length > 1,
        top: 8,
        type: 'scroll',
        icon: 'inherit',
        itemWidth: 20,
        itemHeight: 14,
        textStyle: { color: themeColors.inkMuted },
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
        axisLine: { show: showXAxis, onZero: false, lineStyle: { color: themeColors.lineStrong } },
        axisTick: { show: showXAxis, lineStyle: { color: themeColors.lineStrong } },
        axisLabel: { show: showXAxis, color: themeColors.inkMuted },
        splitLine: { show: showGrid, lineStyle: { color: themeColors.line } },
      },
      yAxis: {
        type: 'value',
        show: showYAxis,
        name: showYAxis ? '强度' : '',
        nameLocation: 'center',
        nameGap: 45,
        min: yAxisFullRange.yAxisMin,
        max: yAxisFullRange.yAxisMax,
        axisLine: { show: showYAxis, lineStyle: { color: themeColors.lineStrong } },
        axisTick: { show: showYAxis, lineStyle: { color: themeColors.lineStrong } },
        axisLabel: { show: showYAxis, color: themeColors.inkMuted },
        splitLine: { show: showGrid, lineStyle: { color: themeColors.line } },
      },
      dataZoom: (() => {
        if (interactionMode === 'brace') {
          return [{ id: 'xZoomSlider', type: 'slider', xAxisIndex: 0, bottom: 10 }];
        }
        const disableInside = interactionMode !== 'select' && !spaceHeld;
        // Keep `type: 'inside'` and use `disabled: true` instead of switching to
        // `type: 'slider' (show: false)`. Changing the dataZoom type recreates
        // the component in ECharts and RESETS the zoom range (start/end), which
        // desynchronises `convertYToPixel` (uses stored yZoomRange) from the
        // actual chart rendering — causing point labels / braces to jump when
        // the mode switches back and the zoom is restored. `disabled: true`
        // prevents user wheel/drag zoom while preserving the zoom range.
        const xInside = disableInside
          ? { id: 'xZoom', type: 'inside' as const, xAxisIndex: 0, disabled: true }
          : { id: 'xZoom', type: 'inside' as const, xAxisIndex: 0 };
        const xZoom: EChartsOption['dataZoom'] = [
          xInside,
          { id: 'xZoomSlider', type: 'slider', xAxisIndex: 0, bottom: 10 },
        ];
        const yMinSpan = 0.05 * (yAxisFullRange.dataSpan || 1);
        const yInside: Record<string, unknown> = disableInside
          ? { id: 'yZoom', type: 'inside', yAxisIndex: 0, filterMode: 'none', minValueSpan: yMinSpan, disabled: true }
          : { id: 'yZoom', type: 'inside', yAxisIndex: 0, filterMode: 'none', minValueSpan: yMinSpan };
        const ySlider: Record<string, unknown> = {
          id: 'yZoomSlider', type: 'slider', yAxisIndex: 0, orient: 'vertical',
          left: 60 - 14 - 4, width: 14, filterMode: 'none', minValueSpan: yMinSpan,
        };
        return [...xZoom, yInside, ySlider] as EChartsOption['dataZoom'];
      })(),
      series,
      animation: false,
      ...(interactionMode === 'brush' ? {
        brush: {
          brushType: 'rect' as const,
          brushMode: 'single' as const,
          removeOnClick: true,
          xAxisIndex: 0,
          yAxisIndex: 0,
        },
      } : {}),
    };

  }, [curves, offsets, visibleCurves, layerSpacing, stagingOrder, visibleIds, interactionMode, spaceHeld, showGrid, showXAxis, showYAxis, showLegend, lineStyle, curveScales, curveScaleOffsets, normalizeFactors, globalScale]);

  // Activate ECharts brush via takeGlobalCursor dispatch.
  // Without toolbox, brushModel.brushOption stays empty and enableBrush never
  // registers pointer handlers. takeGlobalCursor is the official API the toolbox
  // uses to activate brush interaction. Deactivation is handled automatically
  // by brush component disposal via replaceMerge, so we only dispatch on activation.
  useEffect(() => {
    if (!chartInstance || interactionMode !== 'brush') return;
    try {
      chartInstance.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: { brushType: 'rect', brushMode: 'single' },
      });
    } catch {
      // Instance may be disposed during HMR / StrictMode double-invoke
    }
  }, [interactionMode]);

  // Cancel any pending brush zoom rAF on unmount
  useEffect(() => {
    return () => {
      if (brushRafId.current !== null) {
        cancelAnimationFrame(brushRafId.current);
        brushRafId.current = null;
      }
    };
  }, []);

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
  const convertPixelToY = (py: number): number =>
    pixelToY(py, {
      yMin: visibleYRange[0],
      yMax: visibleYRange[1],
      gridTop,
      gridBottom,
      chartHeight: chartDims.height,
    });
  const peak = topCurvePeak(yAxisFullRange.rawDataMin, yAxisFullRange.yRangeForLayer);

  const widthRatio = Math.min(1, Math.max(0, (chartDims.width - 900) / 700));
  const gridLeft = Math.round(40 + widthRatio * 20);
  const gridRight = Math.round(32 + widthRatio * 16);
  const gridBottom = Math.round(40 + widthRatio * 20);
  const gridTop = visibleIds.length > 1
    ? Math.round(40 + widthRatio * 10)
    : Math.round(15 + widthRatio * 5);

  // Default brace baseline: horizontal line sits ~HOOK_H above the top curve peak
  // (so hooks reach down toward the curve), while the spike (y - SPIKE_H) and
  // the label above it stay below gridTop. Braces are freely draggable via
  // brace.yOffset, so this only fixes the initial position of a newly placed brace.
  const braceY = Math.max(gridTop + BRACE_HEIGHT / 2 + BRACE_LABEL_GAP + 2, convertYToPixel(peak) - BRACE_HEIGHT / 2);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Keep chartDims (React state) in sync with the container size. The ECharts
  // canvas auto-resizes (echarts-for-react), but chartDims is consumed by
  // convertYToPixel, the grid-top/bottom/left/right math, handleChartClick,
  // and every overlay — so without this it stays stale after a window or
  // side-panel resize and overlays/click-targeting drift relative to the
  // curves. setChartDims triggers a re-render that recomputes the grid math.
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const width = Math.round(cr.width);
      const height = Math.round(cr.height);
      setChartDims((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Native wheel listener for scaling (non-passive so preventDefault works)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !scaleModeActive) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const perCurveActive = interactionMode === 'zoomCurve' && selectedCurveId;
      if (perCurveActive) {
        const cur = curveScales[selectedCurveId!] ?? 1;
        setCurveScale(selectedCurveId!, scaleByWheel(cur, e.deltaY));
      } else if (interactionMode === 'zoomGlobal') {
        setGlobalScale(scaleByWheel(globalScale, e.deltaY));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [scaleModeActive, interactionMode, selectedCurveId, globalScale, curveScales, setCurveScale, setGlobalScale]);

  // Native mousedown for shift+drag pan (per-curve mode only)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || interactionMode !== 'zoomCurve' || !selectedCurveId) return;

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
  }, [interactionMode, selectedCurveId, curveScaleOffsets, visibleYRange, gridTop, gridBottom, chartDims.height, setCurveScaleOffset]);

  // Double-click handler for reset
  const onChartDoubleClick = useCallback(() => {
    if (interactionMode === 'zoomCurve' && selectedCurveId) {
      setCurveScale(selectedCurveId, 1);
      setCurveScaleOffset(selectedCurveId, 0);
    } else if (interactionMode === 'zoomGlobal') {
      setGlobalScale(1);
    }
  }, [interactionMode, selectedCurveId, setCurveScale, setCurveScaleOffset, setGlobalScale]);

  const scaleBadge = scaleModeActive ? (
    interactionMode === 'zoomGlobal'
      ? `×${globalScale.toFixed(1)}`
      : interactionMode === 'zoomCurve' && selectedCurveId
      ? `×${((normalizeFactors[selectedCurveId] ?? 1) * globalScale * (curveScales[selectedCurveId] ?? 1)).toFixed(1)}`
      : null
  ) : null;

  const scaleBadgeOffset = interactionMode === 'zoomCurve' && selectedCurveId
    ? (curveScaleOffsets[selectedCurveId] ?? 0)
    : 0;

  const handleBrushSelected = useCallback((params: { areas?: Array<Record<string, unknown>> }) => {
    const areas = params.areas;
    if (!areas || areas.length === 0) return;
    const area = areas[0];
    const coordRange = area.coordRange as unknown;
    if (!coordRange) return;
    // For rect type, coordRange is [[xMin, xMax], [yMin, yMax]]
    let xMin: number, xMax: number, yMin: number, yMax: number;
    if (Array.isArray((coordRange as unknown[])[0])) {
      const cr = coordRange as number[][];
      [xMin, xMax] = cr[0];
      [yMin, yMax] = cr[1];
    } else {
      const cr = coordRange as number[];
      [xMin, xMax, yMin, yMax] = cr;
    }

    useUiStore.getState().setXRange([xMin, xMax]);
    useUiStore.getState().setYZoomRange([yMin, yMax]);
    setInteractionMode('select');

    // Defer dataZoom dispatch to after React re-render + echarts-for-react setOption
    // (which replaces the dataZoom array via replaceMerge, losing any setOption ranges).
    // Using dispatchAction after rAF ensures the zoom persists past the re-render.
    // Dispatch via the shared helper + canonical IDs (no hand-written literals).
    brushRafId.current = requestAnimationFrame(() => {
      brushRafId.current = null;
      if (!chartInstance) return;
      // Capture the narrowed instance so the dispatch closure stays non-null
      // (TS does not carry mutable-module narrowing into nested arrows).
      const chart = chartInstance;
      const dispatch = (a: { dataZoomId: string; startValue: number; endValue: number }) =>
        chart.dispatchAction({ type: 'dataZoom', ...a });
      dispatchRangeToIds(dispatch, X_ZOOM_IDS, [xMin, xMax]);
      dispatchRangeToIds(dispatch, Y_ZOOM_IDS, [yMin, yMax]);
    });
  }, [setInteractionMode]);

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
        replaceMerge={['series', 'dataZoom', 'brush']}
        style={{ width: '100%', height: '100%' }}
        onChartReady={onChartReady}
        onEvents={{
          dataZoom: onDataZoom,
          brushEnd: handleBrushSelected,
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
        <div className="absolute text-xs font-mono text-accent-strong bg-canvas/80 px-1 rounded pointer-events-none"
          style={{ left: 8, top: gridTop }}>
          {scaleBadge}
          {scaleBadgeOffset !== 0 ? ` Δ${scaleBadgeOffset.toFixed(0)}` : ''}
        </div>
      )}
      <HudShortcuts />
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
        convertYToPixel={convertYToPixel}
        convertPixelToY={convertPixelToY}
        xRange={xRange}
        gridTop={gridTop}
      />
      {interactionMode === 'move' && (
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
    </div>
  );
}
