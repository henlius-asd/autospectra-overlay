import { getChartInstance } from './WaterfallChart';
import { useCurveStore, useUiStore } from '@/store';
import { bracePath, BRACE_COLOR } from './bracePath';
import { computeYAxisRange } from './computeYAxisRange';
import { normalizeYZoomRange } from './yZoomRange';
import { yToPixel } from './yPixelMath';
import { getTopCurvePixelYAtX, topCurvePeak } from './labelGeometry';
import { clampLabelX, clampLabelY, estimateTextWidth } from './labelClamp';

/**
 * Local reimplementation of WaterfallChart's convertXToPixel.
 * Reads grid from the supplied option so the exported brace X coords
 * match the on-screen positions.
 */
function convertXToPixel(
  xVal: number,
  xRange: [number, number],
  chartWidth: number,
  gridLeft: number,
  gridRight: number,
): number {
  const range = xRange[1] - xRange[0] || 1;
  return gridLeft + ((xVal - xRange[0]) / range) * (chartWidth - gridLeft - gridRight);
}

/**
 * Composite-export: ECharts canvas + brace SVG → single PNG download.
 *
 * Snapshots the live ECharts option, swaps to an export-only option
 * (legend hidden, dataZoom slider removed but `start`/`end` zoom
 * preserved via an `inside` zoom, grid tightened by `showAxes`),
 * captures the canvas, composites the SVG overlay using the shared
 * geometry helpers (no decorations, clamped), then restores in `finally`.
 */
