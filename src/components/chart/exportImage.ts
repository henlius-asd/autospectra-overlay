import { getChartInstance, LABEL_PADDING_RATIO } from './WaterfallChart';
import { useCurveStore, useUiStore } from '@/store';
import { bracePath, BRACE_COLOR } from './bracePath';

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
 */
export async function exportChartImage(): Promise<void> {
  const instance = getChartInstance();
  if (!instance) {
    alert('图表尚未渲染');
    return;
  }

  const pixelRatio = 2;
  const uiState = useUiStore.getState();
  const url = instance.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: (!uiState.showAxes) ? 'transparent' : '#fff',
  });

  const canvas = document.createElement('canvas');
  const chartWidth = instance.getWidth();
  const chartHeight = instance.getHeight();
  canvas.width = chartWidth * pixelRatio;
  canvas.height = chartHeight * pixelRatio;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw ECharts PNG onto canvas.
  const echartsImg = new Image();
  await new Promise<void>((resolve, reject) => {
    echartsImg.onload = () => resolve();
    echartsImg.onerror = reject;
    echartsImg.src = url;
  });
  ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);

  // 2. Build a clean brace SVG (no foreignObject, no editing dialog).
  const state = useCurveStore.getState();
  const { braces, visibleCurves, stagingOrder } = state;
  const xRange = useUiStore.getState().xRange;

  // Read Y-axis extent from ECharts model for pixel conversion only.
  // Layer offsets and maxY are computed deterministically from raw data +
  // layerSpacing (same formula as WaterfallChart), NOT from yExtent.
  const chart = instance as any;
  const yExtentRaw = chart.getModel()?.getComponent?.('yAxis', 0)?.axis?.scale?.getExtent?.();
  const yExtent: [number, number] = yExtentRaw?.length === 2
    ? [yExtentRaw[0] as number, yExtentRaw[1] as number]
    : [0, 1];
  const yExtentRange = yExtent[1] - yExtent[0] || 1;

  const visibleIds = stagingOrder.filter((id) => visibleCurves[id]);
  const visibleBraces = braces.filter(
    (b) => b.startX <= xRange[1] && b.endX >= xRange[0],
  );

  const option = instance.getOption() as {
    grid?: { left?: number; right?: number; top?: number | string }[];
  };
  const grid = option.grid?.[0];
  const gridLeft = typeof grid?.left === 'number' ? grid.left : 60;
  const gridRight = typeof grid?.right === 'number' ? grid.right : 48;
  const gridTop = typeof grid?.top === 'number' ? grid.top : (visibleIds.length > 1 ? 50 : 20);

  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.setAttribute('xmlns', ns);
  svgEl.setAttribute('width', String(canvas.width));
  svgEl.setAttribute('height', String(canvas.height));
  svgEl.setAttribute(
    'viewBox',
    `0 0 ${canvas.width} ${canvas.height}`,
  );

  // Calculate maxY deterministically using the same fixed-point formula
  // as WaterfallChart: yRange = rawDataMax / (1 - (n-1) × layerSpacing).
  // This is stable and does NOT depend on ECharts auto-scale.
  const visibleCount = visibleIds.length;
  let rawDataMax = -Infinity;
  for (const id of visibleIds) {
    const curve = state.curves[id];
    const offset = state.offsets[id] ?? { xOffset: 0, yOffset: 0 };
    for (const [x, yVal] of curve.data) {
      if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
        const adjusted = yVal + offset.yOffset;
        if (adjusted > rawDataMax) rawDataMax = adjusted;
      }
    }
  }
  if (!isFinite(rawDataMax) || rawDataMax <= 0) rawDataMax = 1;
  const spacingBudget = (visibleCount - 1) * state.layerSpacing;
  // Match WaterfallChart: include label padding so maxY reflects the reserved
  // top region, not just the curve peak.
  const maxY = (spacingBudget >= 1 ? rawDataMax * 10 : rawDataMax / (1 - spacingBudget))
    * (1 + LABEL_PADDING_RATIO);

  const gridBottom = 60;
  const yPixelRange = chartHeight - gridTop - gridBottom;
  const yPixel = gridTop + ((yExtent[1] - maxY) / yExtentRange) * yPixelRange;
  const braceY = Math.max(gridTop + 5, yPixel - 18) * pixelRatio;
  for (const brace of visibleBraces) {
    const px1 = convertXToPixel(brace.startX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;
    const px2 = convertXToPixel(brace.endX, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;

    const pathEl = document.createElementNS(ns, 'path');
    pathEl.setAttribute('d', bracePath(px1, px2, braceY));
    pathEl.setAttribute('stroke', BRACE_COLOR);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke-width', String(2 * pixelRatio));
    svgEl.appendChild(pathEl);

    const textEl = document.createElementNS(ns, 'text');
    textEl.setAttribute('x', String((px1 + px2) / 2));
    textEl.setAttribute('y', String(braceY - 10 * pixelRatio));
    textEl.setAttribute('font-size', String(11 * pixelRatio));
    textEl.setAttribute('fill', BRACE_COLOR);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.textContent = brace.label || '未命名';
    svgEl.appendChild(textEl);
  }

  // Render point labels
  const { pointLabels } = state;
  const visiblePointLabels = pointLabels.filter(
    (pl) => pl.x >= xRange[0] && pl.x <= xRange[1],
  );

  const topCurvePixelYExport = gridTop + ((yExtent[1] - maxY) / yExtentRange) * yPixelRange;

  for (const pl of visiblePointLabels) {
    const px = convertXToPixel(pl.x, xRange, chartWidth, gridLeft, gridRight) * pixelRatio;
    const py = (topCurvePixelYExport + pl.yOffset) * pixelRatio;
    const curveY = topCurvePixelYExport * pixelRatio;

    const lineEl = document.createElementNS(ns, 'line');
    lineEl.setAttribute('x1', String(px));
    lineEl.setAttribute('y1', String(py + 8 * pixelRatio));
    lineEl.setAttribute('x2', String(px));
    lineEl.setAttribute('y2', String(curveY));
    lineEl.setAttribute('stroke', '#555');
    lineEl.setAttribute('stroke-width', String(1 * pixelRatio));
    lineEl.setAttribute('stroke-dasharray', `${3 * pixelRatio} ${2 * pixelRatio}`);
    svgEl.appendChild(lineEl);

    const dotEl = document.createElementNS(ns, 'circle');
    dotEl.setAttribute('cx', String(px));
    dotEl.setAttribute('cy', String(curveY));
    dotEl.setAttribute('r', String(3 * pixelRatio));
    dotEl.setAttribute('fill', '#555');
    svgEl.appendChild(dotEl);

    const labelW = 60 * pixelRatio;
    const labelH = 18 * pixelRatio;
    const rectEl = document.createElementNS(ns, 'rect');
    rectEl.setAttribute('x', String(px - labelW / 2));
    rectEl.setAttribute('y', String(py - 10 * pixelRatio));
    rectEl.setAttribute('width', String(labelW));
    rectEl.setAttribute('height', String(labelH));
    rectEl.setAttribute('rx', String(3 * pixelRatio));
    rectEl.setAttribute('fill', 'white');
    rectEl.setAttribute('stroke', '#ccc');
    rectEl.setAttribute('stroke-width', String(1 * pixelRatio));
    svgEl.appendChild(rectEl);

    const textEl = document.createElementNS(ns, 'text');
    textEl.setAttribute('x', String(px));
    textEl.setAttribute('y', String(py + 3 * pixelRatio));
    textEl.setAttribute('font-size', String(10 * pixelRatio));
    textEl.setAttribute('fill', '#333');
    textEl.setAttribute('text-anchor', 'middle');
    textEl.textContent = pl.label || '未命名';
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

  // 3. Download the composite PNG.
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
}