export async function exportChartImage(): Promise<void> {
  const instance = getChartInstance();
  if (!instance) {
    alert('图表尚未渲染');
    return;
  }

  const uiState = useUiStore.getState();
  // @deprecated Axes hidden by default; will be removed in future version
  const showAxes = uiState.showAxes;

  // Snapshot the live option so we can restore EXACTLY after export.
  const snapshot = structuredClone(instance.getOption()) as Record<string, unknown>;
  const origDataZoom = (Array.isArray(snapshot.dataZoom) ? snapshot.dataZoom : []) as Array<Record<string, unknown>>;
  const zoomStart = origDataZoom[0]?.start;
  const zoomEnd = origDataZoom[0]?.end;
  const insideZoom: Record<string, unknown>[] = [{ type: 'inside', xAxisIndex: 0 }];
  if (zoomStart != null) insideZoom[0].start = zoomStart;
  if (zoomEnd != null) insideZoom[0].end = zoomEnd;

  const state = useCurveStore.getState();
  const xRange = useUiStore.getState().xRange;
  const visibleIds = state.stagingOrder.filter((id) => state.visibleCurves[id]);
  const rangeResult = computeYAxisRange(
    visibleIds, state.curves, state.offsets, xRange, state.layerSpacing,
  );

  const yZoomRange = useUiStore.getState().yZoomRange;
  const yInsideZoom: Record<string, unknown> = { id: 'yZoomInside', type: 'inside', yAxisIndex: 0, filterMode: 'none' };
  if (yZoomRange) {
    const clamped = normalizeYZoomRange(yZoomRange[0], yZoomRange[1]);
    yInsideZoom.startValue = clamped[0];
    yInsideZoom.endValue = clamped[1];
  }
  insideZoom.push(yInsideZoom);

  const exportOpt = {
    legend: { show: false },
    dataZoom: insideZoom,
    grid: {
      left: 60,
      right: 48,
      top: showAxes ? 20 : 8,
      bottom: showAxes ? 40 : 8,
    },
  };

  try {
    instance.setOption(exportOpt, {
      replaceMerge: ['legend', 'dataZoom', 'grid'],
      lazyUpdate: false,
    });

    const pixelRatio = 2;
    const url = instance.getDataURL({
      type: 'png',
      pixelRatio,
      backgroundColor: showAxes ? '#fff' : 'transparent',
    });

    const canvas = document.createElement('canvas');
    const chartWidth = instance.getWidth();
    const chartHeight = instance.getHeight();
    canvas.width = chartWidth * pixelRatio;
    canvas.height = chartHeight * pixelRatio;
    const ctx = canvas.getContext('2d')!;

    // 1. ECharts PNG.
    const echartsImg = new Image();
    await new Promise<void>((resolve, reject) => {
      echartsImg.onload = () => resolve();
      echartsImg.onerror = reject;
      echartsImg.src = url;
    });
    ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);

    // 2. Read the (now tightened) grid geometry from the live option.
    const option = instance.getOption() as {
      grid?: { left?: number; right?: number; top?: number; bottom?: number }[];
    };
    const grid = option.grid?.[0];
    const gridLeft = typeof grid?.left === 'number' ? grid.left : 60;
    const gridRight = typeof grid?.right === 'number' ? grid.right : 48;
    const gridTop = typeof grid?.top === 'number' ? grid.top : (showAxes ? 20 : 8);
    const gridBottom = typeof grid?.bottom === 'number' ? grid.bottom : (showAxes ? 40 : 8);

    const { braces } = state;

    const peak = topCurvePeak(rangeResult.rawDataMin, rangeResult.yRangeForLayer);

    let yExportMin = rangeResult.yAxisMin;
    let yExportMax = rangeResult.yAxisMax;
    try {
      const chart = instance as any;
      const extent = chart.getModel()?.getComponent?.('yAxis', 0)?.axis?.scale?.getExtent?.();
      if (extent && extent.length === 2) {
        yExportMin = extent[0];
        yExportMax = extent[1];
      }
    } catch { /* fall back to full range */ }

    const yToPixelExport = (yVal: number) =>
      yToPixel(yVal, {
        yMin: yExportMin, yMax: yExportMax, gridTop, gridBottom, chartHeight,
      });

    const ns = 'http://www.w3.org/2000/svg';
    const svgEl = document.createElementNS(ns, 'svg');
    svgEl.setAttribute('xmlns', ns);
    svgEl.setAttribute('width', String(canvas.width));
    svgEl.setAttribute('height', String(canvas.height));
    svgEl.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);

    // Braces — baseline hugs the top curve peak, clamped to gridTop+8.
    const visibleBraces = braces.filter(
      (b) => b.startX <= xRange[1] && b.endX >= xRange[0],
    );
    const braceYUnscaled = Math.max(gridTop + 8, yToPixelExport(peak) - 14);
    const braceYScaled = braceYUnscaled * pixelRatio;
    for (const brace of visibleBraces) {
      const px1 = convertXToPixel(brace.startX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;
      const px2 = convertXToPixel(brace.endX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;

      const pathEl = document.createElementNS(ns, 'path');
      pathEl.setAttribute('d', bracePath(px1, px2, braceYScaled));
      pathEl.setAttribute('stroke', BRACE_COLOR);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke-width', String(2 * pixelRatio));
      svgEl.appendChild(pathEl);

      const labelText = brace.label || '未命名';
      const textWScaled = estimateTextWidth(labelText, 11) * pixelRatio;
      const textXScaled = clampLabelX(
        (px1 + px2) / 2,
        textWScaled,
        gridLeft * pixelRatio,
        gridRight * pixelRatio,
        canvas.width,
      );
      const textEl = document.createElementNS(ns, 'text');
      textEl.setAttribute('x', String(textXScaled));
      textEl.setAttribute('y', String(braceYScaled - 10 * pixelRatio));
      textEl.setAttribute('font-size', String(11 * pixelRatio));
      textEl.setAttribute('fill', BRACE_COLOR);
      textEl.setAttribute('text-anchor', 'middle');
      textEl.textContent = labelText;
      svgEl.appendChild(textEl);
    }

    // Point labels — text only, baseline = top curve at pl.x, clamped.
    const { pointLabels } = state;
    const visiblePointLabels = pointLabels.filter(
      (pl) => pl.x >= xRange[0] && pl.x <= xRange[1],
    );
    const geometryCtx = {
      visibleIds,
      curves: state.curves,
      offsets: state.offsets,
      layerSpacing: state.layerSpacing,
      yRangeForLayer: rangeResult.yRangeForLayer,
    };
    for (const pl of visiblePointLabels) {
      const labelText = pl.label || '未命名';
      const textW = estimateTextWidth(labelText, 10);
      const rawPx = convertXToPixel(pl.x, xRange, chartWidth, gridLeft, gridRight);
      const px = clampLabelX(rawPx, textW, gridLeft, gridRight, chartWidth);
      const rawPy = getTopCurvePixelYAtX(pl.x, geometryCtx, yToPixelExport) + pl.yOffset;
      const py = clampLabelY(rawPy, 6, gridTop, chartHeight - gridBottom);

      const textEl = document.createElementNS(ns, 'text');
      textEl.setAttribute('x', String(px * pixelRatio));
      textEl.setAttribute('y', String((py + 3) * pixelRatio));
      textEl.setAttribute('font-size', String(10 * pixelRatio));
      textEl.setAttribute('fill', '#333');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.textContent = labelText;
      svgEl.appendChild(textEl);
    }

    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

    const braceImg = new Image();
    await new Promise<void>((resolve, reject) => {
      braceImg.onload = () => resolve();
      braceImg.onerror = reject;
      braceImg.src = svgUrl;
    });
    ctx.drawImage(braceImg, 0, 0, canvas.width, canvas.height);

    // 3. Download.
    const finalUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = finalUrl;
    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    a.download = `chromatogram_${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Restore the live option exactly (legend, dataZoom slider + zoom, grid).
    instance.setOption(
      {
        legend: snapshot.legend,
        dataZoom: snapshot.dataZoom,
        grid: snapshot.grid,
      },
      { replaceMerge: ['legend', 'dataZoom', 'grid'], lazyUpdate: false },
    );
  }
}
